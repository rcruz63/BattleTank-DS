/** Reglas de campaña: parámetros de generación, reparto de enemigos y bonus. */

import { ARENA_DEFAULTS } from '../config/balance';
import { HEALTH_BONUS_PER_POINT, MISSIONS, MISSION_BONUS } from '../config/missions';
import type { MissionDefinition, MissionEnemyClass } from '../config/missions';
import type { SpawnPoint } from '../world/types';
import type { GenerationParams } from '../world/types';

export interface MissionEnemySpawn {
  readonly type: MissionEnemyClass;
  readonly spawn: SpawnPoint;
}

export function missionAt(index: number): MissionDefinition {
  return MISSIONS[index] ?? (MISSIONS[0] as MissionDefinition);
}

export function missionSeed(baseSeed: number, missionIndex: number): number {
  return (baseSeed + missionIndex * 0x9e3779b9) >>> 0;
}

/** Parámetros de generación de una misión sobre los valores por defecto. */
export function buildMissionParams(mission: MissionDefinition, seed: number): GenerationParams {
  return {
    ...ARENA_DEFAULTS,
    seed,
    widthCells: mission.arena.widthCells,
    heightCells: mission.arena.heightCells,
    obstacleDensity: mission.arena.obstacleDensity,
    destructibleRatio: mission.arena.destructibleRatio,
    pickupCount: mission.arena.pickupCount,
    enemyCount: mission.enemies.length,
  };
}

/** Reparte los tipos de enemigo de la misión en los spawns generados (mismo orden). */
export function buildMissionRoster(
  mission: MissionDefinition,
  spawns: readonly SpawnPoint[],
): MissionEnemySpawn[] {
  return mission.enemies.map((type, index) => {
    const spawn = spawns[index];
    if (!spawn) throw new Error('La generación no produjo suficientes spawns de enemigo.');
    return { type, spawn };
  });
}

export function missionBonus(playerHealth: number): number {
  return MISSION_BONUS + Math.round(Math.max(0, playerHealth)) * HEALTH_BONUS_PER_POINT;
}

export function nextMissionExists(index: number): boolean {
  return index + 1 < MISSIONS.length;
}
