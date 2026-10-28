/** Adaptación del estado de partida a los datos del HUD. */

import type { HudData } from '../ui/hudView';
import { missionAccuracy } from './session';
import type { GameState } from './state';

export function getHudData(state: GameState): HudData {
  const session = state.session;
  return {
    seed: session.seed,
    player: session.player,
    enemies: session.enemies,
    pickups: session.pickups,
    loot: session.loot,
    grid: session.arena.grid,
    mission: session.mission,
    phase: session.phase,
    score: state.campaignScore,
    bestScore: state.progression.bestScore,
    unlockedMission: state.progression.unlockedMission,
    stats: {
      shotsFired: session.shotsFired,
      shotsHit: session.shotsHit,
      accuracy: missionAccuracy(session),
      damageTaken: session.damageTaken,
      elapsedSeconds: session.elapsedSeconds,
    },
    paused: state.paused,
    muted: state.audioMuted,
    volume: state.audioVolume,
    notice: {
      text: state.effects.pickupNotice,
      color: state.effects.pickupColor,
      alpha: state.effects.pickupFlash,
    },
  };
}
