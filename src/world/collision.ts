/** Colisión de un círculo (tanque) contra la rejilla, con deslizamiento por ejes y subpasos. */

import type { WorldPoint, WorldGrid } from './types';
import { isBlocked, isInside } from './grid';

const MAX_SUBSTEP = 0.25;

export interface CollisionResult {
  readonly position: WorldPoint;
  /** True si algún eje se bloqueó durante el desplazamiento. */
  readonly collided: boolean;
}

/** Desplazamiento en el plano XZ. */
export interface PlanarDelta {
  readonly x: number;
  readonly z: number;
}

/** Posición de partida y desplazamiento de un círculo que se mueve por el plano. */
export interface CircleMove {
  readonly position: WorldPoint;
  readonly delta: PlanarDelta;
}

/** Comprueba si una posición candidata está libre para el círculo. */
export type OccupancyCheck = (position: WorldPoint) => boolean;

interface CellCircleCheck {
  readonly position: WorldPoint;
  readonly radius: number;
  readonly cellX: number;
  readonly cellZ: number;
  readonly cellSize: number;
}

function circleIntersectsCell(check: CellCircleCheck): boolean {
  const x0 = check.cellX * check.cellSize;
  const z0 = check.cellZ * check.cellSize;
  const nearestX = Math.max(x0, Math.min(check.position.x, x0 + check.cellSize));
  const nearestZ = Math.max(z0, Math.min(check.position.z, z0 + check.cellSize));
  const dx = check.position.x - nearestX;
  const dz = check.position.z - nearestZ;
  return dx * dx + dz * dz < check.radius * check.radius;
}

/** Comprueba si el círculo cabe en `position` sin tocar coberturas ni salir del escenario. */
export function canCircleOccupy(
  grid: WorldGrid,
  position: WorldPoint,
  radius: number,
): boolean {
  const minCellX = Math.floor((position.x - radius) / grid.cellSize);
  const maxCellX = Math.floor((position.x + radius) / grid.cellSize);
  const minCellZ = Math.floor((position.z - radius) / grid.cellSize);
  const maxCellZ = Math.floor((position.z + radius) / grid.cellSize);
  const columns = maxCellX - minCellX + 1;
  const rows = maxCellZ - minCellZ + 1;
  const total = columns * rows;

  for (let index = 0; index < total; index += 1) {
    const cellX = minCellX + (index % columns);
    const cellZ = minCellZ + Math.floor(index / columns);
    if (!isInside(grid, cellX, cellZ)) return false;
    if (!isBlocked(grid, cellX, cellZ)) continue;
    if (
      circleIntersectsCell({
        position,
        radius,
        cellX,
        cellZ,
        cellSize: grid.cellSize,
      })
    ) {
      return false;
    }
  }

  return true;
}

interface AxisMove {
  readonly position: WorldPoint;
  readonly dx: number;
  readonly dz: number;
}

function axisPosition(
  move: AxisMove,
  isFree: OccupancyCheck,
): { position: WorldPoint; blocked: boolean } {
  const candidate = { x: move.position.x + move.dx, z: move.position.z + move.dz };
  if (isFree(candidate)) {
    return { position: candidate, blocked: false };
  }
  return { position: move.position, blocked: true };
}

/**
 * Desplaza el círculo en subpasos y por ejes separados con `isFree` como criterio de ocupación:
 * bloquea el eje que choca y deja que el otro siga (deslizamiento). Devuelve la posición final.
 */
export function moveCircleWith(move: CircleMove, isFree: OccupancyCheck): CollisionResult {
  const steps = Math.max(
    1,
    Math.ceil(Math.max(Math.abs(move.delta.x), Math.abs(move.delta.z)) / MAX_SUBSTEP),
  );
  const stepX = move.delta.x / steps;
  const stepZ = move.delta.z / steps;
  let current = move.position;
  let collided = false;

  for (let step = 0; step < steps; step += 1) {
    const horizontal = axisPosition({ position: current, dx: stepX, dz: 0 }, isFree);
    current = horizontal.position;
    collided = collided || horizontal.blocked;

    const vertical = axisPosition({ position: current, dx: 0, dz: stepZ }, isFree);
    current = vertical.position;
    collided = collided || vertical.blocked;
  }

  return { position: current, collided };
}

/** Movimiento contra la rejilla, con la comprobación de celdas del escenario. */
export function moveCircle(
  grid: WorldGrid,
  position: WorldPoint,
  delta: PlanarDelta,
  radius: number,
): CollisionResult {
  return moveCircleWith({ position, delta }, (candidate) =>
    canCircleOccupy(grid, candidate, radius),
  );
}
