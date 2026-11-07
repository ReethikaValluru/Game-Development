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
