/** Radar táctico: modelo puro de contactos y pintado en canvas. */

import { clamp, TAU } from '../core/math';
import type { EnemyState } from '../entities/enemy';
import type { PickupState } from '../entities/pickup';
import type { PlayerState } from '../entities/player';
import { PALETTE } from '../config/palette';
import { withAlpha } from '../render/color';
import { isBlocked } from '../world/grid';
import type { WorldGrid } from '../world/types';

export const RADAR_RANGE_METERS = 45;

export type RadarBlipKind = 'enemy' | 'pickup';

export interface RadarBlip {
  /** -1 izquierda .. 1 derecha del rumbo del tanque. */
  readonly x: number;
  /** -1 detrás .. 1 delante del rumbo del tanque. */
  readonly y: number;
  readonly kind: RadarBlipKind;
}

export interface RadarWall {
  readonly x: number;
  readonly y: number;
}

export interface RadarModel {
  readonly blips: readonly RadarBlip[];
  readonly walls: readonly RadarWall[];
}

function toRadar(
  player: PlayerState,
  point: { readonly x: number; readonly z: number },
): { x: number; y: number } | null {
  const dx = point.x - player.position.x;
  const dz = point.z - player.position.z;
  if (Math.hypot(dx, dz) > RADAR_RANGE_METERS) return null;

  const forward = dx * Math.sin(player.yaw) + dz * Math.cos(player.yaw);
  const right = dx * Math.cos(player.yaw) - dz * Math.sin(player.yaw);
  return {
    x: clamp(right / RADAR_RANGE_METERS, -1, 1),
    y: clamp(forward / RADAR_RANGE_METERS, -1, 1),
  };
}

function collectEnemyBlips(
  player: PlayerState,
  enemies: readonly EnemyState[],
): RadarBlip[] {
  const blips: RadarBlip[] = [];
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const radar = toRadar(player, enemy.position);
    if (radar) blips.push({ ...radar, kind: 'enemy' });
  }
  return blips;
}

function collectPickupBlips(
  player: PlayerState,
  pickups: readonly PickupState[],
): RadarBlip[] {
  const blips: RadarBlip[] = [];
  for (const pickup of pickups) {
    if (pickup.collected) continue;
    const radar = toRadar(player, pickup.position);
    if (radar) blips.push({ ...radar, kind: 'pickup' });
  }
  return blips;
}

function collectWalls(player: PlayerState, grid: WorldGrid): RadarWall[] {
  const walls: RadarWall[] = [];
  for (let index = 0; index < grid.obstacles.length; index += 1) {
    const obstacle = grid.obstacles[index];
    if (!obstacle || obstacle.health <= 0) continue;
    const x = index % grid.width;
    const z = Math.floor(index / grid.width);
    if (!isBlocked(grid, x, z)) continue;
    const radar = toRadar(player, {
      x: (x + 0.5) * grid.cellSize,
      z: (z + 0.5) * grid.cellSize,
    });
    if (radar) walls.push(radar);
  }
  return walls;
}

/** Contactos dentro del alcance, con el rumbo del tanque hacia arriba. */
export function buildRadarModel(
  player: PlayerState,
  enemies: readonly EnemyState[],
  pickups: readonly PickupState[],
  grid: WorldGrid,
): RadarModel {
  return {
    blips: [...collectEnemyBlips(player, enemies), ...collectPickupBlips(player, pickups)],
    walls: collectWalls(player, grid),
  };
}

function radarPoint(center: number, radius: number, x: number, y: number): { x: number; y: number } {
  return { x: center + x * radius, y: center - y * radius };
}

function drawBlip(
  context: CanvasRenderingContext2D,
  center: number,
  radius: number,
  blip: RadarBlip,
): void {
  const point = radarPoint(center, radius, blip.x, blip.y);
  if (blip.kind === 'enemy') {
    context.fillStyle = PALETTE.radarEnemigo;
    context.beginPath();
    context.moveTo(point.x, point.y - 4);
    context.lineTo(point.x - 3.5, point.y + 3);
    context.lineTo(point.x + 3.5, point.y + 3);
    context.closePath();
    context.fill();
    return;
  }

  context.fillStyle = PALETTE.radarPickup;
  context.beginPath();
  context.moveTo(point.x, point.y - 3.5);
  context.lineTo(point.x + 3.5, point.y);
  context.lineTo(point.x, point.y + 3.5);
  context.lineTo(point.x - 3.5, point.y);
  context.closePath();
  context.fill();
}

function drawRadarBase(
  context: CanvasRenderingContext2D,
  size: number,
  center: number,
  radius: number,
): void {
  context.fillStyle = '#06100c';
  context.fillRect(0, 0, size, size);

  context.strokeStyle = withAlpha(PALETTE.radar, 0.14);
  context.lineWidth = 1;
  for (const ring of [0.33, 0.66, 1]) {
    context.beginPath();
    context.arc(center, center, radius * ring, 0, TAU);
    context.stroke();
  }
  context.beginPath();
  context.moveTo(center - radius, center);
  context.lineTo(center + radius, center);
  context.moveTo(center, center - radius);
  context.lineTo(center, center + radius);
  context.stroke();
}

function drawRadarWalls(
  context: CanvasRenderingContext2D,
  center: number,
  radius: number,
  walls: readonly RadarWall[],
): void {
  context.fillStyle = withAlpha(PALETTE.rejilla, 0.28);
  for (const wall of walls) {
    const point = radarPoint(center, radius, wall.x, wall.y);
    context.fillRect(point.x - 2.5, point.y - 2.5, 5, 5);
  }
}

function drawRadarSweep(
  context: CanvasRenderingContext2D,
  center: number,
  radius: number,
  timeSeconds: number,
): void {
  const sweep = (timeSeconds * 1.4) % TAU;
  context.strokeStyle = withAlpha(PALETTE.radar, 0.45);
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(center, center);
  context.lineTo(center + Math.sin(sweep) * radius, center - Math.cos(sweep) * radius);
  context.stroke();
}

function drawRadarBlips(
  context: CanvasRenderingContext2D,
  center: number,
  radius: number,
  blips: readonly RadarBlip[],
): void {
  for (const blip of blips) drawBlip(context, center, radius, blip);
}

function drawRadarPlayer(
  context: CanvasRenderingContext2D,
  center: number,
): void {
  context.fillStyle = PALETTE.mira;
  context.beginPath();
  context.moveTo(center, center - 6);
  context.lineTo(center - 4, center + 4);
  context.lineTo(center + 4, center + 4);
  context.closePath();
  context.fill();
}

function drawRadarBezel(
  context: CanvasRenderingContext2D,
  center: number,
  radius: number,
): void {
  context.strokeStyle = withAlpha(PALETTE.mira, 0.22);
  context.lineWidth = 2;
  context.beginPath();
  context.arc(center, center, radius, 0, TAU);
  context.stroke();
}

/** Pinta el radar en un canvas cuadrado (normalmente 180×180). */
export function drawRadar(
  context: CanvasRenderingContext2D,
  model: RadarModel,
  timeSeconds: number,
): void {
  const size = context.canvas.width;
  const center = size / 2;
  const radius = center - 6;

  context.clearRect(0, 0, size, size);
  context.save();
  context.beginPath();
  context.arc(center, center, radius, 0, TAU);
  context.clip();

  drawRadarBase(context, size, center, radius);
  drawRadarWalls(context, center, radius, model.walls);
  drawRadarSweep(context, center, radius, timeSeconds);
  drawRadarBlips(context, center, radius, model.blips);
  drawRadarPlayer(context, center);

  context.restore();
  drawRadarBezel(context, center, radius);
}
