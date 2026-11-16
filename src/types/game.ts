export type GameState = 'title' | 'playing' | 'paused' | 'gameover' | 'victory';

export type HistoricalEra = 'cognitive' | 'agricultural' | 'scientific';

export interface GameResources {
  population: number;      // Band size (subject to Dunbar's limit ~150 without shared myth)
  dunbarLimit: number;     // Current threshold of cooperation (starts at 150, expandable by myths)
  mythPower: number;       // Collective belief / fiction strength
  calories: number;        // Stored food & sustenance
  flintAndStone: number;   // Raw materials for tools
  knowledge: number;       // Accumulated scientific & cultural discoveries
}

export interface Quest {
  id: string;
  era: HistoricalEra;
  title: string;
  harariChapter: string;
  description: string;
  objective: string;
  rewardText: string;
  completed: boolean;
  isUnlocked: boolean;
  requiredDiscovery?: string;
  checkCompletion: (res: GameResources, unlockedTechs: string[]) => boolean;
}

export interface DilemmaChoice {
  id: string;
  label: string;
  description: string;
  harariTheory: string;
  effects: {
    population?: number;
    dunbarLimit?: number;
    mythPower?: number;
    calories?: number;
    flintAndStone?: number;
    knowledge?: number;
  };
  unlockTechId?: string;
}

export interface HistoricalDilemma {
  id: string;
  era: HistoricalEra;
  title: string;
  historicalContext: string;
  bookQuote: string;
  chapterRef: string;
  choices: [DilemmaChoice, DilemmaChoice];
}

export interface DiscoveryTech {
  id: string;
  era: HistoricalEra;
  name: string;
  cost: { knowledge: number; mythPower?: number; flintAndStone?: number };
  description: string;
  harariInsight: string;
  unlocked: boolean;
}

export interface CodexEntry {
  id: string;
  title: string;
  era: HistoricalEra;
  concept: string;
  summary: string;
  harariQuote: string;
  discussion: string;
  keyTakeaway: string;
}

export type LandmarkType = 'campfire' | 'mammoth' | 'megaliths' | 'wheat' | 'cave';

export interface LandmarkInfo {
  id: LandmarkType;
  name: string;
  title: string;
  actionText: string;
  description: string;
  harariContext: string;
  x: number;
  z: number;
}

export interface ImaginedOrder {
  id: string;
  era: HistoricalEra;
  name: string;
  mantra: string;
  description: string;
  harariQuote: string;
  dunbarBonus: number;
  mythCost: number;
  perkDescription: string;
  active: boolean;
}

export interface MegafaunaState {
  count: number;
  maxCount: number;
  isExtinct: boolean;
  extinctionReflected: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  era?: HistoricalEra;
  funFact: string;
  unlocked: boolean;
  unlockedAt?: number;
  unlockedAtSeason?: number;
}

export type SapiensLandscape = 'river_meadow' | 'wetland_oasis' | 'mountain_pass';

export type EnvironmentalEventType =
  | 'seasonal_rainfall'
  | 'mammoth_migration'
  | 'gazelle_migration'
  | 'monsoon_deluge'
  | 'mountain_squall';

export interface DynamicWorldEvent {
  id: string;
  type: EnvironmentalEventType;
  title: string;
  landscape: SapiensLandscape;
  description: string;
  harariHistoricalNote: string;
  duration: number; // in seconds
  remainingTime: number;
  perkDescription: string;
  perkMultiplier: {
    calories?: number;
    amber?: number;
    knowledge?: number;
    myth?: number;
  };
  weatherStyle: 'rain' | 'storm' | 'clear_sun' | 'mist';
  animalMigration?: 'mammoths' | 'gazelles';
  active: boolean;
}

export interface RunStats {
  pickupsCollected: number;
  jumpsCount: number;
  slidesCount: number;
  distanceTraveled: number;
  comboStreak: number;
  maxCombo: number;
  sprintEnergy: number;
  score: number;
  currentLane: number; // -1: Left, 0: Center, 1: Right
  activePowerUp: 'magnet' | 'shield' | 'surge' | null;
  powerUpTimeLeft: number;
  beastAlert: boolean;
  stumbles: number;
  landscape: SapiensLandscape;
  mythSurge: number; // 0-100%
  bumpCount: number; // 0, 1, or 2 (triggers respawn on 2)
  maxBumps: number; // 2
  isRespawning: boolean;
  activeEvent: DynamicWorldEvent | null;
}

export type SimProductType = 'berries' | 'flint' | 'wheat' | 'ivory';

export interface SimCatalogItem {
  id: SimProductType;
  name: string;
  eraLabel: string;
  harariMeaning: string;
  crateCost: number;
  crateUnits: number;
  baseBarterPrice: number;
  knowledgePerSale: number;
  mythPerSale: number;
  colorHex: string;
  icon: string;
}

export interface SimRackState {
  id: string;
  label: string;
  productType: SimProductType;
  stock: number;
  maxStock: number;
  price: number;
  x: number;
  z: number;
  rotationY: number;
}

export interface SimStaffMember {
  id: string;
  role: 'restocker' | 'barterer';
  name: string;
  cost: number;
  hired: boolean;
  description: string;
}

export interface SimInteractionPrompt {
  key: string;
  label: string;
  sublabel?: string;
  actionType: 'pickup_crate' | 'stock_rack' | 'checkout' | 'forage' | 'terminal' | 'place_rack';
}

export interface SimCheckoutState {
  customerName: string;
  customerTribe: string;
  items: { productType: SimProductType; qty: number; unitPrice: number }[];
  totalShells: number;
  scannedCount: number;
  totalItems: number;
}

export interface SimState {
  shells: number; // Cowrie Shells / Barley Coins (Harari's currency myth)
  campLevel: number;
  campXp: number;
  nextLevelXp: number;
  expansionTier: number; // 1 = Clearing, 2 = River Outpost, 3 = Grand Bazaar
  isCampOpen: boolean;
  dayNumber: number;
  carriedCrate: { productType: SimProductType; units: number } | null;
  placementMode: { rackCost: number; productType: SimProductType } | null;
  dockCratesCount: number;
  queueLength: number;
  tradesCompleted: number;
  totalShellsEarned: number;
  prices: Record<SimProductType, number>;
  restockerHired: boolean;
  bartererHired: boolean;
  activePrompt: SimInteractionPrompt | null;
  activeCheckout: SimCheckoutState | null;
  feedMessages: { id: string; text: string; tone: 'good' | 'warn' | 'myth' }[];
}
