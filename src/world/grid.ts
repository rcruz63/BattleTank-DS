/** Operaciones sobre la rejilla de celdas: consulta, daño y alcanzabilidad. Sin DOM. */

import { MATERIALS } from '../config/materials';
import type { MaterialId } from '../config/materials';
import type { CellObstacle, CellPoint, WorldGrid, WorldPoint } from './types';

export function createEmptyGrid(
  width: number,
  height: number,
  cellSize: number,
  seed: number,
): WorldGrid {
  if (width < 5 || height < 5) throw new Error('La rejilla debe tener al menos 5×5 celdas.');
  if (cellSize <= 0) throw new Error('El tamaño de celda debe ser positivo.');
  return {
    width,
    height,
    cellSize,
    seed,
    obstacles: new Array<CellObstacle | null>(width * height).fill(null),
  };
}

export function isInside(grid: WorldGrid, x: number, z: number): boolean {
  return x >= 0 && z >= 0 && x < grid.width && z < grid.height;
}

export function cellIndex(grid: WorldGrid, x: number, z: number): number {
  return z * grid.width + x;
}

export function cellFromIndex(grid: WorldGrid, index: number): CellPoint {
  return { x: index % grid.width, z: Math.floor(index / grid.width) };
}

export function getObstacle(grid: WorldGrid, x: number, z: number): CellObstacle | null {
  if (!isInside(grid, x, z)) return null;
  return grid.obstacles[cellIndex(grid, x, z)] ?? null;
}

/** Una celda bloquea el paso y la visión mientras tenga un obstáculo con vida. */
export function isBlocked(grid: WorldGrid, x: number, z: number): boolean {
  const obstacle = getObstacle(grid, x, z);
  return obstacle !== null && obstacle.health > 0;
}

/** Coloca una cobertura con la vida máxima que dicte su material. */
export function placeObstacle(grid: WorldGrid, x: number, z: number, material: MaterialId): void {
  if (!isInside(grid, x, z)) throw new Error(`Celda fuera de la rejilla: (${x}, ${z}).`);
  grid.obstacles[cellIndex(grid, x, z)] = {
    material,
    health: MATERIALS[material].maxHealth,
  };
}

/** Aplica daño a una cobertura. Devuelve true si este impacto la destruye. */
export function damageObstacle(
  grid: WorldGrid,
  x: number,
  z: number,
  damage: number,
): boolean {
  const obstacle = getObstacle(grid, x, z);
  if (!obstacle || !MATERIALS[obstacle.material].destructible || obstacle.health <= 0) {
    return false;
  }
  obstacle.health = Math.max(0, obstacle.health - Math.max(0, damage));
  return obstacle.health === 0;
}

/** Altura física de la celda: altura de la cobertura o de sus escombros; 0 si está libre. */
export function obstacleHeightAt(grid: WorldGrid, x: number, z: number): number {
  const obstacle = getObstacle(grid, x, z);
  if (!obstacle) return 0;
  const material = MATERIALS[obstacle.material];
  return obstacle.health > 0 ? material.height : material.rubbleHeight;
}

/** Centro en coordenadas de mundo de una celda. */
export function cellCenter(grid: WorldGrid, x: number, z: number): WorldPoint {
  return {
    x: (x + 0.5) * grid.cellSize,
    z: (z + 0.5) * grid.cellSize,
  };
}

export function worldToCell(grid: WorldGrid, worldX: number, worldZ: number): CellPoint {
  return {
    x: Math.floor(worldX / grid.cellSize),
    z: Math.floor(worldZ / grid.cellSize),
  };
}

function neighbors4(cell: CellPoint): readonly CellPoint[] {
  return [
    { x: cell.x + 1, z: cell.z },
    { x: cell.x - 1, z: cell.z },
    { x: cell.x, z: cell.z + 1 },
    { x: cell.x, z: cell.z - 1 },
  ];
}

/** Celdas libres alcanzables desde `start` moviéndose en cuatro direcciones (sin destruir). */
export function collectReachableCells(grid: WorldGrid, start: CellPoint): Set<number> {
  const visited = new Set<number>();
  if (!isInside(grid, start.x, start.z) || isBlocked(grid, start.x, start.z)) return visited;

  const queue: CellPoint[] = [start];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head] as CellPoint;
    head += 1;
    const currentIndex = cellIndex(grid, current.x, current.z);
    if (visited.has(currentIndex)) continue;
    visited.add(currentIndex);

    const nextCells = neighbors4(current).filter(
      (cell) =>
        isInside(grid, cell.x, cell.z) &&
        !isBlocked(grid, cell.x, cell.z) &&
        !visited.has(cellIndex(grid, cell.x, cell.z)),
    );
    queue.push(...nextCells);
  }

  return visited;
}
