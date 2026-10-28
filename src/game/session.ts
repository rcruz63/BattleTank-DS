/** Sesión de una misión: escenario, entidades, estadísticas y fase de campaña. */

import { VIEWPORT } from '../config/balance';
import { MISSIONS } from '../config/missions';
import type { MissionDefinition, MissionPhase } from '../config/missions';
import type { Bullet } from '../entities/bullet';
import { createEnemy } from '../entities/enemy';
import type { EnemyState } from '../entities/enemy';
import { createPickups } from '../entities/pickup';
import type { PickupState } from '../entities/pickup';
import { createPlayer } from '../entities/player';
import type { PlayerState } from '../entities/player';
import type { DamagePopup } from '../render/combatFeedback';
import { resolveAim } from '../systems/aim';
import type { ResolvedAim } from '../systems/aim';
import { createLootState } from '../systems/loot';
import type { LootState } from '../systems/loot';
import {
  buildMissionParams,
  buildMissionRoster,
  missionAt,
  missionSeed,
} from '../systems/mission';
import { generateArena } from '../world/generate';
import type { GeneratedArena } from '../world/types';

export interface MissionSession {
  readonly missionIndex: number;
  readonly mission: MissionDefinition;
  readonly seed: number;
  readonly arena: GeneratedArena;
  readonly player: PlayerState;
  readonly enemies: EnemyState[];
  readonly pickups: PickupState[];
  readonly bullets: Bullet[];
  readonly damagePopups: DamagePopup[];
  readonly loot: LootState;
  aim: ResolvedAim;
  phase: MissionPhase;
  shotsFired: number;
  shotsHit: number;
  damageTaken: number;
  elapsedSeconds: number;
}

/** Genera el escenario y las entidades de una misión; no arranca la simulación. */
export function createMissionSession(
  missionIndex: number,
  baseSeed: number,
): MissionSession {
  const index = Math.max(0, Math.min(MISSIONS.length - 1, missionIndex));
  const mission = missionAt(index);
  const seed = missionSeed(baseSeed, index);
  const arena = generateArena(buildMissionParams(mission, seed));
  const player = createPlayer(arena.playerSpawn);
  const enemies = buildMissionRoster(mission, arena.enemySpawns).map(({ type, spawn }, enemyIndex) =>
    createEnemy(`enemigo-${mission.id}-${enemyIndex + 1}`, type, spawn),
  );

  return {
    missionIndex: index,
    mission,
    seed,
    arena,
    player,
    enemies,
    pickups: createPickups(arena.pickupSpawns),
    bullets: [],
    damagePopups: [],
    loot: createLootState(),
    aim: resolveAim(player.yaw, VIEWPORT, { x: 0, y: 0 }),
    phase: 'briefing',
    shotsFired: 0,
    shotsHit: 0,
    damageTaken: 0,
    elapsedSeconds: 0,
  };
}

/** Progreso de la misión actual: 0..1. */
export function missionProgress(session: MissionSession): number {
  if (session.enemies.length === 0) return 0;
  const destroyed = session.enemies.filter((enemy) => !enemy.alive).length;
  return destroyed / session.enemies.length;
}

export function missionAccuracy(session: MissionSession): number {
  return session.shotsFired > 0 ? session.shotsHit / session.shotsFired : 0;
}

