/**
 * Overlay del periscopio: máscara, retícula móvil, cañón orientable, recarga y destellos.
 *
 * Se pinta después del mundo. El HUD de misión (vida, progreso, radar…) es DOM y vive en `src/ui/`.
 */

import { clamp } from '../core/math';
import { VIEWPORT } from '../config/balance';
import { PALETTE } from '../config/palette';
import { withAlpha } from './color';
import type { ScreenPoint, Viewport } from './types';

const TOP_MASK = 58;
const BOTTOM_MASK = 118;
const SIDE_MASK = 64;
const BARREL_SCREEN_LENGTH = 300;

export interface PeriscopeState {
  /** 0 = recién disparado; 1 = listo. */
  readonly reloadProgress: number;
  readonly reloadRemaining: number;
  readonly ready: boolean;
  /** 0..1, intensidad del fogonazo. */
  readonly muzzleFlash: number;
  /** 0..1, intensidad de la marca de impacto. */
  readonly hitMarker: number;
  /** Punto de pantalla donde apunta el cañón. */
  readonly aimScreenX: number;
  readonly aimScreenY: number;
}

const READY_STATE: PeriscopeState = {
  reloadProgress: 1,
  reloadRemaining: 0,
  ready: true,
  muzzleFlash: 0,
  hitMarker: 0,
  aimScreenX: VIEWPORT.width / 2,
  aimScreenY: VIEWPORT.height / 2,
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

interface BarrelGeometry {
  readonly tipX: number;
  readonly tipY: number;
  readonly unitX: number;
  readonly unitY: number;
}

/** El cañón pivota en la mazorca (abajo, fuera de pantalla) y apunta hacia la retícula. */
function barrelGeometry(viewport: Viewport, aim: ScreenPoint): BarrelGeometry {
  const pivotX = viewport.width / 2;
  const pivotY = viewport.height + 40;
  const dx = aim.x - pivotX;
  const dy = aim.y - pivotY;
  const length = Math.hypot(dx, dy) || 1;
  const unitX = dx / length;
  const unitY = dy / length;
  return {
    unitX,
    unitY,
    tipX: pivotX + unitX * BARREL_SCREEN_LENGTH,
    tipY: pivotY + unitY * BARREL_SCREEN_LENGTH,
  };
}

interface BarrelHighlight {
  readonly pivotX: number;
  readonly pivotY: number;
  readonly tipX: number;
  readonly tipY: number;
  readonly perpendicularX: number;
  readonly perpendicularY: number;
}

function drawBarrelHighlight(
  context: CanvasRenderingContext2D,
  highlight: BarrelHighlight,
): void {
  const { pivotX, pivotY, tipX, tipY, perpendicularX, perpendicularY } = highlight;
  context.strokeStyle = 'rgba(180, 170, 130, 0.18)';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(tipX - perpendicularX * 14, tipY - perpendicularY * 14);
  context.lineTo(pivotX - perpendicularX * 51, pivotY - perpendicularY * 51);
  context.stroke();
}

function drawGunBarrel(
  context: CanvasRenderingContext2D,
  viewport: Viewport,
  aim: ScreenPoint,
): void {
  const { unitX, unitY, tipX, tipY } = barrelGeometry(viewport, aim);
  const pivotX = viewport.width / 2;
  const pivotY = viewport.height + 40;
  const perpendicularX = -unitY;
  const perpendicularY = unitX;
  const halfBase = 54;
  const halfTip = 17;

  context.fillStyle = '#12150f';
  context.beginPath();
  context.moveTo(pivotX - perpendicularX * halfBase, pivotY - perpendicularY * halfBase);
  context.lineTo(tipX - perpendicularX * halfTip, tipY - perpendicularY * halfTip);
  context.lineTo(tipX + perpendicularX * halfTip, tipY + perpendicularY * halfTip);
  context.lineTo(pivotX + perpendicularX * halfBase, pivotY + perpendicularY * halfBase);
  context.closePath();
  context.fill();

  drawBarrelHighlight(context, {
    pivotX,
    pivotY,
    tipX,
    tipY,
    perpendicularX,
    perpendicularY,
  });
}

function drawMuzzleFlash(
  context: CanvasRenderingContext2D,
  viewport: Viewport,
  aim: ScreenPoint,
  intensity: number,
): void {
  if (intensity <= 0.01) return;
  const { tipX, tipY } = barrelGeometry(viewport, aim);
  const glowRadius = 26 + 34 * intensity;

  context.fillStyle = withAlpha(PALETTE.destelloDisparo, 0.28 * intensity);
  context.beginPath();
  context.arc(tipX, tipY, glowRadius, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = withAlpha('#fff2c4', 0.9 * intensity);
  context.beginPath();
  context.arc(tipX, tipY, 8 + 10 * intensity, 0, Math.PI * 2);
  context.fill();
}

/** Marca tenue del rumbo del casco (centro de la vista). */
function drawHullMarker(context: CanvasRenderingContext2D, viewport: Viewport): void {
  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  context.strokeStyle = withAlpha(PALETTE.mira, 0.16);
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(centerX - 8, centerY);
  context.lineTo(centerX + 8, centerY);
  context.moveTo(centerX, centerY - 8);
  context.lineTo(centerX, centerY + 8);
  context.stroke();
  context.beginPath();
  context.arc(centerX, centerY, 3, 0, Math.PI * 2);
  context.stroke();
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
  state: PeriscopeState,
): void {
  const centerX = state.aimScreenX;
  const centerY = state.aimScreenY;
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
  state: PeriscopeState,
): void {
  if (state.hitMarker <= 0.01) return;
  const centerX = state.aimScreenX;
  const centerY = state.aimScreenY;
  const alpha = clamp(state.hitMarker, 0, 1);
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
  const aim: ScreenPoint = { x: state.aimScreenX, y: state.aimScreenY };

  drawMask(context, viewport);
  drawHullEdges(context, viewport);
  drawGunBarrel(context, viewport, aim);
  drawMuzzleFlash(context, viewport, aim, state.muzzleFlash);
  drawHullMarker(context, viewport);
  drawCrossLines(context, aim.x, aim.y);
  drawCenterMark(context, aim.x, aim.y);
  drawRangeTicks(context, aim.x, aim.y);
  drawReloadRing(context, state);
  drawHitMarker(context, state);
}
