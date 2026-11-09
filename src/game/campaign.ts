import type {
  GameResources,
  HistoricalEra,
  RunStats,
  SapiensLandscape,
} from "../types/game";
import { createRunStats } from "./session";
import {
  INITIAL_RESOURCES,
  HISTORICAL_DILEMMAS,
  DISCOVERY_TECHS,
  INITIAL_QUESTS,
  INITIAL_ACHIEVEMENTS,
  applyDilemmaEffects,
  canUnlockTech,
  deductTechCost,
  calculateTurnConsumption,
  checkDefeatCondition,
  checkNewAchievements,
} from "./rules";

export const ERAS: HistoricalEra[] = [
  "cognitive",
  "agricultural",
  "scientific",
];
export const LANDSCAPES: SapiensLandscape[] = [
  "river_meadow",
  "wetland_oasis",
  "mountain_pass",
];
export const CHAPTERS = {
  cognitive: {
    title: "A Shared Story",
    technology: "shared_fiction",
    next: "agricultural" as HistoricalEra,
  },
  agricultural: {
    title: "Roots in the Earth",
    technology: "emmer_cultivation",
    next: "scientific" as HistoricalEra,
  },
  scientific: {
    title: "Questions Beyond the Horizon",
    technology: "scientific_method",
    next: null,
  },
};
export interface Campaign {
  era: HistoricalEra;
  landscape: SapiensLandscape;
  resources: GameResources;
  techIds: string[];
  decisionIds: string[];
  questIds: string[];
  achievementIds: string[];
  insightIds: string[];
  stats: RunStats;
  elapsed: number;
  season: number;
  seasonTime: number;
  tutorialStep: number;
  status: "playing" | "victory" | "gameover";
}
export function newCampaign(
  era: HistoricalEra = "cognitive",
  landscape: SapiensLandscape = "river_meadow",
): Campaign {
  return {
    era,
    landscape,
    resources: { ...INITIAL_RESOURCES, calories: 400 },
    techIds: ["tree_of_knowledge"],
    decisionIds: [],
    questIds: [],
    achievementIds: [],
    insightIds: [],
    stats: createRunStats(landscape),
    elapsed: 0,
    season: 1,
    seasonTime: 0,
    tutorialStep: era === "cognitive" ? 0 : 4,
    status: "playing",
  };
}
export type Action =
  | { type: "insight"; id: string }
  | { type: "respawn" }
  | { type: "restore"; value: Campaign }
  | { type: "tick"; dt: number; snapshot: Partial<RunStats>; distance: number }
  | { type: "pickup"; kind: "flint" | "berries" | "ivory" | "amber" }
  | { type: "jump" | "slide" | "lane" | "skipTutorial" | "season" }
  | { type: "hit"; shielded: boolean }
  | { type: "research"; id: string }
  | { type: "decision"; id: string; choice: string }
  | { type: "landscape"; value: SapiensLandscape };
export function objectives(s: Campaign) {
  return [
    {
      label: "Travel for five active minutes",
      done: s.elapsed >= 300,
      progress: `${Math.min(300, Math.floor(s.elapsed))}/300s`,
    },
    {
      label: "Gather 12 supplies",
      done: s.stats.pickupsCollected >= 12,
      progress: `${Math.min(12, s.stats.pickupsCollected)}/12`,
    },
    {
      label: "Resolve two council decisions",
      done:
        s.decisionIds.filter((id) =>
          HISTORICAL_DILEMMAS.some((d) => d.id === id && d.era === s.era),
        ).length >= 2,
      progress: `${s.decisionIds.filter((id) => HISTORICAL_DILEMMAS.some((d) => d.id === id && d.era === s.era)).length}/2`,
    },
    {
      label: `Research ${DISCOVERY_TECHS.find((t) => t.id === CHAPTERS[s.era].technology)?.name}`,
      done: s.techIds.includes(CHAPTERS[s.era].technology),
      progress: s.techIds.includes(CHAPTERS[s.era].technology)
        ? "Done"
        : "Open Research",
    },
  ];
}
function finish(s: Campaign): Campaign {
  const quests = INITIAL_QUESTS.filter((q) =>
    q.checkCompletion(s.resources, s.techIds),
  ).map((q) => q.id);
  const achievements = checkNewAchievements(
    s.resources,
    s.techIds,
    s.stats,
    INITIAL_ACHIEVEMENTS.map((a) => ({
      ...a,
      unlocked: s.achievementIds.includes(a.id),
    })),
    s.season,
  )
    .updatedAchievements.filter((a) => a.unlocked)
    .map((a) => a.id);
  return {
    ...s,
    questIds: [...new Set([...s.questIds, ...quests])],
    achievementIds: achievements,
    status: checkDefeatCondition(s.resources)
      ? "gameover"
      : objectives(s).every((o) => o.done)
        ? "victory"
        : "playing",
  };
}
function season(s: Campaign): Campaign {
  const turn = calculateTurnConsumption(s.resources);
  return {
    ...s,
    season: s.season + 1,
    seasonTime: 0,
    resources: {
      ...s.resources,
      calories: turn.newCalories,
      population: Math.max(0, s.resources.population + turn.populationDelta),
      knowledge: s.resources.knowledge + 8,
    },
  };
}
export function campaignReducer(s: Campaign, action: Action): Campaign {
  if (action.type === "restore") return action.value;
  if (s.status !== "playing") return s;
  let n = s;
  switch (action.type) {
    case "respawn":
      return {...s, stats:{...s.stats,distanceTraveled:0,score:s.stats.pickupsCollected*100,bumpCount:0,comboStreak:0,activePowerUp:null,powerUpTimeLeft:0,currentLane:0}};
    case "insight":
      if(action.id!==s.era || s.insightIds.includes(action.id))return s;
      n={...s,insightIds:[...s.insightIds,action.id],resources:{...s.resources,knowledge:s.resources.knowledge+12}};
      break;
    case "tick": {
      const dt = Math.max(
        0,
        Math.min(1, Number.isFinite(action.dt) ? action.dt : 0),
      );
      n = {
        ...s,
        elapsed: s.elapsed + dt,
        seasonTime: s.seasonTime + dt,
        stats: {
          ...s.stats,
          ...action.snapshot,
          distanceTraveled: action.distance,
          score:
            Math.floor(action.distance * 10) + s.stats.pickupsCollected * 100,
        },
      };
      if (n.seasonTime >= 60) n = season(n);
      break;
    }
    case "season":
      if (s.seasonTime < 60) return s;
      n = season(s);
      break;
    case "skipTutorial":
      n = { ...s, tutorialStep: 4 };
      break;
    case "lane":
      n = { ...s, tutorialStep: s.tutorialStep === 0 ? 1 : s.tutorialStep };
      break;
    case "jump":
      n = {
        ...s,
        tutorialStep: s.tutorialStep === 1 ? 2 : s.tutorialStep,
        stats: { ...s.stats, jumpsCount: s.stats.jumpsCount + 1 },
      };
      break;
    case "slide":
      n = {
        ...s,
        tutorialStep: s.tutorialStep === 2 ? 3 : s.tutorialStep,
        stats: { ...s.stats, slidesCount: s.stats.slidesCount + 1 },
      };
      break;
    case "landscape":
      n = {
        ...s,
        landscape: action.value,
        stats: { ...s.stats, landscape: action.value },
      };
      break;
    case "hit":
      if (!action.shielded)
        n = {
          ...s,
          resources: {
            ...s.resources,
            calories: Math.max(0, s.resources.calories - 15),
          },
          stats: { ...s.stats, stumbles: s.stats.stumbles + 1, comboStreak: 0 },
        };
      break;
    case "pickup": {
      const combo = s.stats.comboStreak + 1;
      const reward =
        action.kind === "berries"
          ? { calories: 45 }
          : action.kind === "flint"
            ? { flintAndStone: 15, knowledge: 5 }
            : action.kind === "ivory"
              ? { mythPower: 10, knowledge: 3 }
              : {
                  calories: 8 * Math.min(5, Math.floor(combo / 4) + 1),
                  knowledge: 2,
                };
      n = {
        ...s,
        tutorialStep: s.tutorialStep === 3 ? 4 : s.tutorialStep,
        resources: applyDilemmaEffects(s.resources, reward),
        stats: {
          ...s.stats,
          pickupsCollected: s.stats.pickupsCollected + 1,
          comboStreak: combo,
          maxCombo: Math.max(combo, s.stats.maxCombo),
        },
      };
      break;
    }
    case "research": {
      const tech = DISCOVERY_TECHS.find(
        (t) => t.id === action.id && t.era === s.era,
      );
      if (
        !tech ||
        s.techIds.includes(tech.id) ||
        !canUnlockTech(tech, s.resources)
      )
        return s;
      n = {
        ...s,
        resources: deductTechCost(tech, s.resources),
        techIds: [...s.techIds, tech.id],
      };
      break;
    }
    case "decision": {
      const dilemma = HISTORICAL_DILEMMAS.find(
        (d) => d.id === action.id && d.era === s.era,
      );
      const choice = dilemma?.choices.find((c) => c.id === action.choice);
      if (!choice || s.decisionIds.includes(action.id)) return s;
      n = {
        ...s,
        resources: applyDilemmaEffects(s.resources, choice.effects),
        decisionIds: [...s.decisionIds, action.id],
        techIds: choice.unlockTechId
          ? [...new Set([...s.techIds, choice.unlockTechId])]
          : s.techIds,
      };
      break;
    }
  }
  return finish(n);
}
