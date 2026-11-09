import type { RunStats, SapiensLandscape } from '../types/game';
import type { World3DControls } from './scene/world3d';

/** Fresh values for each run; never share mutable session objects. */
export function createRunStats(landscape: SapiensLandscape = 'river_meadow'): RunStats {
  return {
    pickupsCollected: 0, jumpsCount: 0, slidesCount: 0, distanceTraveled: 0,
    comboStreak: 0, maxCombo: 0, sprintEnergy: 100, score: 0, currentLane: 0,
    activePowerUp: null, powerUpTimeLeft: 0, beastAlert: false, stumbles: 0,
    landscape, mythSurge: 0, bumpCount: 0, maxBumps: 2,
    isRespawning: false, activeEvent: null,
  };
}

export function createControls(): World3DControls {
  return {
    forward: false, backward: false, left: false, right: false,
    action: false, sprint: false, jump: false, slide: false,
    laneLeft: false, laneRight: false,
  };
}
