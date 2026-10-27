/**
 * Colisión dinámica entre tanques: cada tanque es un círculo que bloquea a los demás.
 *
 * Además de la suma de radios se exige un margen de seguridad (`ENTITY_SEPARATION`) para que los
 * tanques no se queden pegados ni tiemblen al empujarse y para que la cámara del jugador, que va en
 * el centro de su tanque, no quede nunca dentro del modelo enemigo.
 */

import { ENTITY_SEPARATION } from '../config/balance';
import { canCircleOccupy, moveCircleWith } from './collision';
import type { CollisionResult, PlanarDelta } from './collision';
import { planarDistance } from './geometry';
import type { WorldGrid, WorldPoint } from './types';

export interface EntityBlocker {
  readonly position: WorldPoint;
  readonly radius: number;
}

export interface EntityMove {
  readonly grid: WorldGrid;
  readonly position: WorldPoint;
  readonly delta: PlanarDelta;
  readonly radius: number;
  /** Tanques vivos que bloquean el paso, excluido el que se mueve. */
  readonly blockers: readonly EntityBlocker[];
}

/** Distancia mínima entre dos tanques: suma de radios más el margen de seguridad. */
export function minEntityDistance(radiusA: number, radiusB: number): number {
  return radiusA + radiusB + ENTITY_SEPARATION;
}

/** Holgura respecto al bloqueador más cercano; negativa si hay solape. */
export function entityClearance(
  position: WorldPoint,
  radius: number,
  blockers: readonly EntityBlocker[],
): number {
  let clearance = Number.POSITIVE_INFINITY;
  for (const blocker of blockers) {
    const distance = planarDistance(position, blocker.position);
    clearance = Math.min(clearance, distance - minEntityDistance(radius, blocker.radius));
  }
  return clearance;
}

/**
 * Mueve el círculo por la rejilla y sin invadir a otros tanques, con el mismo barrido por subpasos
 * y deslizamiento por ejes que `moveCircle`.
 *
 * Si la posición inicial ya está solapada (por ejemplo al recolocar un tanque desde `window.__BT__`
 * en QA), se permite alejarse para escapar, pero nunca acercarse más: ningún movimiento agrava el
 * solape.
 */
export function moveCircleAroundEntities(move: EntityMove): CollisionResult {
  const clearance = entityClearance(move.position, move.radius, move.blockers);
  const minimumClearance = Math.min(clearance, 0);
  return moveCircleWith(
    move,
    (candidate) =>
      canCircleOccupy(move.grid, candidate, move.radius) &&
      entityClearance(candidate, move.radius, move.blockers) >= minimumClearance,
  );
}
