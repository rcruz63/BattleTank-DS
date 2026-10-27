/** Composición del frame: fondo, rejilla de suelo, coberturas, tanques, pickups y proyectiles. */

import { LIGHT_DIRECTION, RENDER_DEFAULTS, VIEWPORT } from '../config/balance';
import { PALETTE } from '../config/palette';
import type { Bullet } from '../entities/bullet';
import type { EnemyState } from '../entities/enemy';
import type { PickupState } from '../entities/pickup';
import { createCameraFrame } from './camera';
import { drawBackground, drawGroundGrid } from './background';
import { buildBulletFaces } from './bulletFaces';
import { projectWorldFaces } from './faces';
import { tankWorldFaces } from './models';
import { paintFaces } from './painter';
import { pickupWorldFaces } from './pickupFaces';
import { buildWallWorldFaces } from './worldFaces';
import type { PerspectiveCamera, RenderFace, Viewport } from './types';
import type { WorldGrid } from '../world/types';

export interface WorldView {
  readonly grid: WorldGrid;
  readonly camera: PerspectiveCamera;
  readonly bullets?: readonly Bullet[];
  readonly enemies?: readonly EnemyState[];
  readonly pickups?: readonly PickupState[];
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

  const wallFaces = buildWallWorldFaces(
    view.grid,
    view.camera,
    RENDER_DEFAULTS.maxDrawDistance,
  );
  const enemyFaces = (view.enemies ?? [])
    .filter((enemy) => enemy.alive)
    .flatMap((enemy) => tankWorldFaces(enemy));
  const pickupFaces = (view.pickups ?? []).flatMap((pickup) => pickupWorldFaces(pickup));

  const faces: RenderFace[] = projectWorldFaces([...wallFaces, ...enemyFaces, ...pickupFaces], {
    camera: view.camera,
    viewport,
    fogStart: RENDER_DEFAULTS.fogStart,
    fogEnd: RENDER_DEFAULTS.fogEnd,
    fogColor: PALETTE.niebla,
    lightDirection: LIGHT_DIRECTION,
  });

  if (view.bullets) {
    faces.push(...buildBulletFaces(view.bullets, view.camera, viewport));
  }

  return { faces: paintFaces(context, faces) };
}
