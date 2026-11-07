import { useEffect, useRef, useState, useCallback } from 'react';
import { World3D, World3DControls } from './game/scene/world3d';
import { soundEngine } from './game/audio';
import {
  GameState,
  HistoricalEra,
  GameResources,
  Quest,
  HistoricalDilemma,
  DiscoveryTech,
  DilemmaChoice,
} from './types/game';
import {
  INITIAL_RESOURCES,
  HISTORICAL_DILEMMAS,
  DISCOVERY_TECHS,
  CODEX_ENTRIES,
  INITIAL_QUESTS,
  calculateTurnConsumption,
  applyDilemmaEffects,
  deductTechCost,
  checkVictoryCondition,
  checkDefeatCondition,
} from './game/rules';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { DilemmaModal } from './components/DilemmaModal';
import { TechTreeModal } from './components/TechTreeModal';
import { HarariCodexModal } from './components/HarariCodexModal';
import { AIStudioModal } from './components/AIStudioModal';
import { VictoryModal, GameOverModal, PauseModal } from './components/GameStatusModals';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<World3D | null>(null);

  // Game State
  const [gameState, setGameState] = useState<GameState>('title');
  const [era, setEra] = useState<HistoricalEra>('cognitive');
  const [resources, setResources] = useState<GameResources>(INITIAL_RESOURCES);
  const [turnCount, setTurnCount] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Quests & Tech
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [techs, setTechs] = useState<DiscoveryTech[]>(DISCOVERY_TECHS);
  const [unlockedTechIds, setUnlockedTechIds] = useState<string[]>(['tree_of_knowledge']);

  // Modals
  const [activeDilemma, setActiveDilemma] = useState<HistoricalDilemma | null>(null);
  const [isTechTreeOpen, setIsTechTreeOpen] = useState(false);
  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [isAIStudioOpen, setIsAIStudioOpen] = useState(false);

  // Controls tracker
  const controlsRef = useRef<World3DControls>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    action: false,
  });

  // Sync gameState to document.body.dataset.state for Ultra Mode verification
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Handle pickup collection from 3D world
  const handlePickup = useCallback((type: 'flint' | 'berries' | 'ivory') => {
    soundEngine.playGather();
    setResources(prev => {
      if (type === 'flint') {
        return { ...prev, flintAndStone: prev.flintAndStone + 25, knowledge: prev.knowledge + 5 };
      } else if (type === 'berries') {
        return { ...prev, calories: prev.calories + 45 };
      } else {
        return { ...prev, flintAndStone: prev.flintAndStone + 30, mythPower: prev.mythPower + 20 };
      }
    });
  }, []);

  // 1. Initialize Three.js 3D World once
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const world = new World3D(canvasMountRef.current, handlePickup);
    worldRef.current = world;

    // Check autostart query param
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autostart') === '1') {
      world.setTitleMode(false);
      setGameState('playing');
    }

    // Animation & control tick loop
    let lastTime = performance.now();
    let animId = 0;

    const gameTick = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (worldRef.current) {
        worldRef.current.update(dt, controlsRef.current);
      }
      animId = requestAnimationFrame(gameTick);
    };

    animId = requestAnimationFrame(gameTick);

    return () => {
      cancelAnimationFrame(animId);
      world.dispose();
      worldRef.current = null;
    };
  }, [handlePickup]);

  // 2. Keyboard Listeners on Window
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow modal typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Title screen quick-start on Enter / Space
      if (gameState === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startGame(era);
          return;
        }
      }

      // Playing shortcuts
      if (gameState === 'playing') {
        if (key === 'w' || e.key === 'ArrowUp') controlsRef.current.forward = true;
        if (key === 's' || e.key === 'ArrowDown') controlsRef.current.backward = true;
        if (key === 'a' || e.key === 'ArrowLeft') controlsRef.current.left = true;
        if (key === 'd' || e.key === 'ArrowRight') controlsRef.current.right = true;
        if (e.key === ' ') {
          controlsRef.current.action = true;
          advanceSeason();
        }
        if (key === 'escape' || key === 'p') {
          setGameState('paused');
        }
        if (key === 'm') {
          const muted = soundEngine.toggleMute();
          setIsMuted(muted);
        }
        if (key === 'c') {
          setIsCodexOpen(prev => !prev);
        }
        if (key === 't') {
          setIsTechTreeOpen(prev => !prev);
        }
        if (key === 'v') {
          setIsAIStudioOpen(prev => !prev);
        }
      } else if (gameState === 'paused') {
        if (key === 'escape' || key === 'p') {
          setGameState('playing');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || e.key === 'ArrowUp') controlsRef.current.forward = false;
      if (key === 's' || e.key === 'ArrowDown') controlsRef.current.backward = false;
      if (key === 'a' || e.key === 'ArrowLeft') controlsRef.current.left = false;
      if (key === 'd' || e.key === 'ArrowRight') controlsRef.current.right = false;
      if (e.key === ' ') controlsRef.current.action = false;
    };

    const handleBlur = () => {
      // Clear all held inputs on blur so keys never stick
      controlsRef.current.forward = false;
      controlsRef.current.backward = false;
      controlsRef.current.left = false;
      controlsRef.current.right = false;
      controlsRef.current.action = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState, era]);

  // Start game from title
  const startGame = (startingEra: HistoricalEra) => {
    soundEngine.playDrum();
    setEra(startingEra);
    if (worldRef.current) {
      worldRef.current.setTitleMode(false);
    }
    setGameState('playing');
  };

  // Advance Season / Turn
  const advanceSeason = useCallback(() => {
    soundEngine.playStep();
    setResources(prevRes => {
      const consumption = calculateTurnConsumption(prevRes);
      const newRes: GameResources = {
        ...prevRes,
        calories: consumption.newCalories,
        population: Math.max(0, prevRes.population + consumption.populationDelta),
        knowledge: prevRes.knowledge + 2,
        mythPower: Math.max(0, prevRes.mythPower - 1),
      };

      // Check defeat
      if (checkDefeatCondition(newRes)) {
        setGameState('gameover');
      }

      return newRes;
    });

    setTurnCount(prev => prev + 1);

    // Random or milestone dilemma trigger
    if (turnCount % 3 === 0 && !activeDilemma) {
      const availableDilemmas = HISTORICAL_DILEMMAS.filter(d => d.era === era);
      if (availableDilemmas.length > 0) {
        const randDilemma = availableDilemmas[Math.floor(Math.random() * availableDilemmas.length)];
        setActiveDilemma(randDilemma);
        soundEngine.playDrum();
      }
    }
  }, [turnCount, era, activeDilemma]);

  // Select Dilemma Choice
  const handleSelectChoice = (choice: DilemmaChoice) => {
    soundEngine.playDrum();
    const updated = applyDilemmaEffects(resources, choice.effects);
    setResources(updated);

    if (choice.unlockTechId && !unlockedTechIds.includes(choice.unlockTechId)) {
      setUnlockedTechIds(prev => [...prev, choice.unlockTechId!]);
      setTechs(prev =>
        prev.map(t => (t.id === choice.unlockTechId ? { ...t, unlocked: true } : t))
      );
    }

    setActiveDilemma(null);

    // Check Victory
    if (checkVictoryCondition(unlockedTechIds, updated)) {
      soundEngine.playVictory();
      setGameState('victory');
    }
  };

  // Unlock Technology
  const handleUnlockTech = (tech: DiscoveryTech) => {
    soundEngine.playDiscovery();
    const afterDeduct = deductTechCost(tech, resources);
    setResources(afterDeduct);

    const newUnlocked = [...unlockedTechIds, tech.id];
    setUnlockedTechIds(newUnlocked);
    setTechs(prev => prev.map(t => (t.id === tech.id ? { ...t, unlocked: true } : t)));

    // Era progression checks
    if (tech.id === 'emmer_cultivation' && era === 'cognitive') {
      setEra('agricultural');
    }
    if (tech.id === 'scientific_method' && era !== 'scientific') {
      setEra('scientific');
    }

    // Check Victory
    if (checkVictoryCondition(newUnlocked, afterDeduct)) {
      soundEngine.playVictory();
      setGameState('victory');
    }
  };

  // Evaluate Active Quest
  const activeQuest = quests.find(q => !q.completed) || null;
  useEffect(() => {
    if (!activeQuest) return;
    if (activeQuest.checkCompletion(resources, unlockedTechIds)) {
      soundEngine.playMythSound();
      setQuests(prev =>
        prev.map(q => (q.id === activeQuest.id ? { ...q, completed: true } : q))
      );
    }
  }, [resources, unlockedTechIds, activeQuest]);

  // Restart Game
  const handleRestart = () => {
    setResources(INITIAL_RESOURCES);
    setTurnCount(1);
    setQuests(INITIAL_QUESTS);
    setTechs(DISCOVERY_TECHS);
    setUnlockedTechIds(['tree_of_knowledge']);
    setActiveDilemma(null);
    setIsTechTreeOpen(false);
    setIsCodexOpen(false);
    setIsAIStudioOpen(false);
    if (worldRef.current) {
      worldRef.current.setTitleMode(false);
    }
    setGameState('playing');
  };

  const handleReturnToTitle = () => {
    setResources(INITIAL_RESOURCES);
    setTurnCount(1);
    if (worldRef.current) {
      worldRef.current.setTitleMode(true);
    }
    setGameState('title');
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-stone-950 text-stone-100 select-none">
      {/* Isolated Three.js WebGL Container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 z-0 w-full h-full"
        style={{ pointerEvents: 'auto' }}
      />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={startGame}
          selectedEra={era}
          onSelectEra={setEra}
        />
      )}

      {/* In-Game World-Matched HUD */}
      {gameState === 'playing' && (
        <HUD
          resources={resources}
          era={era}
          activeQuest={activeQuest}
          onOpenDilemmas={() => {
            const available = HISTORICAL_DILEMMAS.filter(d => d.era === era);
            setActiveDilemma(available[0] || HISTORICAL_DILEMMAS[0]);
          }}
          onOpenTechTree={() => setIsTechTreeOpen(true)}
          onOpenCodex={() => setIsCodexOpen(true)}
          onOpenAIStudio={() => setIsAIStudioOpen(true)}
          onToggleMute={() => setIsMuted(soundEngine.toggleMute())}
          isMuted={isMuted}
          onPause={() => setGameState('paused')}
          onEndTurn={advanceSeason}
          turnCount={turnCount}
        />
      )}

      {/* Tribal Dilemma Modal */}
      {activeDilemma && (
        <DilemmaModal
          dilemma={activeDilemma}
          onSelectChoice={handleSelectChoice}
          onClose={() => setActiveDilemma(null)}
        />
      )}

      {/* Discovery & Tech Tree Modal */}
      {isTechTreeOpen && (
        <TechTreeModal
          techs={techs}
          resources={resources}
          onUnlockTech={handleUnlockTech}
          onClose={() => setIsTechTreeOpen(false)}
        />
      )}

      {/* Harari Sapiens Codex Modal */}
      {isCodexOpen && (
        <HarariCodexModal
          entries={CODEX_ENTRIES}
          onClose={() => setIsCodexOpen(false)}
        />
      )}

      {/* AI Studio Modal (Image 1K/2K/4K + Omni Flash 16:9/9:16 Video + Chronicler) */}
      {isAIStudioOpen && (
        <AIStudioModal
          era={era}
          onClose={() => setIsAIStudioOpen(false)}
        />
      )}

      {/* Status Modals: Victory / Game Over / Paused */}
      {gameState === 'victory' && (
        <VictoryModal
          resources={resources}
          turnCount={turnCount}
          onRestart={handleRestart}
        />
      )}

      {gameState === 'gameover' && (
        <GameOverModal
          resources={resources}
          turnCount={turnCount}
          onRestart={handleRestart}
        />
      )}

      {gameState === 'paused' && (
        <PauseModal
          onResume={() => setGameState('playing')}
          onRestart={handleRestart}
          onTitle={handleReturnToTitle}
          onToggleMute={() => setIsMuted(soundEngine.toggleMute())}
          isMuted={isMuted}
        />
      )}
    </main>
  );
}
