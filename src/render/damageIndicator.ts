/** Indicador direccional de daño: arco rojo en el borde de la pantalla hacia el impacto. */

import { clamp, wrapAngle } from '../core/math';
import { PALETTE } from '../config/palette';
import { withAlpha } from './color';
import type { Viewport } from './types';

export interface DamageIndicatorState {
  readonly playerYaw: number;
  /** Rumbo absoluto desde el que llegó el impacto. */
  readonly bearing: number;
  /** 0..1; decae con el tiempo. */
  readonly intensity: number;
}

const SPREAD_RADIANS = 0.2;

/** Pinta el arco del último daño recibido; no muta el estado ni depende de efectos globales. */
export function drawDamageIndicator(
  context: CanvasRenderingContext2D,
  viewport: Viewport,
  state: DamageIndicatorState,
): void {
  const intensity = clamp(state.intensity, 0, 1);
  if (intensity <= 0.01) return;

  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  const radius = Math.min(viewport.width, viewport.height) * 0.42;
  const angle = wrapAngle(state.bearing - state.playerYaw) - Math.PI / 2;
  const alpha = 0.8 * intensity;

  context.strokeStyle = withAlpha(PALETTE.destelloDano, alpha);
  context.lineWidth = 16;
  context.beginPath();
  context.arc(centerX, centerY, radius, angle - SPREAD_RADIANS, angle + SPREAD_RADIANS);
  context.stroke();

  context.strokeStyle = withAlpha(PALETTE.texto, alpha * 0.4);
  context.lineWidth = 4;
  context.beginPath();
  context.arc(
    centerX,
    centerY,
    radius + 12,
    angle - SPREAD_RADIANS - 0.04,
    angle + SPREAD_RADIANS + 0.04,
  );
  context.stroke();
}
