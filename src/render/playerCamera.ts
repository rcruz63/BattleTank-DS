import { CAMERA_DEFAULTS } from '../config/balance';
import { degreesToRadians } from '../core/math';
import type { PerspectiveCamera } from './types';

/** Cámara del jugador: solidaria con el tanque, a la altura del ojo y con pitch fijo. */
export function createPlayerCamera(
  position: { readonly x: number; readonly z: number },
  yaw: number,
): PerspectiveCamera {
  return {
    position: { x: position.x, y: CAMERA_DEFAULTS.eyeHeight, z: position.z },
    yaw,
    pitch: degreesToRadians(CAMERA_DEFAULTS.pitchDegrees),
    fovRadians: degreesToRadians(CAMERA_DEFAULTS.fovDegrees),
    near: CAMERA_DEFAULTS.near,
  };
}
