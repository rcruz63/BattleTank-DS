/** Geometría planar compartida por generación, colisión e IA (plano XZ, sin altura). */

import type { WorldPoint } from './types';

export function planarDistance(a: WorldPoint, b: WorldPoint): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function planarDistanceSquared(a: WorldPoint, b: WorldPoint): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
}
