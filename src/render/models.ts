/** Modelos de tanques enemigos como cajas rotadas de polígonos planos. */

import type { Vec3 } from '../core/math';
import type { EnemyState } from '../entities/enemy';
import { boxFaces } from './boxes';
import type { WorldFace } from './faces';

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
