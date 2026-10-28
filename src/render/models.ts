/** Modelos de tanques enemigos como cajas rotadas de polígonos planos. */

import { PALETTE } from '../config/palette';
import { mixHexColors } from './color';
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

/** Aclara el color base cuando el tanque acaba de recibir un impacto. */
function hitTinted(color: string, hitFlash: number): string {
  return hitFlash > 0.01 ? mixHexColors(color, '#ffffff', Math.min(0.55, hitFlash * 0.55)) : color;
}

/** Silueta del enemigo: casco, cadenas, torreta, cañón y marcas de orientación. */
export function tankWorldFaces(enemy: EnemyState): WorldFace[] {
  const yaw = enemy.yaw;
  const hullColor = hitTinted(enemy.tank.hullColor, enemy.hitFlash);
  const turretColor = hitTinted(enemy.tank.turretColor, enemy.hitFlash);
  const trackColor = hitTinted(enemy.tank.trackColor, enemy.hitFlash);
  const barrelColor = hitTinted(enemy.tank.barrelColor, enemy.hitFlash);

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

  // Marcas de orientación: franja clara en el frente y roja en la espalda (legibilidad del 7.5).
  const frontMarker = boxFaces({
    center: offsetPoint({ position: enemy.position, yaw, right: 0, forward: 2.16, y: 0.95 }),
    size: { x: 1.15, y: 0.16, z: 0.08 },
    yaw,
    color: PALETTE.texto,
  });
  const rearMarker = boxFaces({
    center: offsetPoint({ position: enemy.position, yaw, right: 0, forward: -2.16, y: 0.95 }),
    size: { x: 1.15, y: 0.16, z: 0.08 },
    yaw,
    color: PALETTE.miraAviso,
  });

  return [...hull, ...tracks, ...turret, ...barrel, ...frontMarker, ...rearMarker];
}
