import { useEffect, useRef, useState, useCallback } from 'react';
import { World3D, World3DControls } from './game/scene/world3d';
import { soundEngine } from './game/audio';
import {
  GameState,
  HistoricalEra,
  SapiensLandscape,
  GameResources,
  Quest,
  HistoricalDilemma,
  DiscoveryTech,
  DilemmaChoice,
  Achievement,
  RunStats,
} from './types/game';
import {
  INITIAL_RESOURCES,
  HISTORICAL_DILEMMAS,
  DISCOVERY_TECHS,
  CODEX_ENTRIES,
  INITIAL_QUESTS,
  INITIAL_ACHIEVEMENTS,
  checkNewAchievements,
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
import { AchievementToast } from './components/AchievementToast';
import { AchievementsModal } from './components/AchievementsModal';
import { VictoryModal, GameOverModal, PauseModal } from './components/GameStatusModals';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<World3D | null>(null);

  // Game State
  const [gameState, setGameState] = useState<GameState>('title');
  const [era, setEra] = useState<HistoricalEra>('cognitive');
  const [landscape, setLandscape] = useState<SapiensLandscape>('river_meadow');
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
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);

  // Achievements State & Fun Facts
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [activeToast, setActiveToast] = useState<Achievement | null>(null);
  const [toastQueue, setToastQueue] = useState<Achievement[]>([]);

  // Temple Run Locomotion & Stats
  const [runStats, setRunStats] = useState<RunStats>({
    pickupsCollected: 0,
    jumpsCount: 0,
    slidesCount: 0,
    distanceTraveled: 0,
    comboStreak: 0,
    maxCombo: 0,
    sprintEnergy: 100,
    score: 0,
    currentLane: 0,
    activePowerUp: null,
    powerUpTimeLeft: 0,
    beastAlert: false,
    stumbles: 0,
    landscape: 'river_meadow',
    mythSurge: 0,
  });
  const [isSprinting, setIsSprinting] = useState(false);

  // Controls tracker
  const controlsRef = useRef<World3DControls>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    action: false,
    sprint: false,
    jump: false,
    slide: false,
  });

  // Sync gameState to document.body.dataset.state for Ultra Mode verification
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Check achievements helper
  const checkAchievements = useCallback((
    curRes: GameResources,
    curTechs: string[],
    curStats: RunStats
  ) => {
    setAchievements(prevAchs => {
      const { updatedAchievements, newlyUnlocked } = checkNewAchievements(
        curRes,
        curTechs,
        curStats,
        prevAchs,
        turnCount
      );

      if (newlyUnlocked.length > 0) {
        soundEngine.playAchievementFanfare();
        setToastQueue(prevQ => [...prevQ, ...newlyUnlocked]);
      }

      return updatedAchievements;
    });
  }, [turnCount]);

  // Process next toast in queue
  useEffect(() => {
    if (!activeToast && toastQueue.length > 0) {
      const nextToast = toastQueue[0];
      setActiveToast(nextToast);
      setToastQueue(prev => prev.slice(1));
    }
  }, [activeToast, toastQueue]);

  const handleDismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  // Handle pickup collection from 3D world
  const handlePickup = useCallback((type: 'flint' | 'berries' | 'ivory' | 'amber') => {
    if (type === 'amber') {
      setRunStats(prev => {
        const nextStreak = prev.comboStreak + 1;
        soundEngine.playGemCollect(nextStreak);
        const updated = {
          ...prev,
          pickupsCollected: prev.pickupsCollected + 1,
          comboStreak: nextStreak,
          maxCombo: Math.max(prev.maxCombo, nextStreak),
          sprintEnergy: Math.min(100, prev.sprintEnergy + 10),
        };
        setResources(r => {
          const updatedR = {
            ...r,
            calories: r.calories + 15 * nextStreak,
            knowledge: r.knowledge + 2,
          };
          checkAchievements(updatedR, unlockedTechIds, updated);
          return updatedR;
        });
        return updated;
      });
    } else {
      soundEngine.playGather();
      setRunStats(prev => {
        const updated = {
          ...prev,
          pickupsCollected: prev.pickupsCollected + 1,
          comboStreak: prev.comboStreak + 1,
        };
        setResources(r => {
          let updatedR = { ...r };
          if (type === 'flint') {
            updatedR = { ...r, flintAndStone: r.flintAndStone + 25, knowledge: r.knowledge + 5 };
          } else if (type === 'berries') {
            updatedR = { ...r, calories: r.calories + 45 };
          } else {
            updatedR = { ...r, flintAndStone: r.flintAndStone + 30, mythPower: r.mythPower + 20 };
          }
          checkAchievements(updatedR, unlockedTechIds, updated);
          return updatedR;
        });
        return updated;
      });
    }
  }, [checkAchievements, unlockedTechIds]);

  // Handle Jump & Slide callbacks
  const handleJump = useCallback(() => {
    soundEngine.playJumpSound();
    setRunStats(prev => {
      const updated = { ...prev, jumpsCount: prev.jumpsCount + 1 };
      setResources(curR => {
        setAchievements(prevAchs => {
          const { updatedAchievements, newlyUnlocked } = checkNewAchievements(
            curR,
            unlockedTechIds,
            updated,
            prevAchs,
            turnCount
          );
          if (newlyUnlocked.length > 0) {
            soundEngine.playAchievementFanfare();
            setToastQueue(prevQ => [...prevQ, ...newlyUnlocked]);
          }
          return updatedAchievements;
        });
        return curR;
      });
      return updated;
    });
  }, [unlockedTechIds, turnCount]);

  const handleSlide = useCallback(() => {
    soundEngine.playSlideSound();
    setRunStats(prev => {
      const updated = { ...prev, slidesCount: prev.slidesCount + 1 };
      setResources(curR => {
        setAchievements(prevAchs => {
          const { updatedAchievements, newlyUnlocked } = checkNewAchievements(
            curR,
            unlockedTechIds,
            updated,
            prevAchs,
            turnCount
          );
          if (newlyUnlocked.length > 0) {
            soundEngine.playAchievementFanfare();
            setToastQueue(prevQ => [...prevQ, ...newlyUnlocked]);
          }
          return updatedAchievements;
        });
        return curR;
      });
      return updated;
    });
  }, [unlockedTechIds, turnCount]);

  // Temple Run Runner Callbacks
  const handlePowerUp = useCallback((type: 'magnet' | 'shield' | 'surge') => {
    soundEngine.playPowerup();
    setRunStats(prev => ({
      ...prev,
      activePowerUp: type,
      powerUpTimeLeft: type === 'surge' ? 6.5 : 8.5,
    }));
  }, []);

  const handleObstacleHit = useCallback((shieldAbsorbed: boolean) => {
    if (shieldAbsorbed) {
      soundEngine.playShieldBreak();
      setRunStats(prev => ({
        ...prev,
        activePowerUp: null,
        powerUpTimeLeft: 0,
      }));
    } else {
      soundEngine.playStumble();
      soundEngine.playBeastRoar();
      setRunStats(prev => {
        const nextStumbles = prev.stumbles + 1;
        if (prev.beastAlert) {
          setResources(r => ({
            ...r,
            calories: Math.max(0, r.calories - 35),
            population: Math.max(1, r.population - 1),
          }));
        }
        return {
          ...prev,
          comboStreak: 0,
          stumbles: nextStumbles,
          beastAlert: true,
        };
      });
    }
  }, []);

  const handleLaneChange = useCallback((lane: number) => {
    soundEngine.playLaneShift();
    setRunStats(prev => ({ ...prev, currentLane: lane }));
  }, []);

  const handleDistanceUpdate = useCallback((distance: number, _speed: number) => {
    setRunStats(prev => ({
      ...prev,
      distanceTraveled: distance,
      score: Math.floor(distance * 10) + prev.pickupsCollected * 100,
    }));
  }, []);

  const handleBeastAlert = useCallback((isAlert: boolean) => {
    setRunStats(prev => ({ ...prev, beastAlert: isAlert }));
  }, []);

  // 1. Initialize Three.js 3D World once
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const world = new World3D(canvasMountRef.current, {
      onPickup: handlePickup,
      onPowerUp: handlePowerUp,
      onObstacleHit: handleObstacleHit,
      onJump: handleJump,
      onSlide: handleSlide,
      onLaneChange: handleLaneChange,
      onDistanceUpdate: handleDistanceUpdate,
      onBeastAlert: handleBeastAlert,
      onDilemmaGate: (_dilemmaId, choiceIndex) => {
        soundEngine.playDrum();
        const available = HISTORICAL_DILEMMAS.filter(d => d.era === era);
        const dilemma = available[0] || HISTORICAL_DILEMMAS[0];
        if (dilemma && dilemma.choices[choiceIndex]) {
          handleSelectChoice(dilemma.choices[choiceIndex]);
        }
      },
    });
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
  }, [handlePickup, handleJump, handleSlide, handlePowerUp, handleObstacleHit, handleLaneChange, handleDistanceUpdate, handleBeastAlert, era]);

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
        if (e.key === 'Shift') {
          controlsRef.current.sprint = true;
          setIsSprinting(true);
        }
        if (key === 'a' || e.key === 'ArrowLeft') {
          worldRef.current?.shiftLane(-1);
          controlsRef.current.left = true;
        }
        if (key === 'd' || e.key === 'ArrowRight') {
          worldRef.current?.shiftLane(1);
          controlsRef.current.right = true;
        }
        if (key === 'w' || e.key === 'ArrowUp' || e.key === ' ') {
          worldRef.current?.triggerJump();
          controlsRef.current.jump = true;
        }
        if (key === 's' || e.key === 'ArrowDown' || key === 'c') {
          worldRef.current?.triggerSlide();
          controlsRef.current.slide = true;
        }

        if (key === 'escape' || key === 'p') {
          setGameState('paused');
        }
        if (key === 'm') {
          const muted = soundEngine.toggleMute();
          setIsMuted(muted);
        }
        if (key === 'x') {
          setIsCodexOpen(prev => !prev);
        }
        if (key === 't') {
          setIsTechTreeOpen(prev => !prev);
        }
        if (key === 'v') {
          setIsAIStudioOpen(prev => !prev);
        }
        if (key === 'j') {
          setIsAchievementsOpen(prev => !prev);
        }
      } else if (gameState === 'paused') {
        if (key === 'escape' || key === 'p') {
          setGameState('playing');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.key === 'Shift') {
        controlsRef.current.sprint = false;
        setIsSprinting(false);
      }
      if (key === 'w' || e.key === 'ArrowUp') controlsRef.current.forward = false;
      if (key === 's' || e.key === 'ArrowDown') controlsRef.current.backward = false;
      if (key === 'a' || e.key === 'ArrowLeft') controlsRef.current.left = false;
      if (key === 'd' || e.key === 'ArrowRight') controlsRef.current.right = false;
      if (e.key === ' ') {
        controlsRef.current.jump = false;
        controlsRef.current.action = false;
      }
      if (key === 'c') {
        controlsRef.current.slide = false;
      }
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
  const startGame = (startingEra: HistoricalEra, startingLandscape: SapiensLandscape = 'river_meadow') => {
    soundEngine.playDrum();
    setEra(startingEra);
    setLandscape(startingLandscape);
    if (worldRef.current) {
      worldRef.current.setTitleMode(false);
      worldRef.current.setLandscape(startingLandscape);
    }
    setGameState('playing');
  };

  // Landscape Switcher on the fly
  const handleSelectLandscape = (newLandscape: SapiensLandscape) => {
    soundEngine.playMythSound();
    setLandscape(newLandscape);
    if (worldRef.current) {
      worldRef.current.setLandscape(newLandscape);
    }
    setRunStats(prev => ({ ...prev, landscape: newLandscape }));
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

      checkAchievements(newRes, unlockedTechIds, runStats);
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

    let nextUnlocked = unlockedTechIds;
    if (choice.unlockTechId && !unlockedTechIds.includes(choice.unlockTechId)) {
      nextUnlocked = [...unlockedTechIds, choice.unlockTechId!];
      setUnlockedTechIds(nextUnlocked);
      setTechs(prev =>
        prev.map(t => (t.id === choice.unlockTechId ? { ...t, unlocked: true } : t))
      );
    }

    checkAchievements(updated, nextUnlocked, runStats);
    setActiveDilemma(null);

    // Check Victory
    if (checkVictoryCondition(nextUnlocked, updated)) {
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
    checkAchievements(afterDeduct, newUnlocked, runStats);

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
          selectedLandscape={landscape}
          onSelectLandscape={setLandscape}
        />
      )}

      {/* In-Game World-Matched HUD */}
      {gameState === 'playing' && (
        <HUD
          resources={resources}
          era={era}
          activeQuest={activeQuest}
          runStats={runStats}
          currentLandscape={landscape}
          onSelectLandscape={handleSelectLandscape}
          onOpenDilemmas={() => {
            const available = HISTORICAL_DILEMMAS.filter(d => d.era === era);
            setActiveDilemma(available[0] || HISTORICAL_DILEMMAS[0]);
          }}
          onOpenTechTree={() => setIsTechTreeOpen(true)}
          onOpenCodex={() => setIsCodexOpen(true)}
          onOpenAchievements={() => setIsAchievementsOpen(true)}
          unlockedAchievementsCount={achievements.filter(a => a.unlocked).length}
          onTriggerJump={() => {
            worldRef.current?.triggerJump();
          }}
          onTriggerSlide={() => {
            worldRef.current?.triggerSlide();
          }}
          onTriggerLaneLeft={() => {
            worldRef.current?.shiftLane(-1);
          }}
          onTriggerLaneRight={() => {
            worldRef.current?.shiftLane(1);
          }}
          onToggleSprint={() => {
            const nextSprint = !isSprinting;
            setIsSprinting(nextSprint);
            controlsRef.current.sprint = nextSprint;
          }}
          isSprinting={isSprinting}
          onToggleMute={() => setIsMuted(soundEngine.toggleMute())}
          isMuted={isMuted}
          onPause={() => setGameState('paused')}
          onEndTurn={advanceSeason}
          turnCount={turnCount}
        />
      )}

      {/* Achievement Unlocked Toast Overlay */}
      <AchievementToast
        achievement={activeToast}
        onDismiss={handleDismissToast}
      />

      {/* Achievements & Fun Facts Modal */}
      {isAchievementsOpen && (
        <AchievementsModal
          achievements={achievements}
          onClose={() => setIsAchievementsOpen(false)}
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
