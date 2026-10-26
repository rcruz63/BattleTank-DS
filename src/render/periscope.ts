/**
 * Overlay del periscopio: máscara oscura, mira, recarga, destellos y silueta del cañón/casco.
 *
 * Se pinta después del mundo. El HUD de misión (vida, progreso, radar…) es DOM y vive en `src/ui/`.
 */

import { clamp } from '../core/math';
import { VIEWPORT } from '../config/balance';
import { PALETTE } from '../config/palette';
import { withAlpha } from './color';
import type { Viewport } from './types';

const TOP_MASK = 58;
const BOTTOM_MASK = 118;
const SIDE_MASK = 64;

export interface PeriscopeState {
  /** 0 = recién disparado; 1 = listo. */
  readonly reloadProgress: number;
  readonly reloadRemaining: number;
  readonly ready: boolean;
  /** 0..1, intensidad del fogonazo. */
  readonly muzzleFlash: number;
  /** 0..1, intensidad de la marca de impacto. */
  readonly hitMarker: number;
}

const READY_STATE: PeriscopeState = {
  reloadProgress: 1,
  reloadRemaining: 0,
  ready: true,
  muzzleFlash: 0,
  hitMarker: 0,
};

function drawMask(context: CanvasRenderingContext2D, viewport: Viewport): void {
  const { width, height } = viewport;
  context.fillStyle = 'rgba(2, 4, 3, 0.94)';
  context.fillRect(0, 0, width, TOP_MASK);
  context.fillRect(0, height - BOTTOM_MASK, width, BOTTOM_MASK);
  context.fillRect(0, TOP_MASK, SIDE_MASK, height - TOP_MASK - BOTTOM_MASK);
  context.fillRect(
    width - SIDE_MASK,
    TOP_MASK,
    SIDE_MASK,
    height - TOP_MASK - BOTTOM_MASK,
  );

  context.strokeStyle = withAlpha(PALETTE.mira, 0.12);
  context.lineWidth = 2;
  context.strokeRect(
    SIDE_MASK + 1,
    TOP_MASK + 1,
    width - 2 * SIDE_MASK - 2,
    height - TOP_MASK - BOTTOM_MASK - 2,
  );
}

function drawHullEdges(context: CanvasRenderingContext2D, viewport: Viewport): void {
  const { width, height } = viewport;
  context.fillStyle = 'rgba(6, 8, 5, 0.9)';

  context.beginPath();
  context.moveTo(0, height);
  context.lineTo(0, height - 170);
  context.lineTo(width * 0.24, height - 96);
  context.lineTo(width * 0.24, height - BOTTOM_MASK);
  context.lineTo(0, height);
  context.closePath();
  context.fill();

  context.beginPath();
  context.moveTo(width, height);
  context.lineTo(width, height - 170);
  context.lineTo(width * 0.76, height - 96);
  context.lineTo(width * 0.76, height - BOTTOM_MASK);
  context.lineTo(width, height);
  context.closePath();
  context.fill();
}

function drawGunBarrel(context: CanvasRenderingContext2D, viewport: Viewport): void {
  const centerX = viewport.width / 2;
  const baseY = viewport.height;
  const halfBase = 54;
  const halfTop = 17;
  const topY = viewport.height - BOTTOM_MASK - 36;

  context.fillStyle = '#12150f';
  context.beginPath();
  context.moveTo(centerX - halfBase, baseY);
  context.lineTo(centerX - halfTop, topY);
  context.lineTo(centerX + halfTop, topY);
  context.lineTo(centerX + halfBase, baseY);
  context.closePath();
  context.fill();

  context.strokeStyle = 'rgba(180, 170, 130, 0.18)';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(centerX - halfTop + 2, topY + 2);
  context.lineTo(centerX - halfBase + 2, baseY);
  context.stroke();
}

function drawMuzzleFlash(
  context: CanvasRenderingContext2D,
  viewport: Viewport,
  intensity: number,
): void {
  if (intensity <= 0.01) return;
  const centerX = viewport.width / 2;
  const centerY = viewport.height - BOTTOM_MASK - 30;
  const glowRadius = 26 + 34 * intensity;

  context.fillStyle = withAlpha(PALETTE.destelloDisparo, 0.28 * intensity);
  context.beginPath();
  context.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = withAlpha('#fff2c4', 0.9 * intensity);
  context.beginPath();
  context.arc(centerX, centerY, 8 + 10 * intensity, 0, Math.PI * 2);
  context.fill();
}

function drawCrossLines(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
): void {
  const gap = 16;
  const arm = 54;

  context.strokeStyle = withAlpha(PALETTE.mira, 0.82);
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(centerX - arm, centerY);
  context.lineTo(centerX - gap, centerY);
  context.moveTo(centerX + gap, centerY);
  context.lineTo(centerX + arm, centerY);
  context.moveTo(centerX, centerY - arm);
  context.lineTo(centerX, centerY - gap);
  context.moveTo(centerX, centerY + gap);
  context.lineTo(centerX, centerY + arm);
  context.stroke();
}

function drawCenterMark(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
): void {
  context.beginPath();
  context.arc(centerX, centerY, 21, 0, Math.PI * 2);
  context.stroke();

  context.fillStyle = withAlpha(PALETTE.mira, 0.9);
  context.beginPath();
  context.arc(centerX, centerY, 2, 0, Math.PI * 2);
  context.fill();
}

function drawRangeTicks(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
): void {
  context.strokeStyle = withAlpha(PALETTE.mira, 0.45);
  context.lineWidth = 1;
  context.beginPath();
  for (let tick = 1; tick <= 3; tick += 1) {
    const offset = 34 + tick * 18;
    context.moveTo(centerX - offset, centerY - 5);
    context.lineTo(centerX - offset, centerY + 5);
    context.moveTo(centerX + offset, centerY - 5);
    context.lineTo(centerX + offset, centerY + 5);
  }
  context.stroke();
}

function drawReloadRing(
  context: CanvasRenderingContext2D,
  viewport: Viewport,
  state: PeriscopeState,
): void {
  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  const radius = 31;

  context.strokeStyle = withAlpha(PALETTE.mira, 0.16);
  context.lineWidth = 3;
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.stroke();

  if (state.ready) return;

  const progress = clamp(state.reloadProgress, 0, 1);
  context.strokeStyle = withAlpha(PALETTE.progreso, 0.9);
  context.lineWidth = 3;
  context.beginPath();
  context.arc(
    centerX,
    centerY,
    radius,
    -Math.PI / 2,
    -Math.PI / 2 + Math.PI * 2 * progress,
  );
  context.stroke();

  context.fillStyle = withAlpha(PALETTE.texto, 0.85);
  context.font = '14px monospace';
  context.textAlign = 'center';
  context.fillText(`${state.reloadRemaining.toFixed(1)} s`, centerX, centerY + 88);
}

function drawHitMarker(
  context: CanvasRenderingContext2D,
  viewport: Viewport,
  intensity: number,
): void {
  if (intensity <= 0.01) return;
  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  const alpha = clamp(intensity, 0, 1);
  const inner = 26;
  const outer = 36;

  context.strokeStyle = withAlpha('#fff6d8', 0.9 * alpha);
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(centerX - outer, centerY - outer);
  context.lineTo(centerX - inner, centerY - inner);
  context.moveTo(centerX + outer, centerY - outer);
  context.lineTo(centerX + inner, centerY - inner);
  context.moveTo(centerX - outer, centerY + outer);
  context.lineTo(centerX - inner, centerY + inner);
  context.moveTo(centerX + outer, centerY + outer);
  context.lineTo(centerX + inner, centerY + inner);
  context.stroke();
}

export function drawPeriscope(
  context: CanvasRenderingContext2D,
  viewport: Viewport = VIEWPORT,
  state: PeriscopeState = READY_STATE,
): void {
  drawMask(context, viewport);
  drawHullEdges(context, viewport);
  drawGunBarrel(context, viewport);
  drawMuzzleFlash(context, viewport, state.muzzleFlash);

  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  drawCrossLines(context, centerX, centerY);
  drawCenterMark(context, centerX, centerY);
  drawRangeTicks(context, centerX, centerY);
  drawReloadRing(context, viewport, state);
  drawHitMarker(context, viewport, state.hitMarker);
}
