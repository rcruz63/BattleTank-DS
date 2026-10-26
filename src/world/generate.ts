/**
 * Generación procedural determinista del escenario.
 *
 * Borde cerrado de hormigón, grupos de coberturas con materiales variados, validación de
 * alcanzabilidad y colocación de spawns con distancias mínimas. La misma semilla produce el mismo
 * escenario, reintentos incluidos.
 */

import type { MaterialId } from '../config/materials';
import { createRng } from '../core/rng';
import type { Rng } from '../core/rng';
import {
  cellCenter,
  collectReachableCells,
  createEmptyGrid,
  isBlocked,
  placeObstacle,
} from './grid';
import { chooseEnemySpawns, choosePickupSpawns } from './spawns';
import type {
  CellPoint,
  GeneratedArena,
  GenerationParams,
  SpawnPoint,
  WorldGrid,
} from './types';

const MAX_ATTEMPTS = 30;
const PLAYER_ZONE_RADIUS = 2;
const BORDER_MATERIAL: MaterialId = 'hormigon';
const WALK_DIRECTIONS: readonly CellPoint[] = [
  { x: 1, z: 0 },
  { x: -1, z: 0 },
  { x: 0, z: 1 },
  { x: 0, z: -1 },
];

function isInPlayerZone(cell: CellPoint, playerCell: CellPoint): boolean {
  return (
    Math.abs(cell.x - playerCell.x) <= PLAYER_ZONE_RADIUS &&
    Math.abs(cell.z - playerCell.z) <= PLAYER_ZONE_RADIUS
  );
}

function isInteriorCell(grid: WorldGrid, cell: CellPoint): boolean {
  return cell.x > 0 && cell.z > 0 && cell.x < grid.width - 1 && cell.z < grid.height - 1;
}

/** Muro perimetral indestructible: el escenario siempre está cerrado. */
function placeBorder(grid: WorldGrid): void {
  for (let x = 0; x < grid.width; x += 1) {
    placeObstacle(grid, x, 0, BORDER_MATERIAL);
    placeObstacle(grid, x, grid.height - 1, BORDER_MATERIAL);
  }
  for (let z = 1; z < grid.height - 1; z += 1) {
    placeObstacle(grid, 0, z, BORDER_MATERIAL);
    placeObstacle(grid, grid.width - 1, z, BORDER_MATERIAL);
  }
}

function randomMaterial(rng: Rng, destructibleRatio: number): MaterialId {
  if (rng.chance(destructibleRatio)) return rng.chance(0.62) ? 'ladrillo' : 'madera';
  return rng.chance(0.72) ? 'hormigon' : 'acero';
}

function stepCell(cell: CellPoint, direction: number): CellPoint {
  const step = WALK_DIRECTIONS[direction] ?? { x: 1, z: 0 };
  return { x: cell.x + step.x, z: cell.z + step.z };
}

function canPlaceObstacle(
  grid: WorldGrid,
  cell: CellPoint,
  playerCell: CellPoint,
): boolean {
  return (
    isInteriorCell(grid, cell) &&
    !isBlocked(grid, cell.x, cell.z) &&
    !isInPlayerZone(cell, playerCell)
  );
}

/** Coloca un grupo de coberturas contiguas mediante un paseo aleatorio. */
interface ClusterOptions {
  readonly grid: WorldGrid;
  readonly rng: Rng;
  readonly origin: CellPoint;
  readonly playerCell: CellPoint;
  readonly destructibleRatio: number;
}

function placeCluster(options: ClusterOptions): number {
  const { grid, rng, origin, playerCell, destructibleRatio } = options;
  const length = rng.int(2, 6);
  let cell = origin;
  let placed = 0;

  for (let step = 0; step < length; step += 1) {
    if (canPlaceObstacle(grid, cell, playerCell)) {
      placeObstacle(grid, cell.x, cell.z, randomMaterial(rng, destructibleRatio));
      placed += 1;
    }
    cell = stepCell(cell, rng.int(0, WALK_DIRECTIONS.length));
  }

  return placed;
}

function randomInteriorCell(
  grid: WorldGrid,
  rng: Rng,
  playerCell: CellPoint,
): CellPoint | null {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const cell: CellPoint = {
      x: rng.int(1, grid.width - 1),
      z: rng.int(1, grid.height - 1),
    };
    if (canPlaceObstacle(grid, cell, playerCell)) return cell;
  }
  return null;
}

function scatterObstacles(
  grid: WorldGrid,
  params: GenerationParams,
  rng: Rng,
  playerCell: CellPoint,
): void {
  const interiorCount = (grid.width - 2) * (grid.height - 2);
  const target = Math.round(interiorCount * params.obstacleDensity);
  let placed = 0;
  let guard = 0;

  while (placed < target && guard < target * 20) {
    guard += 1;
    const origin = randomInteriorCell(grid, rng, playerCell);
    if (!origin) continue;
    placed += placeCluster({
      grid,
      rng,
      origin,
      playerCell,
      destructibleRatio: params.destructibleRatio,
    });
  }
}

function tryGenerate(params: GenerationParams, rng: Rng): GeneratedArena | null {
  const grid = createEmptyGrid(
    params.widthCells,
    params.heightCells,
    params.cellSize,
    params.seed,
  );
  placeBorder(grid);

  const playerCell: CellPoint = { x: Math.floor(grid.width / 2), z: 2 };
  scatterObstacles(grid, params, rng, playerCell);

  const reachable = collectReachableCells(grid, playerCell);
  const requiredCells = params.enemyCount + params.pickupCount + 8;
  if (reachable.size < requiredCells) return null;

  const playerSpawn: SpawnPoint = { ...cellCenter(grid, playerCell.x, playerCell.z), yaw: 0 };
  const enemySpawns = chooseEnemySpawns({ grid, reachable, params, rng, playerSpawn });
  if (!enemySpawns) return null;

  const pickupSpawns = choosePickupSpawns({
    grid,
    reachable,
    params,
    rng,
    playerSpawn,
    enemySpawns,
  });
  if (!pickupSpawns) return null;

  return { grid, seed: params.seed, playerSpawn, enemySpawns, pickupSpawns };
}

/** Genera un escenario jugable o lanza un error si no lo consigue tras los reintentos. */
export function generateArena(params: GenerationParams): GeneratedArena {
  const rng = createRng(params.seed);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const arena = tryGenerate(params, rng);
    if (arena) return arena;
  }
  throw new Error(`No se pudo generar un escenario jugable con la semilla ${params.seed}.`);
}
