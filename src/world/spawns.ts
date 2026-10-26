/** Selección de posiciones de enemigos y pickups sobre celdas libres alcanzables. */

import { TAU } from '../core/math';
import type { Rng } from '../core/rng';
import { cellCenter, cellFromIndex } from './grid';
import { planarDistance } from './geometry';
import type { GenerationParams, SpawnPoint, WorldGrid, WorldPoint } from './types';

const ENEMY_SEPARATION = 8;
const PICKUP_SEPARATION = 4;

function candidatePoints(
  grid: WorldGrid,
  reachable: ReadonlySet<number>,
  origin: WorldPoint,
  minDistance: number,
): WorldPoint[] {
  const cells = Array.from(reachable, (index) => cellFromIndex(grid, index));
  return cells
    .map((cell) => cellCenter(grid, cell.x, cell.z))
    .filter((point) => planarDistance(point, origin) >= minDistance);
}

/** Elige puntos con separación mínima entre sí y respecto a los prohibidos. */
interface PickSpreadOptions {
  readonly candidates: readonly WorldPoint[];
  readonly count: number;
  readonly minSeparation: number;
  readonly rng: Rng;
  readonly forbidden?: readonly WorldPoint[];
}

function pickSpread(options: PickSpreadOptions): WorldPoint[] | null {
  const { candidates, count, minSeparation, rng, forbidden = [] } = options;
  const pool = [...candidates];
  const chosen: WorldPoint[] = [];
  let guard = 0;

  while (chosen.length < count && pool.length > 0 && guard < 500) {
    guard += 1;
    const [candidate] = pool.splice(rng.int(0, pool.length), 1);
    if (!candidate) continue;
    const others = [...chosen, ...forbidden];
    if (others.every((other) => planarDistance(candidate, other) >= minSeparation)) {
      chosen.push(candidate);
    }
  }

  return chosen.length === count ? chosen : null;
}

export interface SpawnOptions {
  readonly grid: WorldGrid;
  readonly reachable: ReadonlySet<number>;
  readonly params: GenerationParams;
  readonly rng: Rng;
  readonly playerSpawn: WorldPoint;
}

export function chooseEnemySpawns(options: SpawnOptions): SpawnPoint[] | null {
  const { grid, reachable, params, rng, playerSpawn } = options;
  const candidates = candidatePoints(grid, reachable, playerSpawn, params.minEnemyDistance);
  const chosen = pickSpread({
    candidates,
    count: params.enemyCount,
    minSeparation: ENEMY_SEPARATION,
    rng,
  });
  if (!chosen) return null;
  return chosen.map((point) => ({ ...point, yaw: rng.range(0, TAU) }));
}

export interface PickupSpawnOptions extends SpawnOptions {
  readonly enemySpawns: readonly WorldPoint[];
}

export function choosePickupSpawns(options: PickupSpawnOptions): WorldPoint[] | null {
  const { grid, reachable, params, rng, playerSpawn, enemySpawns } = options;
  const candidates = candidatePoints(grid, reachable, playerSpawn, params.minPickupDistance);
  return pickSpread({
    candidates,
    count: params.pickupCount,
    minSeparation: PICKUP_SEPARATION,
    rng,
    forbidden: enemySpawns,
  });
}
