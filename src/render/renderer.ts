/** Composición del frame: fondo, rejilla de suelo y caras del mundo ordenadas por el painter. */

import { LIGHT_DIRECTION, RENDER_DEFAULTS, VIEWPORT } from '../config/balance';
import { PALETTE } from '../config/palette';
import { createCameraFrame } from './camera';
import { drawBackground, drawGroundGrid } from './background';
import { paintFaces } from './painter';
import { buildWorldFaces } from './worldFaces';
import type { PerspectiveCamera, Viewport } from './types';
import type { WorldGrid } from '../world/types';

export interface WorldView {
  readonly grid: WorldGrid;
  readonly camera: PerspectiveCamera;
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

  const faces = buildWorldFaces({
    grid: view.grid,
    camera: view.camera,
    viewport,
    ...RENDER_DEFAULTS,
    fogColor: PALETTE.niebla,
    lightDirection: LIGHT_DIRECTION,
  });

  return { faces: paintFaces(context, faces) };
}
