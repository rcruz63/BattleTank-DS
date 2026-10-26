/** Tipos del mundo: rejilla de celdas, coberturas y resultado de la generación procedural. */

import type { MaterialId } from '../config/materials';

export interface CellPoint {
  readonly x: number;
  readonly z: number;
}

export interface WorldPoint {
  readonly x: number;
  readonly z: number;
}

export interface CellObstacle {
  readonly material: MaterialId;
  /** 0 = destruida (escombros); Infinity = indestructible. */
  health: number;
}

export interface WorldGrid {
  readonly width: number;
  readonly height: number;
  readonly cellSize: number;
  readonly seed: number;
  /** Obstáculos indexados como `z * width + x`. `null` = celda libre. */
  readonly obstacles: (CellObstacle | null)[];
}

export interface SpawnPoint extends WorldPoint {
  readonly yaw: number;
}

export interface GeneratedArena {
  readonly grid: WorldGrid;
  readonly seed: number;
  readonly playerSpawn: SpawnPoint;
  readonly enemySpawns: readonly SpawnPoint[];
  readonly pickupSpawns: readonly WorldPoint[];
}

/** Parámetros de generación: la misión decide densidad, enemigos y distancias. */
export interface GenerationParams {
  readonly seed: number;
  readonly widthCells: number;
  readonly heightCells: number;
  readonly cellSize: number;
  readonly obstacleDensity: number;
  readonly destructibleRatio: number;
  readonly enemyCount: number;
  readonly pickupCount: number;
  readonly minEnemyDistance: number;
  readonly minPickupDistance: number;
}
