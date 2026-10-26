/** Composición del frame: fondo, rejilla de suelo, caras del mundo y proyectiles. */

import { LIGHT_DIRECTION, RENDER_DEFAULTS, VIEWPORT } from '../config/balance';
import { PALETTE } from '../config/palette';
import type { Bullet } from '../entities/bullet';
import { createCameraFrame } from './camera';
import { drawBackground, drawGroundGrid } from './background';
import { buildBulletFaces } from './bulletFaces';
import { paintFaces } from './painter';
import { buildWorldFaces } from './worldFaces';
import type { PerspectiveCamera, RenderFace, Viewport } from './types';
import type { WorldGrid } from '../world/types';

export interface WorldView {
  readonly grid: WorldGrid;
  readonly camera: PerspectiveCamera;
  readonly bullets?: readonly Bullet[];
}

export interface RenderStats {
  readonly faces: number;
}

export function renderWorld(
  context: CanvasRenderingContext2D,
  view: WorldView,
  viewport: Viewport = VIEWPORT,
): RenderStats {
  const frame = createCameraFrame(view.camera, viewport);
  drawBackground(context, view.camera, frame);
  drawGroundGrid(context, view.grid, frame);

  const faces: RenderFace[] = buildWorldFaces({
    grid: view.grid,
    camera: view.camera,
    viewport,
    ...RENDER_DEFAULTS,
    fogColor: PALETTE.niebla,
    lightDirection: LIGHT_DIRECTION,
  });

  if (view.bullets) {
    faces.push(...buildBulletFaces(view.bullets, view.camera, viewport));
  }

  return { faces: paintFaces(context, faces) };
}
