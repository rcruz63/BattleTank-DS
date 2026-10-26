/** Proyección de caras de mundo a pantalla: backface culling, recorte, sombreado y niebla. */

import { clamp, dot3, normalize3, scale3 } from '../core/math';
import type { Vec3 } from '../core/math';
import { RENDER_DEFAULTS } from '../config/balance';
import { PALETTE } from '../config/palette';
import { createCameraFrame, projectCameraPoint, worldToCamera } from './camera';
import type { CameraFrame } from './camera';
import { clipPolygonNearPlane } from './clip';
import { mixHexColors, shadeHexColor } from './color';
import type { PerspectiveCamera, RenderFace, ScreenPoint, Viewport } from './types';

export interface WorldFace {
  readonly points: readonly Vec3[];
  readonly normal: Vec3;
  readonly color: string;
}

export interface ProjectionOptions {
  readonly camera: PerspectiveCamera;
  readonly viewport: Viewport;
  readonly fogStart?: number;
  readonly fogEnd?: number;
  readonly fogColor?: string;
  readonly lightDirection?: Vec3;
}

interface ProjectionSettings {
  readonly frame: CameraFrame;
  readonly near: number;
  readonly fogStart: number;
  readonly fogEnd: number;
  readonly fogColor: string;
  readonly lightDirection: Vec3;
}

function faceCenter(points: readonly Vec3[]): Vec3 {
  const sum = points.reduce<Vec3>(
    (total, point) => ({
      x: total.x + point.x,
      y: total.y + point.y,
      z: total.z + point.z,
    }),
    { x: 0, y: 0, z: 0 },
  );
  return scale3(sum, 1 / Math.max(1, points.length));
}

function projectFace(face: WorldFace, settings: ProjectionSettings): RenderFace | null {
  const { frame } = settings;
  const camera = frame.camera;
  const center = faceCenter(face.points);
  const toFace: Vec3 = {
    x: center.x - camera.position.x,
    y: center.y - camera.position.y,
    z: center.z - camera.position.z,
  };
  if (dot3(face.normal, toFace) >= 0) return null;

  const cameraPoints = face.points.map((point) =>
    worldToCamera(point, camera, frame.basis),
  );
  const clipped = clipPolygonNearPlane(cameraPoints, settings.near);
  if (clipped.length < 3) return null;

  const screenPoints: ScreenPoint[] = [];
  let depthSum = 0;
  for (const point of clipped) {
    const projected = projectCameraPoint(point, camera, frame.viewport, frame.focal);
    if (!projected) return null;
    screenPoints.push(projected);
    depthSum += point.z;
  }

  const depth = depthSum / clipped.length;
  const fog = clamp(
    (depth - settings.fogStart) / Math.max(1, settings.fogEnd - settings.fogStart),
    0,
    1,
  );
  const light = Math.max(0, dot3(face.normal, settings.lightDirection));
  const lit = shadeHexColor(face.color, 0.58 + 0.42 * light);
  return { points: screenPoints, depth, color: mixHexColors(lit, settings.fogColor, fog) };
}

/** Proyecta y sombrea una lista de caras de mundo, descartando las no visibles. */
export function projectWorldFaces(
  faces: readonly WorldFace[],
  options: ProjectionOptions,
): RenderFace[] {
  const settings: ProjectionSettings = {
    frame: createCameraFrame(options.camera, options.viewport),
    near: options.camera.near,
    fogStart: options.fogStart ?? RENDER_DEFAULTS.fogStart,
    fogEnd: options.fogEnd ?? RENDER_DEFAULTS.fogEnd,
    fogColor: options.fogColor ?? PALETTE.niebla,
    lightDirection: normalize3(options.lightDirection ?? { x: 0.35, y: 0.85, z: 0.25 }),
  };

  const projected: RenderFace[] = [];
  for (const face of faces) {
    const rendered = projectFace(face, settings);
    if (rendered) projected.push(rendered);
  }
  return projected;
}

export { faceCenter };
