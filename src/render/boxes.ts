/** Cajas opacas de polígonos planos reutilizadas por los modelos de tanques y pickups. */

import type { Vec3 } from '../core/math';
import type { WorldFace } from './faces';

export interface BoxSpec {
  readonly center: Vec3;
  readonly size: Vec3;
  /** 0 = mira hacia +Z. */
  readonly yaw: number;
  readonly color: string;
}

interface LocalPoint {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Punto local (x derecha, y arriba, z adelante) a coordenadas de mundo. */
function toWorld(center: Vec3, yaw: number, local: LocalPoint): Vec3 {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  return {
    x: center.x + local.x * cos + local.z * sin,
    y: center.y + local.y,
    z: center.z - local.x * sin + local.z * cos,
  };
}

function boxFace(
  spec: BoxSpec,
  localNormal: Vec3,
  corners: ReadonlyArray<readonly [number, number, number]>,
): WorldFace {
  const halfX = spec.size.x / 2;
  const halfY = spec.size.y / 2;
  const halfZ = spec.size.z / 2;
  const points = corners.map(([sx, sy, sz]) =>
    toWorld(spec.center, spec.yaw, { x: sx * halfX, y: sy * halfY, z: sz * halfZ }),
  );
  const normal = toWorld({ x: 0, y: 0, z: 0 }, spec.yaw, {
    x: localNormal.x,
    y: 0,
    z: localNormal.z,
  });
  return {
    points,
    normal: { x: normal.x, y: localNormal.y, z: normal.z },
    color: spec.color,
  };
}

const FRONT: ReadonlyArray<readonly [number, number, number]> = [
  [-1, -1, 1],
  [1, -1, 1],
  [1, 1, 1],
  [-1, 1, 1],
];
const BACK: ReadonlyArray<readonly [number, number, number]> = [
  [1, -1, -1],
  [-1, -1, -1],
  [-1, 1, -1],
  [1, 1, -1],
];
const RIGHT: ReadonlyArray<readonly [number, number, number]> = [
  [1, -1, 1],
  [1, -1, -1],
  [1, 1, -1],
  [1, 1, 1],
];
const LEFT: ReadonlyArray<readonly [number, number, number]> = [
  [-1, -1, -1],
  [-1, -1, 1],
  [-1, 1, 1],
  [-1, 1, -1],
];
const TOP: ReadonlyArray<readonly [number, number, number]> = [
  [-1, 1, 1],
  [1, 1, 1],
  [1, 1, -1],
  [-1, 1, -1],
];

/** Caja opaca sin cara inferior: basta para objetos vistos desde el periscopio. */
export function boxFaces(spec: BoxSpec): WorldFace[] {
  return [
    boxFace(spec, { x: 0, y: 0, z: 1 }, FRONT),
    boxFace(spec, { x: 0, y: 0, z: -1 }, BACK),
    boxFace(spec, { x: 1, y: 0, z: 0 }, RIGHT),
    boxFace(spec, { x: -1, y: 0, z: 0 }, LEFT),
    boxFace(spec, { x: 0, y: 1, z: 0 }, TOP),
  ];
}
