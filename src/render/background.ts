/** Cielo, horizonte, suelo y rejilla proyectada. Se pinta antes de las caras del mundo. */

import { clamp } from '../core/math';
import { PALETTE } from '../config/palette';
import { withAlpha } from './color';
import { clipSegmentNearPlane } from './clip';
import { projectCameraPoint, worldToCamera } from './camera';
import type { CameraFrame } from './camera';
import type { PerspectiveCamera, Viewport } from './types';
import type { WorldGrid, WorldPoint } from '../world/types';

const MAJOR_GRID_EVERY = 4;

/** Altura en píxeles del horizonte para el pitch actual (puede quedar fuera de pantalla). */
export function horizonY(camera: PerspectiveCamera, focal: number, viewport: Viewport): number {
  return clamp(
    viewport.height / 2 + focal * Math.tan(camera.pitch),
    0,
    viewport.height,
  );
}

function drawSkyAndGround(
  context: CanvasRenderingContext2D,
  camera: PerspectiveCamera,
  frame: CameraFrame,
): void {
  const { viewport, focal } = frame;
  const horizon = horizonY(camera, focal, viewport);

  const sky = context.createLinearGradient(0, 0, 0, Math.max(1, horizon));
  sky.addColorStop(0, PALETTE.cieloAlto);
  sky.addColorStop(1, PALETTE.cieloHorizonte);
  context.fillStyle = sky;
  context.fillRect(0, 0, viewport.width, Math.max(0, horizon));

  const ground = context.createLinearGradient(0, horizon, 0, viewport.height);
  ground.addColorStop(0, PALETTE.sueloLejos);
  ground.addColorStop(1, PALETTE.sueloCerca);
  context.fillStyle = ground;
  context.fillRect(0, horizon, viewport.width, viewport.height - horizon);

  context.fillStyle = withAlpha(PALETTE.niebla, 0.55);
  context.fillRect(0, Math.max(0, horizon - 2), viewport.width, 3);
}

interface GridSegment {
  readonly frame: CameraFrame;
  readonly from: WorldPoint;
  readonly to: WorldPoint;
  readonly color: string;
}

function drawGridSegment(
  context: CanvasRenderingContext2D,
  segment: GridSegment,
): void {
  const { frame, from, to, color } = segment;
  const fromCamera = worldToCamera({ x: from.x, y: 0, z: from.z }, frame.camera, frame.basis);
  const toCamera = worldToCamera({ x: to.x, y: 0, z: to.z }, frame.camera, frame.basis);
  const clipped = clipSegmentNearPlane(fromCamera, toCamera, frame.camera.near);
  if (!clipped) return;

  const start = projectCameraPoint(clipped[0], frame.camera, frame.viewport, frame.focal);
  const end = projectCameraPoint(clipped[1], frame.camera, frame.viewport, frame.focal);
  if (!start || !end) return;

  context.strokeStyle = color;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
}

/** Rejilla del suelo alineada con las celdas del escenario, con líneas mayores cada 16 m. */
export function drawGroundGrid(
  context: CanvasRenderingContext2D,
  grid: WorldGrid,
  frame: CameraFrame,
): void {
  const minX = 0;
  const maxX = grid.width * grid.cellSize;
  const minZ = 0;
  const maxZ = grid.height * grid.cellSize;
  const minor = withAlpha(PALETTE.rejilla, 0.13);
  const major = withAlpha(PALETTE.rejillaMayor, 0.24);

  for (let column = 0; column <= grid.width; column += 1) {
    const x = column * grid.cellSize;
    const color = column % MAJOR_GRID_EVERY === 0 ? major : minor;
    drawGridSegment(context, { frame, from: { x, z: minZ }, to: { x, z: maxZ }, color });
  }

  for (let row = 0; row <= grid.height; row += 1) {
    const z = row * grid.cellSize;
    const color = row % MAJOR_GRID_EVERY === 0 ? major : minor;
    drawGridSegment(context, { frame, from: { x: minX, z }, to: { x: maxX, z }, color });
  }
}

export function drawBackground(
  context: CanvasRenderingContext2D,
  camera: PerspectiveCamera,
  frame: CameraFrame,
): void {
  drawSkyAndGround(context, camera, frame);
}
