/** Enemigo acorazado: estado y datos de su tanque. La IA vive en `systems/ai.ts`. */

import { ENEMY_RADIUS } from '../config/balance';
import { ENEMY_HEAVY_TANK, ENEMY_LIGHT_TANK } from '../config/tanks';
import type { TankDefinition } from '../config/tanks';
import { degreesToRadians } from '../core/math';
import type { CellPoint, SpawnPoint, WorldPoint } from '../world/types';

export type EnemyType = 'light' | 'heavy';
export type EnemyAiMode = 'idle' | 'advance' | 'attack';

export interface EnemyState {
  readonly id: string;
  readonly type: EnemyType;
  readonly tank: TankDefinition;
  position: WorldPoint;
  yaw: number;
  health: number;
  readonly radius: number;
  readonly speed: number;
  readonly turnSpeed: number;
  readonly reloadSeconds: number;
  reloadRemaining: number;
  readonly damage: number;
  readonly armor: number;
  readonly shellSpeed: number;
  alive: boolean;
  alerted: boolean;
  aiMode: EnemyAiMode;
  path: CellPoint[] | null;
  pathTimer: number;
  reactionTimer: number;
  muzzleFlash: number;
  /** 0..1, destello blanco al recibir un impacto. */
  hitFlash: number;
  /** True si el jugador tiene línea de visión sobre él (para HUD/feedback). */
  visibleToPlayer: boolean;
}

export function createEnemy(id: string, type: EnemyType, spawn: SpawnPoint): EnemyState {
  const tank: TankDefinition = type === 'light' ? ENEMY_LIGHT_TANK : ENEMY_HEAVY_TANK;
  return {
    id,
    type,
    tank,
    position: { x: spawn.x, z: spawn.z },
    yaw: spawn.yaw,
    health: tank.maxHealth,
    radius: ENEMY_RADIUS,
    speed: tank.speed,
    turnSpeed: degreesToRadians(tank.turnSpeedDegrees),
    reloadSeconds: tank.reloadSeconds,
    reloadRemaining: 0,
    damage: tank.damage,
    armor: tank.armor,
    shellSpeed: tank.shellSpeed,
    alive: true,
    alerted: false,
    aiMode: 'idle',
    path: null,
    pathTimer: 0,
    reactionTimer: 0,
    muzzleFlash: 0,
    hitFlash: 0,
    visibleToPlayer: false,
  };
}
