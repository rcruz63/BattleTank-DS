/** Cámara de periscopio: base ortonormal, transformación mundo→cámara y proyección. */

import { cross3, dot3, normalize3 } from '../core/math';
import type { Vec3 } from '../core/math';
import type { PerspectiveCamera, ScreenPoint, Viewport } from './types';

export interface CameraBasis {
  readonly right: Vec3;
  readonly up: Vec3;
  readonly forward: Vec3;
}

export interface CameraFrame {
  readonly camera: PerspectiveCamera;
  readonly basis: CameraBasis;
  readonly viewport: Viewport;
  readonly focal: number;
}

/** Distancia focal (px) para un FOV horizontal y un ancho de viewport. */
export function focalLengthForFov(horizontalFov: number, viewportWidth: number): number {
  return viewportWidth / 2 / Math.tan(horizontalFov / 2);
}

/**
 * Base de cámara a partir de yaw y pitch. Convención: yaw 0 mira a +Z, yaw positivo gira
 * hacia +X; pitch positivo mira hacia arriba.
 */
export function cameraBasis(camera: PerspectiveCamera): CameraBasis {
  const cosYaw = Math.cos(camera.yaw);
  const sinYaw = Math.sin(camera.yaw);
  const cosPitch = Math.cos(camera.pitch);
  const sinPitch = Math.sin(camera.pitch);

  const forward: Vec3 = {
    x: sinYaw * cosPitch,
    y: sinPitch,
    z: cosYaw * cosPitch,
  };
  const right: Vec3 = { x: cosYaw, y: 0, z: -sinYaw };
  const up = normalize3(cross3(forward, right));
  return { right, up, forward };
}

export function createCameraFrame(camera: PerspectiveCamera, viewport: Viewport): CameraFrame {
  return {
    camera,
    viewport,
    basis: cameraBasis(camera),
    focal: focalLengthForFov(camera.fovRadians, viewport.width),
  };
}

/** Dirección de avance de la mirada (útil para movimiento y disparo). */
export function cameraForward(camera: PerspectiveCamera): Vec3 {
  return cameraBasis(camera).forward;
}

/** Transforma un punto de mundo al espacio de cámara (x derecha, y arriba, z delante). */
export function worldToCamera(
  point: Vec3,
  camera: PerspectiveCamera,
  basis: CameraBasis = cameraBasis(camera),
): Vec3 {
  const relative: Vec3 = {
    x: point.x - camera.position.x,
    y: point.y - camera.position.y,
    z: point.z - camera.position.z,
  };
  return {
    x: dot3(relative, basis.right),
    y: dot3(relative, basis.up),
    z: dot3(relative, basis.forward),
  };
}

/** Proyecta un punto ya transformado a espacio de cámara. Null si está tras el plano cercano. */
export function projectCameraPoint(
  cameraPoint: Vec3,
  camera: PerspectiveCamera,
  viewport: Viewport,
  focal: number,
): ScreenPoint | null {
  if (cameraPoint.z < camera.near) return null;
  return {
    x: viewport.width / 2 + (focal * cameraPoint.x) / cameraPoint.z,
    y: viewport.height / 2 - (focal * cameraPoint.y) / cameraPoint.z,
  };
}

/** Atajo mundo→pantalla para un punto de mundo. */
export function projectWorldPoint(point: Vec3, frame: CameraFrame): ScreenPoint | null {
  const cameraPoint = worldToCamera(point, frame.camera, frame.basis);
  return projectCameraPoint(cameraPoint, frame.camera, frame.viewport, frame.focal);
}
