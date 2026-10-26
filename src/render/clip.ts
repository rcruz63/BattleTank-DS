/** Recorte contra el plano cercano. Evita proyectar geometría detrás de la cámara. */

import { lerp } from '../core/math';
import type { Vec3 } from '../core/math';

/** Punto de corte de un segmento con el plano z = near. */
function intersectNearPlane(from: Vec3, to: Vec3, near: number): Vec3 {
  const denominator = to.z - from.z;
  const t = Math.abs(denominator) < 1e-12 ? 0 : (near - from.z) / denominator;
  return {
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
    z: near,
  };
}

/**
 * Recorta un polígono (Sutherland–Hodgman) contra z >= near.
 * Devuelve los vértices en orden, todos delante del plano cercano. Puede devolver [].
 */
export function clipPolygonNearPlane(points: readonly Vec3[], near: number): Vec3[] {
  if (points.length === 0) return [];

  const result: Vec3[] = [];
  let previous = points[points.length - 1] as Vec3;
  let previousInside = previous.z >= near;

  for (const current of points) {
    const currentInside = current.z >= near;
    if (currentInside !== previousInside) {
      result.push(intersectNearPlane(previous, current, near));
    }
    if (currentInside) result.push(current);
    previous = current;
    previousInside = currentInside;
  }

  return result;
}

/** Recorta un segmento contra z >= near. Null si queda completamente detrás. */
export function clipSegmentNearPlane(
  from: Vec3,
  to: Vec3,
  near: number,
): readonly [Vec3, Vec3] | null {
  const fromInside = from.z >= near;
  const toInside = to.z >= near;

  if (fromInside && toInside) return [from, to];
  if (!fromInside && !toInside) return null;

  const intersection = intersectNearPlane(from, to, near);
  return fromInside ? [from, intersection] : [intersection, to];
}
