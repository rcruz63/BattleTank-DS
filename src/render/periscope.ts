/**
 * Overlay del periscopio: máscara oscura, mira y silueta del cañón/casco.
 *
 * Se pinta después del mundo. El HUD (vida, progreso, radar…) es DOM y vive en `src/ui/`.
 */

import { VIEWPORT } from '../config/balance';
import { PALETTE } from '../config/palette';
import { withAlpha } from './color';
import type { Viewport } from './types';

const TOP_MASK = 58;
const BOTTOM_MASK = 118;
const SIDE_MASK = 64;

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

function drawCrosshair(context: CanvasRenderingContext2D, viewport: Viewport): void {
  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  drawCrossLines(context, centerX, centerY);
  drawCenterMark(context, centerX, centerY);
  drawRangeTicks(context, centerX, centerY);
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

export function drawPeriscope(
  context: CanvasRenderingContext2D,
  viewport: Viewport = VIEWPORT,
): void {
  drawMask(context, viewport);
  drawHullEdges(context, viewport);
  drawGunBarrel(context, viewport);
  drawCrosshair(context, viewport);
}
