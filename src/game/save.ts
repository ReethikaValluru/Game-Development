import { newCampaign, ERAS, LANDSCAPES, type Campaign } from "./campaign";
import {
  DISCOVERY_TECHS,
  HISTORICAL_DILEMMAS,
  INITIAL_QUESTS,
  INITIAL_ACHIEVEMENTS,
} from "./rules";
export const SAVE_KEY = "sapiens.checkpoint.v1";
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export interface Checkpoint {
  version: 1;
  savedAt: string;
  campaign: Campaign;
}
const number = (n: unknown, max = 1e9) =>
  typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= max;
const ids = (v: unknown, valid: string[]) =>
  Array.isArray(v) &&
  v.length <= valid.length &&
  v.every((x) => typeof x === "string" && valid.includes(x)) &&
  new Set(v).size === v.length;
export function parseSave(raw: string): Checkpoint | null {
  try {
    if (raw.length > 100000) return null;
    const v = JSON.parse(raw),
      s = v.campaign;
    if (
      v.version !== 1 ||
      typeof v.savedAt !== "string" ||
      !Number.isFinite(Date.parse(v.savedAt)) ||
      !s ||
      !ERAS.includes(s.era) ||
      !LANDSCAPES.includes(s.landscape)
    )
      return null;
    const base = newCampaign(s.era, s.landscape);
    if (
      !s.resources ||
      !Object.keys(base.resources).every((k) => number(s.resources[k])) ||
      !s.stats ||
      !Object.keys(base.stats)
        .filter(
          (k) => typeof base.stats[k as keyof typeof base.stats] === "number",
        )
        .every(
          (k) =>
            number(s.stats[k]) || (k === "currentLane" && s.stats[k] === -1),
        )
    )
      return null;
    if (
      ![-1, 0, 1].includes(s.stats.currentLane) ||
      !["playing", "victory", "gameover"].includes(s.status) ||
      !number(s.elapsed, 864000) ||
      !Number.isInteger(s.season) ||
      s.season < 1 ||
      s.season > 100000 ||
      !number(s.seasonTime, 60) ||
      !Number.isInteger(s.tutorialStep) ||
      s.tutorialStep < 0 ||
      s.tutorialStep > 4
    )
      return null;
    if (
      !ids(
        s.techIds,
        DISCOVERY_TECHS.map((t) => t.id),
      ) ||
      !ids(
        s.decisionIds,
        HISTORICAL_DILEMMAS.map((d) => d.id),
      ) ||
      !ids(
        s.questIds,
        INITIAL_QUESTS.map((q) => q.id),
      ) ||
      !ids(
        s.achievementIds,
        INITIAL_ACHIEVEMENTS.map((a) => a.id),
      )
    )
      return null;
    if(s.insightIds !== undefined && !ids(s.insightIds, ERAS)) return null;
    // Copy known fields only. World-only state always resets at a fresh trail segment.
    const resources = Object.fromEntries(
      Object.keys(base.resources).map((k) => [k, s.resources[k]]),
    ) as Campaign["resources"];
    const stats = { ...base.stats };
    for (const key of [
      "pickupsCollected",
      "jumpsCount",
      "slidesCount",
      "distanceTraveled",
      "comboStreak",
      "maxCombo",
      "score",
      "stumbles",
    ] as const)
      stats[key] = s.stats[key];
    return {
      version: 1,
      savedAt: v.savedAt,
      campaign: {
        ...base,
        resources,
        stats,
        techIds: s.techIds,
        decisionIds: s.decisionIds,
        questIds: s.questIds,
        achievementIds: s.achievementIds,
        insightIds: s.insightIds ?? [],
        elapsed: s.elapsed,
        season: s.season,
        seasonTime: s.seasonTime,
        tutorialStep: s.tutorialStep,
        status: s.status,
      },
    };
  } catch {
    return null;
  }
}
export function loadCheckpoint(storage: StorageLike): {
  checkpoint: Checkpoint | null;
  error?: string;
} {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return { checkpoint: null };
    const checkpoint = parseSave(raw);
    return checkpoint
      ? { checkpoint }
      : {
          checkpoint: null,
          error:
            "The saved checkpoint is invalid or from an unsupported version. Start a new run to replace it.",
        };
  } catch {
    return {
      checkpoint: null,
      error:
        "Browser storage is unavailable. You can still play without saving.",
    };
  }
}
export function saveCheckpoint(
  storage: StorageLike,
  campaign: Campaign,
): string | null {
  try {
    storage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        campaign,
      }),
    );
    return null;
  } catch {
    return "Could not save: browser storage is unavailable or full.";
  }
}
