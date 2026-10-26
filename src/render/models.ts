/** Modelos de tanques enemigos como cajas rotadas de polígonos planos. */

import type { Vec3 } from '../core/math';
import type { EnemyState } from '../entities/enemy';
import type { WorldFace } from './faces';

interface BoxSpec {
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

/** Caja opaca sin cara inferior: basta para tanques vistos desde el periscopio. */
export function boxFaces(spec: BoxSpec): WorldFace[] {
  return [
    boxFace(spec, { x: 0, y: 0, z: 1 }, FRONT),
    boxFace(spec, { x: 0, y: 0, z: -1 }, BACK),
    boxFace(spec, { x: 1, y: 0, z: 0 }, RIGHT),
    boxFace(spec, { x: -1, y: 0, z: 0 }, LEFT),
    boxFace(spec, { x: 0, y: 1, z: 0 }, TOP),
  ];
}

interface OffsetPointSpec {
  readonly position: { readonly x: number; readonly z: number };
  readonly yaw: number;
  readonly right: number;
  readonly forward: number;
  readonly y: number;
}

function offsetPoint(spec: OffsetPointSpec): Vec3 {
  const { position, yaw, right, forward, y } = spec;
  return {
    x: position.x + Math.cos(yaw) * right + Math.sin(yaw) * forward,
    y,
    z: position.z - Math.sin(yaw) * right + Math.cos(yaw) * forward,
  };
}

/** Silueta del enemigo: casco, dos cadenas, torreta y cañón. */
export function tankWorldFaces(enemy: EnemyState): WorldFace[] {
  const yaw = enemy.yaw;
  const { hullColor, turretColor, trackColor, barrelColor } = enemy.tank;

  const hull = boxFaces({
    center: { x: enemy.position.x, y: 0.62, z: enemy.position.z },
    size: { x: 2.7, y: 1.15, z: 4.4 },
    yaw,
    color: hullColor,
  });

  const tracks = [-1.25, 1.25].flatMap((right) =>
    boxFaces({
      center: offsetPoint({ position: enemy.position, yaw, right, forward: 0, y: 0.4 }),
      size: { x: 0.55, y: 0.8, z: 4.6 },
      yaw,
      color: trackColor,
    }),
  );

  const turret = boxFaces({
    center: offsetPoint({ position: enemy.position, yaw, right: 0, forward: -0.25, y: 1.55 }),
    size: { x: 2, y: 0.95, z: 2.3 },
    yaw,
    color: turretColor,
  });

  const barrel = boxFaces({
    center: offsetPoint({ position: enemy.position, yaw, right: 0, forward: 1.75, y: 1.7 }),
    size: { x: 0.24, y: 0.24, z: 2.6 },
    yaw,
    color: barrelColor,
  });

  return [...hull, ...tracks, ...turret, ...barrel];
}
