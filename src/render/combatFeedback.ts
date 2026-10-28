/** Feedback de combate en el canvas: barras de vida y daño flotante con la zona de impacto. */

import { clamp } from '../core/math';
import type { Vec3 } from '../core/math';
import { PALETTE } from '../config/palette';
import type { EnemyState } from '../entities/enemy';
import type { ArmorZone } from '../systems/armor';
import { createCameraFrame, projectCameraPoint, worldToCamera } from './camera';
import type { CameraFrame } from './camera';
import type { PerspectiveCamera, ScreenPoint, Viewport } from './types';

export interface DamagePopup {
  readonly position: Vec3;
  readonly amount: number;
  readonly zone: ArmorZone | null;
  readonly killed: boolean;
  age: number;
}

export const DAMAGE_POPUP_LIFETIME = 1.1;

const ZONE_LABELS: Readonly<Record<ArmorZone, string>> = {
  front: 'FRONTAL',
  side: 'LATERAL',
  rear: 'TRASERO',
};

interface ProjectedPoint {
  readonly point: ScreenPoint;
  readonly depth: number;
}

function projectPoint(point: Vec3, frame: CameraFrame): ProjectedPoint | null {
  const cameraPoint = worldToCamera(point, frame.camera, frame.basis);
  if (cameraPoint.z < frame.camera.near) return null;
  const projected = projectCameraPoint(
    cameraPoint,
    frame.camera,
    frame.viewport,
    frame.focal,
  );
  if (!projected) return null;
  return { point: projected, depth: cameraPoint.z };
}

function projectEnemy(enemy: EnemyState, frame: CameraFrame, height: number): ProjectedPoint | null {
  return projectPoint(
    { x: enemy.position.x, y: height, z: enemy.position.z },
    frame,
  );
}

function drawEnemyHealthBars(
  context: CanvasRenderingContext2D,
  frame: CameraFrame,
  enemies: readonly EnemyState[],
): void {
  for (const enemy of enemies) {
    if (!enemy.alive || !enemy.visibleToPlayer) continue;
    const projected = projectEnemy(enemy, frame, 2.55);
    if (!projected) continue;
    // Evita llenar la pantalla de barras a distancia: intacto solo se muestra si está cerca.
    if (enemy.health >= enemy.tank.maxHealth && projected.depth > 40) continue;

    const width = clamp(2600 / Math.max(1, projected.depth), 36, 72);
    const height = 6;
    const x = projected.point.x - width / 2;
    const y = projected.point.y;
    const fraction = clamp(enemy.health / enemy.tank.maxHealth, 0, 1);
    const color =
      fraction > 0.55
        ? PALETTE.vidaAlta
        : fraction > 0.25
          ? PALETTE.vidaMedia
          : PALETTE.vidaBaja;

    context.fillStyle = 'rgba(4, 7, 5, 0.8)';
    context.fillRect(x - 1, y - 1, width + 2, height + 2);
    context.fillStyle = color;
    context.fillRect(x, y, width * fraction, height);

    context.fillStyle = PALETTE.texto;
    context.font = '10px monospace';
    context.textAlign = 'center';
    context.fillText(enemy.tank.label, projected.point.x, y - 4);
  }
}

function popupText(popup: DamagePopup): string {
  if (popup.killed) return 'DESTRUIDO';
  const zone = popup.zone ? ` ${ZONE_LABELS[popup.zone]}` : '';
  return `-${Math.round(popup.amount)}${zone}`;
}

function drawDamagePopups(
  context: CanvasRenderingContext2D,
  frame: CameraFrame,
  popups: readonly DamagePopup[],
): void {
  for (const popup of popups) {
    const projected = projectPoint(
      {
        x: popup.position.x,
        y: popup.position.y + 0.45 + popup.age * 1.4,
        z: popup.position.z,
      },
      frame,
    );
    if (!projected) continue;

    const alpha = clamp(1 - popup.age / DAMAGE_POPUP_LIFETIME, 0, 1);
    context.globalAlpha = alpha;
    context.font = 'bold 17px monospace';
    context.textAlign = 'center';
    context.lineWidth = 3;
    context.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    context.strokeText(popupText(popup), projected.point.x, projected.point.y);
    context.fillStyle = popup.killed ? '#ff8a5c' : '#ffe28a';
    context.fillText(popupText(popup), projected.point.x, projected.point.y);
    context.globalAlpha = 1;
  }
}

export interface CombatFeedbackInput {
  readonly camera: PerspectiveCamera;
  readonly viewport: Viewport;
  readonly enemies: readonly EnemyState[];
  readonly popups: readonly DamagePopup[];
}

/** Pinta barras de vida de enemigos visibles y números de daño flotantes. */
export function drawCombatFeedback(
  context: CanvasRenderingContext2D,
  input: CombatFeedbackInput,
): void {
  const frame = createCameraFrame(input.camera, input.viewport);
  drawEnemyHealthBars(context, frame, input.enemies);
  drawDamagePopups(context, frame, input.popups);
}
