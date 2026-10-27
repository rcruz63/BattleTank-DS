/**
 * Puntería del cañón con ratón.
 *
 * El ratón se mapea linealmente a un cono con el vértice en la mazorca: X = giro horizontal,
 * Y = cabeceo. La cámara y el casco no se mueven; solo apunta el cañón. Es matemática pura,
 * sin DOM ni estado global, para poder testearla.
 */

import { AIM_LIMITS, CAMERA_DEFAULTS } from '../config/balance';
import { clamp, degreesToRadians } from '../core/math';
import type { Vec3 } from '../core/math';
import type { Viewport } from '../render/types';

export interface AimPointer {
  /** -1 (izquierda) .. 1 (derecha). */
  readonly x: number;
  /** -1 (abajo) .. 1 (arriba). */
  readonly y: number;
}

export interface ResolvedAim {
  /** Dirección 3D normalizada del cañón en coordenadas de mundo. */
  readonly direction: Vec3;
  readonly yawOffset: number;
  readonly pitchOffset: number;
  /** Punto de pantalla donde se dibuja la retícula. */
  readonly screenX: number;
  readonly screenY: number;
}

function focalLength(viewport: Viewport): number {
  return viewport.width / 2 / Math.tan(degreesToRadians(CAMERA_DEFAULTS.fovDegrees) / 2);
}

/** Resuelve el puntero normalizado en dirección de cañón y punto de retícula. */
export function resolveAim(
  baseYaw: number,
  viewport: Viewport,
  pointer: AimPointer,
): ResolvedAim {
  const maxYaw = degreesToRadians(AIM_LIMITS.maxYawDegrees);
  const maxPitch = degreesToRadians(AIM_LIMITS.maxPitchDegrees);
  const yawOffset = clamp(pointer.x, -1, 1) * maxYaw;
  const pitchOffset = clamp(pointer.y, -1, 1) * maxPitch;

  const yaw = baseYaw + yawOffset;
  const cosPitch = Math.cos(pitchOffset);
  const direction: Vec3 = {
    x: Math.sin(yaw) * cosPitch,
    y: Math.sin(pitchOffset),
    z: Math.cos(yaw) * cosPitch,
  };

  const focal = focalLength(viewport);
  return {
    direction,
    yawOffset,
    pitchOffset,
    screenX: viewport.width / 2 + focal * Math.tan(yawOffset),
    screenY: viewport.height / 2 - focal * Math.tan(pitchOffset),
  };
}
