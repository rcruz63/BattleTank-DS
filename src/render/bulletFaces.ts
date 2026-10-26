/** Tracers de los proyectiles como rombos billboard que respetan la oclusión del painter. */

import { PALETTE } from '../config/palette';
import type { Bullet } from '../entities/bullet';
import { createCameraFrame, projectCameraPoint, worldToCamera } from './camera';
import { withAlpha } from './color';
import type { PerspectiveCamera, RenderFace, ScreenPoint, Viewport } from './types';

/** Radio visual del proyectil en metros (solo estética). */
const BULLET_VISUAL_RADIUS = 0.12;

function diamond(center: ScreenPoint, radius: number): ScreenPoint[] {
  return [
    { x: center.x, y: center.y - radius },
    { x: center.x + radius, y: center.y },
    { x: center.x, y: center.y + radius },
    { x: center.x - radius, y: center.y },
  ];
}

export function buildBulletFaces(
  bullets: readonly Bullet[],
  camera: PerspectiveCamera,
  viewport: Viewport,
): RenderFace[] {
  const frame = createCameraFrame(camera, viewport);
  const faces: RenderFace[] = [];

  for (const bullet of bullets) {
    const cameraPoint = worldToCamera(bullet.position, camera, frame.basis);
    if (cameraPoint.z < camera.near) continue;
    const projected = projectCameraPoint(cameraPoint, camera, viewport, frame.focal);
    if (!projected) continue;

    const size = Math.max(2.5, (frame.focal * BULLET_VISUAL_RADIUS) / cameraPoint.z);
    const coreColor = bullet.owner === 'player' ? PALETTE.destelloDisparo : PALETTE.destelloDano;
    const glowColor = withAlpha(coreColor, 0.22);

    faces.push({
      points: diamond(projected, size * 2.2),
      color: glowColor,
      depth: cameraPoint.z + 0.01,
    });
    faces.push({
      points: diamond(projected, size),
      color: coreColor,
      depth: cameraPoint.z,
    });
  }

  return faces;
}
