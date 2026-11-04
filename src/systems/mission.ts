/** Reglas de campaña: parámetros de generación, reparto de enemigos y bonus. */

import { ARENA_DEFAULTS } from '../config/balance';
import { HEALTH_BONUS_PER_POINT, MISSIONS, MISSION_BONUS } from '../config/missions';
import type { MissionDefinition, MissionEnemyClass } from '../config/missions';
import { planarDistance } from '../world/geometry';
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
    minEnemyDistance: mission.arena.minEnemyDistance,
    enemyCount: mission.enemies.length,
  };
}

/**
 * Reparte los tipos de enemigo de la misión entre los spawns generados. Los pesados se quedan
 * con los spawns más lejanos al jugador: un Tiger no debe aparecer encima en el primer segundo,
 * y así se corrige la mala suerte del reparto aleatorio sin tocar la generación del mapa.
 */
export function buildMissionRoster(
  mission: MissionDefinition,
  spawns: readonly SpawnPoint[],
  playerSpawn: SpawnPoint,
): MissionEnemySpawn[] {
  if (spawns.length < mission.enemies.length) {
    throw new Error('La generación no produjo suficientes spawns de enemigo.');
  }
  const heavyCount = mission.enemies.filter((type) => type === 'heavy').length;
  const farthest = new Set(
    [...spawns]
      .sort(
        (first, second) => planarDistance(second, playerSpawn) - planarDistance(first, playerSpawn),
      )
      .slice(0, heavyCount),
  );
  let heaviesLeft = heavyCount;

  return spawns.slice(0, mission.enemies.length).map((spawn) => {
    const type: MissionEnemyClass = heaviesLeft > 0 && farthest.has(spawn) ? 'heavy' : 'light';
    if (type === 'heavy') heaviesLeft -= 1;
    return { type, spawn };
  });
}

export function missionBonus(playerHealth: number): number {
  return MISSION_BONUS + Math.round(Math.max(0, playerHealth)) * HEALTH_BONUS_PER_POINT;
}

export function nextMissionExists(index: number): boolean {
  return index + 1 < MISSIONS.length;
}
