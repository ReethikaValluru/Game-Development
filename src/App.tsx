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
  DynamicWorldEvent,
  SimState,
  SimRackState,
  SimProductType,
  SimCheckoutState,
} from './types/game';
import {
  INITIAL_RESOURCES,
  HISTORICAL_DILEMMAS,
  DISCOVERY_TECHS,
  CODEX_ENTRIES,
  INITIAL_QUESTS,
  INITIAL_ACHIEVEMENTS,
  SIM_CATALOG,
  SIM_RACK_COST,
  SIM_EXPANSIONS,
  SIM_STAFF_OPTIONS,
  getLandscapeEvents,
  calculateOrderCost,
  calculateTradeReward,
  applyCampXp,
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
import { CampTerminalModal } from './components/CampTerminalModal';
import { AchievementToast } from './components/AchievementToast';
import { AchievementsModal } from './components/AchievementsModal';
import { VictoryModal, GameOverModal, PauseModal } from './components/GameStatusModals';

const INITIAL_SIM_STATE: SimState = {
  shells: 140,
  campLevel: 1,
  campXp: 0,
  nextLevelXp: 100,
  expansionTier: 1,
  isCampOpen: true,
  dayNumber: 1,
  carriedCrate: null,
  placementMode: null,
  dockCratesCount: 2,
  queueLength: 0,
  tradesCompleted: 0,
  totalShellsEarned: 0,
  prices: {
    berries: SIM_CATALOG.berries.baseBarterPrice,
    flint: SIM_CATALOG.flint.baseBarterPrice,
    wheat: SIM_CATALOG.wheat.baseBarterPrice,
    ivory: SIM_CATALOG.ivory.baseBarterPrice,
  },
  restockerHired: false,
  bartererHired: false,
  activePrompt: null,
  activeCheckout: null,
  feedMessages: [
    {
      id: 'welcome',
      text: 'Walk to the Riverbank Dock [E], carry crates to racks, then barter at the Counter!',
      tone: 'myth',
    },
  ],
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<World3D | null>(null);

  // Core Game State
  const [gameState, setGameState] = useState<GameState>('title');
  const [era, setEra] = useState<HistoricalEra>('cognitive');
  const [landscape, setLandscape] = useState<SapiensLandscape>('river_meadow');
  const [resources, setResources] = useState<GameResources>(INITIAL_RESOURCES);
  const [turnCount, setTurnCount] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [firstPerson, setFirstPerson] = useState(false);

  // Simulator State
  const [simState, setSimState] = useState<SimState>(INITIAL_SIM_STATE);
  const [racks, setRacks] = useState<SimRackState[]>([]);

  // Quests & Tech
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [techs, setTechs] = useState<DiscoveryTech[]>(DISCOVERY_TECHS);
  const [unlockedTechIds, setUnlockedTechIds] = useState<string[]>(['tree_of_knowledge']);

  // Modals
  const [activeDilemma, setActiveDilemma] = useState<HistoricalDilemma | null>(null);
  const [isTechTreeOpen, setIsTechTreeOpen] = useState(false);
  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);

  // Achievements & Toasts
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [activeToast, setActiveToast] = useState<Achievement | null>(null);
  const [toastQueue, setToastQueue] = useState<Achievement[]>([]);

  // World Events, Bump/Respawn & Myth Surge Stats
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
    bumpCount: 0,
    maxBumps: 2,
    isRespawning: false,
    activeEvent: null,
  });

  // Live Keyboard Controls Ref
  const controlsRef = useRef<World3DControls>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jump: false,
    turnLeft: false,
    turnRight: false,
  });

  const respawnTimerRef = useRef<number | null>(null);
  const eventCycleIndexRef = useRef<number>(0);

  // Sync gameState to body dataset
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  const pushFeed = useCallback((text: string, tone: 'good' | 'warn' | 'myth' = 'good') => {
    setSimState(prev => ({
      ...prev,
      feedMessages: [
        ...prev.feedMessages.slice(-4),
        { id: `${Date.now()}_${Math.random()}`, text, tone },
      ],
    }));
  }, []);

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

  // Keep mutable refs for single-mount World3D callbacks
  const activeEventRef = useRef<DynamicWorldEvent | null>(null);
  activeEventRef.current = runStats.activeEvent;
  const unlockedTechsRef = useRef<string[]>(unlockedTechIds);
  unlockedTechsRef.current = unlockedTechIds;
  const pushFeedRef = useRef(pushFeed);
  pushFeedRef.current = pushFeed;
  const checkAchievementsRef = useRef(checkAchievements);
  checkAchievementsRef.current = checkAchievements;

  // Toast Queue Processor
  useEffect(() => {
    if (!activeToast && toastQueue.length > 0) {
      setActiveToast(toastQueue[0]);
      setToastQueue(prev => prev.slice(1));
    }
  }, [activeToast, toastQueue]);

  // 1. Initialize Three.js 3D Simulator World ONCE on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const world = new World3D(canvasMountRef.current, {
      onPromptChange: prompt => {
        setSimState(prev => ({ ...prev, activePrompt: prompt }));
      },
      onCarriedChange: carried => {
        setSimState(prev => ({ ...prev, carriedCrate: carried }));
      },
      onDockCountChange: count => {
        setSimState(prev => ({ ...prev, dockCratesCount: count }));
      },
      onRacksUpdate: updatedRacks => {
        setRacks(updatedRacks);
      },
      onQueueChange: (queueLen, frontCheckout) => {
        setSimState(prev => ({
          ...prev,
          queueLength: queueLen,
          activeCheckout: frontCheckout,
        }));
      },
      onTradeCompleted: (checkout: SimCheckoutState) => {
        const reward = calculateTradeReward(checkout.items, activeEventRef.current);
        setSimState(prev => {
          const xpRes = applyCampXp(prev.campLevel, prev.campXp, prev.nextLevelXp, reward.xp);
          if (xpRes.leveledUp) {
            pushFeedRef.current(`Camp reached Level ${xpRes.level}!`, 'myth');
          }
          return {
            ...prev,
            shells: prev.shells + reward.shells,
            campLevel: xpRes.level,
            campXp: xpRes.xp,
            nextLevelXp: xpRes.nextLevelXp,
            tradesCompleted: prev.tradesCompleted + 1,
            totalShellsEarned: prev.totalShellsEarned + reward.shells,
          };
        });
        pushFeedRef.current(
          `Traded with ${checkout.customerName} (${checkout.customerTribe}): +${reward.shells} Shells, +${reward.knowledge} Knowledge`,
          'good'
        );
        setRunStats(prev => {
          const updated = {
            ...prev,
            pickupsCollected: prev.pickupsCollected + checkout.totalItems,
            comboStreak: prev.comboStreak + 1,
            maxCombo: Math.max(prev.maxCombo, prev.comboStreak + 1),
            mythSurge: Math.min(100, prev.mythSurge + reward.mythSurgeGain),
          };
          setResources(r => {
            const nextRes = {
              ...r,
              knowledge: r.knowledge + reward.knowledge,
              mythPower: r.mythPower + reward.myth,
              calories: r.calories + 12,
              population: Math.min(r.dunbarLimit, r.population + 1),
            };
            checkAchievementsRef.current(nextRes, unlockedTechsRef.current, updated);
            return nextRes;
          });
          return updated;
        });
      },
      onCratePickedUp: (productType, units) => {
        pushFeedRef.current(`Picked up ${SIM_CATALOG[productType].name} crate (${units} units)`, 'good');
      },
      onRackStocked: (productType, unitsAdded) => {
        pushFeedRef.current(`Stocked +${unitsAdded} ${SIM_CATALOG[productType].name} onto rack`, 'good');
        setRunStats(prev => {
          const updated = { ...prev, pickupsCollected: prev.pickupsCollected + 1 };
          setResources(r => {
            const nextRes = { ...r, calories: r.calories + 10, flintAndStone: r.flintAndStone + 5 };
            checkAchievementsRef.current(nextRes, unlockedTechsRef.current, updated);
            return nextRes;
          });
          return updated;
        });
      },
      onForageCollected: productType => {
        setRunStats(prev => ({ ...prev, pickupsCollected: prev.pickupsCollected + 1 }));
        setResources(r => ({
          ...r,
          calories: productType === 'berries' ? r.calories + 25 : r.calories,
          flintAndStone: productType === 'flint' ? r.flintAndStone + 20 : r.flintAndStone,
        }));
      },
      onRackPlaced: (_x, _z, _rot, productType) => {
        setSimState(prev => ({ ...prev, placementMode: null }));
        pushFeedRef.current(`Constructed new ${SIM_CATALOG[productType].name.split(' ')[0]} Rack!`, 'myth');
      },
      onOpenTerminal: () => {
        setIsTerminalOpen(true);
      },
      onBump: (_hazardType, bumpNumber, isSecondBump) => {
        if (isSecondBump) {
          pushFeedRef.current('2nd hazard hit! Respawning at Central Hearth.', 'warn');
          setRunStats(prev => ({
            ...prev,
            bumpCount: 0,
            isRespawning: true,
            stumbles: prev.stumbles + 1,
          }));
          if (respawnTimerRef.current) window.clearTimeout(respawnTimerRef.current);
          respawnTimerRef.current = window.setTimeout(() => {
            setRunStats(p => ({ ...p, isRespawning: false }));
          }, 3200);
        } else {
          pushFeedRef.current('Wilderness Bump 1/2! Step back from north hazards!', 'warn');
          setRunStats(prev => ({
            ...prev,
            bumpCount: bumpNumber,
            stumbles: prev.stumbles + 1,
          }));
        }
      },
      onRespawn: () => {
        setRunStats(prev => ({ ...prev, bumpCount: 0, isRespawning: true }));
        if (respawnTimerRef.current) window.clearTimeout(respawnTimerRef.current);
        respawnTimerRef.current = window.setTimeout(() => {
          setRunStats(p => ({ ...p, isRespawning: false }));
        }, 3200);
      },
      onFeedMessage: (text, tone) => {
        pushFeedRef.current(text, tone);
      },
      onMythTrigger: amount => {
        setRunStats(prev => ({
          ...prev,
          mythSurge: Math.min(100, prev.mythSurge + amount),
        }));
      },
    });

    worldRef.current = world;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autostart') === '1') {
      world.setTitleMode(false);
      setGameState('playing');
    }

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
      if (respawnTimerRef.current) window.clearTimeout(respawnTimerRef.current);
      world.dispose();
      worldRef.current = null;
    };
  }, []);

  // Trigger Myth Surge manually or on myth increases
  const handleTriggerMythSurge = useCallback(() => {
    worldRef.current?.triggerMythSurge(30, 1.8);
    soundEngine.playAchievementFanfare();
    pushFeed('Shared Myth Surge ignited! Band unity & knowledge boosted.', 'myth');
    setResources(r => ({
      ...r,
      mythPower: r.mythPower + 30,
      knowledge: r.knowledge + 12,
      dunbarLimit: r.dunbarLimit + 15,
    }));
  }, [pushFeed]);

  // Trigger Location-Specific Dynamic Environmental Event
  const handleTriggerSeasonEvent = useCallback(() => {
    const events = getLandscapeEvents(landscape);
    if (!events || events.length === 0) return;

    const eventIndex = eventCycleIndexRef.current % events.length;
    eventCycleIndexRef.current += 1;

    const chosenEvent: DynamicWorldEvent = {
      ...events[eventIndex],
      active: true,
      remainingTime: events[eventIndex].duration,
    };

    setRunStats(prev => ({ ...prev, activeEvent: chosenEvent }));
    pushFeed(`World Event: ${chosenEvent.title}`, 'myth');

    if (worldRef.current) {
      worldRef.current.setEventWeather(chosenEvent.weatherStyle, true);
      if (chosenEvent.animalMigration) {
        worldRef.current.triggerAnimalMigration(chosenEvent.animalMigration, true);
      } else {
        worldRef.current.triggerAnimalMigration('gazelles', false);
      }
    }
  }, [landscape, pushFeed]);

  // Periodic Automatic Environmental Event
  useEffect(() => {
    if (gameState !== 'playing' || runStats.activeEvent?.active) return;
    const autoTimer = window.setTimeout(() => {
      handleTriggerSeasonEvent();
    }, 22000);
    return () => window.clearTimeout(autoTimer);
  }, [gameState, runStats.activeEvent?.active, handleTriggerSeasonEvent]);

  // Event Countdown
  useEffect(() => {
    if (!runStats.activeEvent || !runStats.activeEvent.active) return;
    const timer = setInterval(() => {
      setRunStats(prev => {
        if (!prev.activeEvent || !prev.activeEvent.active) return prev;
        const nextRem = prev.activeEvent.remainingTime - 1;
        if (nextRem <= 0) {
          worldRef.current?.setEventWeather('clear_sun', false);
          worldRef.current?.triggerAnimalMigration('gazelles', false);
          return { ...prev, activeEvent: null };
        }
        return { ...prev, activeEvent: { ...prev.activeEvent, remainingTime: nextRem } };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [runStats.activeEvent?.active]);

  // Start Game from Title
  const startGame = useCallback((startingEra: HistoricalEra, startingLandscape: SapiensLandscape = 'river_meadow') => {
    soundEngine.playDrum();
    setEra(startingEra);
    setLandscape(startingLandscape);
    if (worldRef.current) {
      worldRef.current.setTitleMode(false);
      worldRef.current.setLandscape(startingLandscape);
    }
    setGameState('playing');
  }, []);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();

      if (gameState === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startGame(era, landscape);
        }
        return;
      }

      if (gameState === 'playing') {
        if (e.key === 'Tab' || key === 'b') {
          e.preventDefault();
          setIsTerminalOpen(prev => !prev);
          return;
        }

        if (key === 'escape') {
          if (simState.placementMode) {
            worldRef.current?.cancelPlacementMode();
            setSimState(prev => ({ ...prev, placementMode: null }));
            return;
          }
          if (isTerminalOpen || isTechTreeOpen || isCodexOpen || isAchievementsOpen || activeDilemma) {
            setIsTerminalOpen(false);
            setIsTechTreeOpen(false);
            setIsCodexOpen(false);
            setIsAchievementsOpen(false);
            setActiveDilemma(null);
            return;
          }
          setGameState('paused');
          return;
        }

        // Disable movement keys when modal is open
        if (isTerminalOpen || isTechTreeOpen || isCodexOpen || isAchievementsOpen || activeDilemma) {
          return;
        }

        if (e.key === 'Shift') controlsRef.current.sprint = true;
        if (key === 'w' || e.key === 'ArrowUp') controlsRef.current.forward = true;
        if (key === 's' || e.key === 'ArrowDown') controlsRef.current.backward = true;
        if (key === 'a' || e.key === 'ArrowLeft') controlsRef.current.left = true;
        if (key === 'd' || e.key === 'ArrowRight') controlsRef.current.right = true;
        if (key === 'q') controlsRef.current.turnLeft = true;
        if (key === 'z') controlsRef.current.turnRight = true;
        if (e.key === ' ') {
          e.preventDefault();
          controlsRef.current.jump = true;
        }
        if (key === 'e') worldRef.current?.triggerInteract();
        if (key === 'r') worldRef.current?.rotatePlacement();
        if (key === 'v') {
          worldRef.current?.toggleCameraView();
          setFirstPerson(prev => !prev);
        }
        if (key === 'f') handleTriggerMythSurge();
        if (key === 'g') handleTriggerSeasonEvent();
        if (key === 'm') setIsMuted(soundEngine.toggleMute());
        if (key === 'x') setIsCodexOpen(prev => !prev);
        if (key === 't') setIsTechTreeOpen(prev => !prev);
        if (key === 'j') setIsAchievementsOpen(prev => !prev);
        if (key === 'p') setGameState('paused');
      } else if (gameState === 'paused' && (key === 'escape' || key === 'p')) {
        setGameState('playing');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.key === 'Shift') controlsRef.current.sprint = false;
      if (key === 'w' || e.key === 'ArrowUp') controlsRef.current.forward = false;
      if (key === 's' || e.key === 'ArrowDown') controlsRef.current.backward = false;
      if (key === 'a' || e.key === 'ArrowLeft') controlsRef.current.left = false;
      if (key === 'd' || e.key === 'ArrowRight') controlsRef.current.right = false;
      if (key === 'q') controlsRef.current.turnLeft = false;
      if (key === 'z') controlsRef.current.turnRight = false;
      if (e.key === ' ') controlsRef.current.jump = false;
    };

    const handleBlur = () => {
      controlsRef.current = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        sprint: false,
        jump: false,
        turnLeft: false,
        turnRight: false,
      };
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [
    gameState,
    era,
    landscape,
    simState.placementMode,
    isTerminalOpen,
    isTechTreeOpen,
    isCodexOpen,
    isAchievementsOpen,
    activeDilemma,
    startGame,
    handleTriggerMythSurge,
    handleTriggerSeasonEvent,
  ]);

  // Simulator Terminal Handlers
  const handleOrderCrate = (productType: SimProductType, qty: number) => {
    const cost = calculateOrderCost(productType, qty);
    if (simState.shells < cost) return;
    soundEngine.playGather();
    setSimState(prev => ({ ...prev, shells: prev.shells - cost }));
    for (let i = 0; i < qty; i++) {
      worldRef.current?.spawnDockCrate(productType, SIM_CATALOG[productType].crateUnits);
    }
    pushFeed(`Ordered ${qty}x ${SIM_CATALOG[productType].name} crate to Riverbank Dock (-${cost} Shells)`, 'good');
  };

  const handleAdjustPrice = (productType: SimProductType, delta: number) => {
    setSimState(prev => {
      const nextPrice = Math.max(2, prev.prices[productType] + delta);
      const nextPrices = { ...prev.prices, [productType]: nextPrice };
      worldRef.current?.setPrices(nextPrices);
      return { ...prev, prices: nextPrices };
    });
  };

  const handleBuyRack = (productType: SimProductType) => {
    if (simState.shells < SIM_RACK_COST) return;
    soundEngine.playDrum();
    setSimState(prev => ({
      ...prev,
      shells: prev.shells - SIM_RACK_COST,
      placementMode: { rackCost: SIM_RACK_COST, productType },
    }));
    worldRef.current?.enterPlacementMode(productType, SIM_RACK_COST);
    setIsTerminalOpen(false);
    pushFeed('Walk to a clear camp spot and press [E] to place rack ([R] rotate).', 'myth');
  };

  const handleExpandCamp = (tier: number) => {
    const info = SIM_EXPANSIONS.find(e => e.tier === tier);
    if (!info || simState.shells < info.cost) return;
    soundEngine.playDiscovery();
    worldRef.current?.setExpansionTier(tier);
    worldRef.current?.triggerMythSurge(20, 1.5);
    setSimState(prev => ({
      ...prev,
      shells: prev.shells - info.cost,
      expansionTier: tier,
    }));
    pushFeed(`Expanded settlement to ${info.name}!`, 'myth');
  };

  const handleHireStaff = (role: 'restocker' | 'barterer') => {
    const staff = SIM_STAFF_OPTIONS.find(s => s.role === role);
    if (!staff || simState.shells < staff.cost) return;
    soundEngine.playDiscovery();
    worldRef.current?.hireStaff(role);
    setSimState(prev => ({
      ...prev,
      shells: prev.shells - staff.cost,
      restockerHired: role === 'restocker' ? true : prev.restockerHired,
      bartererHired: role === 'barterer' ? true : prev.bartererHired,
    }));
    pushFeed(`Hired ${staff.name}!`, 'myth');
  };

  // Landscape Switcher
  const handleSelectLandscape = (newLandscape: SapiensLandscape) => {
    soundEngine.playMythSound();
    setLandscape(newLandscape);
    if (worldRef.current) {
      worldRef.current.setLandscape(newLandscape);
      worldRef.current.setEventWeather('clear_sun', false);
      worldRef.current.triggerAnimalMigration('gazelles', false);
    }
    setRunStats(prev => ({ ...prev, landscape: newLandscape, activeEvent: null }));
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
        knowledge: prevRes.knowledge + 3,
        mythPower: Math.max(0, prevRes.mythPower - 1),
      };
      if (checkDefeatCondition(newRes)) {
        setGameState('gameover');
      }
      checkAchievements(newRes, unlockedTechIds, runStats);
      return newRes;
    });

    setTurnCount(prev => prev + 1);
    setSimState(prev => ({ ...prev, dayNumber: prev.dayNumber + 1 }));

    if (turnCount % 3 === 0 && !activeDilemma) {
      const availableDilemmas = HISTORICAL_DILEMMAS.filter(d => d.era === era);
      if (availableDilemmas.length > 0) {
        const randDilemma = availableDilemmas[Math.floor(Math.random() * availableDilemmas.length)];
        setActiveDilemma(randDilemma);
        soundEngine.playDrum();
      }
    }
  }, [turnCount, era, activeDilemma, unlockedTechIds, runStats, checkAchievements]);

  // Select Dilemma Choice
  const handleSelectChoice = (choice: DilemmaChoice) => {
    soundEngine.playDrum();
    const updated = applyDilemmaEffects(resources, choice.effects);
    setResources(updated);
    if ((choice.effects.mythPower || 0) > 0) {
      worldRef.current?.triggerMythSurge(18, 1.4);
    }

    let nextUnlocked = unlockedTechIds;
    if (choice.unlockTechId && !unlockedTechIds.includes(choice.unlockTechId)) {
      nextUnlocked = [...unlockedTechIds, choice.unlockTechId];
      setUnlockedTechIds(nextUnlocked);
      setTechs(prev => prev.map(t => (t.id === choice.unlockTechId ? { ...t, unlocked: true } : t)));
    }

    checkAchievements(updated, nextUnlocked, runStats);
    setActiveDilemma(null);

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
    worldRef.current?.triggerMythSurge(22, 1.5);

    const newUnlocked = [...unlockedTechIds, tech.id];
    setUnlockedTechIds(newUnlocked);
    setTechs(prev => prev.map(t => (t.id === tech.id ? { ...t, unlocked: true } : t)));
    checkAchievements(afterDeduct, newUnlocked, runStats);

    if (tech.id === 'emmer_cultivation' && era === 'cognitive') setEra('agricultural');
    if (tech.id === 'scientific_method' && era !== 'scientific') setEra('scientific');

    if (checkVictoryCondition(newUnlocked, afterDeduct)) {
      soundEngine.playVictory();
      setGameState('victory');
    }
  };

  // Active Quest Completion Evaluation
  const activeQuest = quests.find(q => !q.completed) || null;
  useEffect(() => {
    if (!activeQuest) return;
    if (activeQuest.checkCompletion(resources, unlockedTechIds)) {
      soundEngine.playMythSound();
      worldRef.current?.triggerMythSurge(25, 1.6);
      setQuests(prev => prev.map(q => (q.id === activeQuest.id ? { ...q, completed: true } : q)));
    }
  }, [resources, unlockedTechIds, activeQuest]);

  const handleRestart = () => {
    setResources(INITIAL_RESOURCES);
    setSimState(INITIAL_SIM_STATE);
    setTurnCount(1);
    setQuests(INITIAL_QUESTS);
    setTechs(DISCOVERY_TECHS);
    setUnlockedTechIds(['tree_of_knowledge']);
    setActiveDilemma(null);
    setIsTechTreeOpen(false);
    setIsCodexOpen(false);
    setIsTerminalOpen(false);
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

      {gameState === 'title' && (
        <TitleScreen
          onStartGame={startGame}
          selectedEra={era}
          onSelectEra={setEra}
          selectedLandscape={landscape}
          onSelectLandscape={setLandscape}
        />
      )}

      {gameState === 'playing' && (
        <HUD
          resources={resources}
          era={era}
          activeQuest={activeQuest}
          runStats={runStats}
          simState={simState}
          currentLandscape={landscape}
          firstPerson={firstPerson}
          onSelectLandscape={handleSelectLandscape}
          onToggleCampOpen={() => {
            setSimState(prev => {
              const nextOpen = !prev.isCampOpen;
              worldRef.current?.setCampOpen(nextOpen);
              return { ...prev, isCampOpen: nextOpen };
            });
          }}
          onOpenTerminal={() => setIsTerminalOpen(true)}
          onToggleCameraView={() => {
            worldRef.current?.toggleCameraView();
            setFirstPerson(prev => !prev);
          }}
          onTriggerInteract={() => worldRef.current?.triggerInteract()}
          onRotatePlacement={() => worldRef.current?.rotatePlacement()}
          onCancelPlacement={() => {
            worldRef.current?.cancelPlacementMode();
            setSimState(prev => ({ ...prev, placementMode: null }));
          }}
          onTriggerMythSurge={handleTriggerMythSurge}
          onTriggerSeasonEvent={handleTriggerSeasonEvent}
          onOpenDilemmas={() => {
            const available = HISTORICAL_DILEMMAS.filter(d => d.era === era);
            setActiveDilemma(available[0] || HISTORICAL_DILEMMAS[0]);
          }}
          onOpenTechTree={() => setIsTechTreeOpen(true)}
          onOpenCodex={() => setIsCodexOpen(true)}
          onOpenAchievements={() => setIsAchievementsOpen(true)}
          unlockedAchievementsCount={achievements.filter(a => a.unlocked).length}
          onToggleMute={() => setIsMuted(soundEngine.toggleMute())}
          isMuted={isMuted}
          onPause={() => setGameState('paused')}
          onEndTurn={advanceSeason}
          turnCount={turnCount}
        />
      )}

      <AchievementToast
        achievement={activeToast}
        onDismiss={() => setActiveToast(null)}
      />

      {isTerminalOpen && (
        <CampTerminalModal
          simState={simState}
          racks={racks}
          onOrderCrate={handleOrderCrate}
          onAdjustPrice={handleAdjustPrice}
          onBuyRack={handleBuyRack}
          onExpandCamp={handleExpandCamp}
          onHireStaff={handleHireStaff}
          onClose={() => setIsTerminalOpen(false)}
        />
      )}

      {isAchievementsOpen && (
        <AchievementsModal
          achievements={achievements}
          onClose={() => setIsAchievementsOpen(false)}
        />
      )}

      {activeDilemma && (
        <DilemmaModal
          dilemma={activeDilemma}
          onSelectChoice={handleSelectChoice}
          onClose={() => setActiveDilemma(null)}
        />
      )}

      {isTechTreeOpen && (
        <TechTreeModal
          techs={techs}
          resources={resources}
          onUnlockTech={handleUnlockTech}
          onClose={() => setIsTechTreeOpen(false)}
        />
      )}

      {isCodexOpen && (
        <HarariCodexModal
          entries={CODEX_ENTRIES}
          onClose={() => setIsCodexOpen(false)}
        />
      )}

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
