/**
 * A* sobre la rejilla (cuatro direcciones) para que los enemigos rodeen coberturas.
 *
 * Rejilla pequeña (≤ 24×24), así que una lista abierta ordenada por coste es suficiente y evita
 * estructuras de datos adicionales. Las coberturas intactas no son transitables.
 */

import { cellIndex, isBlocked, isInside } from './grid';
import type { CellPoint, WorldGrid } from './types';

interface PathNode {
  readonly x: number;
  readonly z: number;
  readonly index: number;
  readonly g: number;
  readonly f: number;
  readonly parent: number | null;
}

function heuristic(cell: CellPoint, goal: CellPoint): number {
  return Math.abs(cell.x - goal.x) + Math.abs(cell.z - goal.z);
}

function walkableNeighbors(grid: WorldGrid, cell: CellPoint): CellPoint[] {
  return [
    { x: cell.x + 1, z: cell.z },
    { x: cell.x - 1, z: cell.z },
    { x: cell.x, z: cell.z + 1 },
    { x: cell.x, z: cell.z - 1 },
  ].filter(
    (neighbor) =>
      isInside(grid, neighbor.x, neighbor.z) &&
      !isBlocked(grid, neighbor.x, neighbor.z),
  );
}

function reconstruct(best: ReadonlyMap<number, PathNode>, end: PathNode): CellPoint[] {
  const path: CellPoint[] = [];
  let cursor: number | null = end.index;
  let guard = 0;

  while (cursor !== null && guard < 10_000) {
    const node = best.get(cursor);
    if (!node) break;
    path.unshift({ x: node.x, z: node.z });
    cursor = node.parent;
    guard += 1;
  }

  return path;
}

/** Devuelve la ruta de celdas desde `start` hasta `goal` (ambas incluidas) o null. */
export function findPath(
  grid: WorldGrid,
  start: CellPoint,
  goal: CellPoint,
): CellPoint[] | null {
  if (!isInside(grid, start.x, start.z) || !isInside(grid, goal.x, goal.z)) return null;
  if (isBlocked(grid, start.x, start.z) || isBlocked(grid, goal.x, goal.z)) return null;

  const startIndex = cellIndex(grid, start.x, start.z);
  const goalIndex = cellIndex(grid, goal.x, goal.z);
  const startNode: PathNode = {
    x: start.x,
    z: start.z,
    index: startIndex,
    g: 0,
    f: heuristic(start, goal),
    parent: null,
  };
  const best = new Map<number, PathNode>([[startIndex, startNode]]);
  const open: PathNode[] = [startNode];
  const closed = new Set<number>();

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift() as PathNode;
    if (closed.has(current.index)) continue;
    if (current.index === goalIndex) return reconstruct(best, current);
    closed.add(current.index);

    walkableNeighbors(grid, current).forEach((cell) => {
      const index = cellIndex(grid, cell.x, cell.z);
      if (closed.has(index)) return;

      const g = current.g + 1;
      const existing = best.get(index);
      if (existing && g >= existing.g) return;

      const node: PathNode = {
        x: cell.x,
        z: cell.z,
        index,
        g,
        f: g + heuristic(cell, goal),
        parent: current.index,
      };
      best.set(index, node);
      open.push(node);
    });
  }

  return null;
}
