/** Línea de visión sobre la rejilla: las coberturas intactas bloquean, los escombros no. */

import { isBlocked, isInside, worldToCell } from './grid';
import type { WorldGrid, WorldPoint } from './types';

/** Muestreo cada metro: suficiente para celdas de 4 m y mucho más simple que un DDA exacto. */
const SAMPLE_STEP_METERS = 1;

export function hasLineOfSight(
  grid: WorldGrid,
  from: WorldPoint,
  to: WorldPoint,
): boolean {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const distance = Math.hypot(dx, dz);
  const steps = Math.max(1, Math.ceil(distance / SAMPLE_STEP_METERS));

  for (let step = 0; step <= steps; step += 1) {
    const ratio = step / steps;
    const cell = worldToCell(grid, from.x + dx * ratio, from.z + dz * ratio);
    if (!isInside(grid, cell.x, cell.z)) return false;
    if (isBlocked(grid, cell.x, cell.z)) return false;
  }

  return true;
}
