/**
 * Combate: recarga del jugador, creación de proyectiles y avance con colisiones.
 *
 * Los proyectiles son balísticos discretos (no hitscan). El avance se hace en subpasos para no
 * atravesar coberturas; el plano cercano del render es independiente de esta simulación.
 */

import { COMBAT } from '../config/balance';
import type { MaterialId } from '../config/materials';
import { createBullet } from '../entities/bullet';
import type { Bullet, ProjectileOwner } from '../entities/bullet';
import { playerForward } from '../entities/player';
import type { PlayerState } from '../entities/player';
import type { Vec3 } from '../core/math';
import { planarDistanceSquared } from '../world/geometry';
import {
  damageObstacle,
  getObstacle,
  isInside,
  obstacleHeightAt,
  worldToCell,
} from '../world/grid';
import type { CellPoint, WorldGrid, WorldPoint } from '../world/types';

export interface ProjectileTarget {
  readonly id: string;
  readonly position: WorldPoint;
  readonly radius: number;
  readonly faction: ProjectileOwner;
}

export interface ProjectileEvent {
  readonly kind: 'cover' | 'target';
  readonly position: Vec3;
  readonly cell: CellPoint | null;
  readonly material: MaterialId | null;
  readonly destroyedCover: boolean;
  readonly targetId: string | null;
  readonly damage: number;
  readonly owner: ProjectileOwner;
}

export interface ProjectilesInput {
  readonly bullets: Bullet[];
  readonly stepSeconds: number;
  readonly grid: WorldGrid;
  readonly targets: readonly ProjectileTarget[];
}

export function isWeaponReady(player: PlayerState): boolean {
  return player.reloadRemaining <= 0;
}

/** 0 = acaba de disparar; 1 = lista para volver a disparar. */
export function reloadProgress(player: PlayerState): number {
  if (player.reloadSeconds <= 0) return 1;
  return 1 - player.reloadRemaining / player.reloadSeconds;
}

function muzzlePosition(player: PlayerState): Vec3 {
  const forward = playerForward(player);
  const offset = player.radius + 0.9;
  return {
    x: player.position.x + forward.x * offset,
    y: COMBAT.muzzleHeight,
    z: player.position.z + forward.z * offset,
  };
}

/** Crea un proyectil del jugador en la boca del cañón, alineado con la mira. */
export function createPlayerBullet(player: PlayerState): Bullet {
  const forward = playerForward(player);
  return createBullet({
    position: muzzlePosition(player),
    direction: { x: forward.x, y: 0, z: forward.z },
    speed: player.shellSpeed,
    damage: player.damage,
    owner: 'player',
  });
}

/** Avanza la recarga y dispara si corresponde. Devuelve true si se disparó. */
export function updatePlayerWeapon(
  player: PlayerState,
  fireRequested: boolean,
  stepSeconds: number,
  bullets: Bullet[],
): boolean {
  player.reloadRemaining = Math.max(0, player.reloadRemaining - stepSeconds);
  if (!fireRequested || player.reloadRemaining > 0) return false;

  bullets.push(createPlayerBullet(player));
  player.reloadRemaining = player.reloadSeconds;
  return true;
}

function coverHeightAt(grid: WorldGrid, cell: CellPoint): number {
  return isInside(grid, cell.x, cell.z)
    ? obstacleHeightAt(grid, cell.x, cell.z)
    : Number.POSITIVE_INFINITY;
}

function findTargetHit(
  position: Vec3,
  bullet: Bullet,
  targets: readonly ProjectileTarget[],
): ProjectileTarget | undefined {
  const point: WorldPoint = { x: position.x, z: position.z };
  return targets.find(
    (target) =>
      target.faction !== bullet.owner &&
      planarDistanceSquared(point, target.position) <=
        (target.radius + bullet.radius) * (target.radius + bullet.radius),
  );
}

function hitCover(
  grid: WorldGrid,
  cell: CellPoint,
  bullet: Bullet,
  position: Vec3,
): ProjectileEvent {
  const inside = isInside(grid, cell.x, cell.z);
  const obstacle = inside ? getObstacle(grid, cell.x, cell.z) : null;
  const material = obstacle?.material ?? null;
  const destroyed = obstacle && inside ? damageObstacle(grid, cell.x, cell.z, bullet.damage) : false;
  bullet.alive = false;
  return {
    kind: 'cover',
    position,
    cell: inside ? cell : null,
    material,
    destroyedCover: destroyed,
    targetId: null,
    damage: bullet.damage,
    owner: bullet.owner,
  };
}

function advanceBullet(bullet: Bullet, input: ProjectilesInput): ProjectileEvent | null {
  const { grid, targets, stepSeconds } = input;
  const distance = bullet.speed * stepSeconds;
  const steps = Math.max(1, Math.ceil(distance / COMBAT.bulletStepMeters));
  const stepDistance = distance / steps;

  for (let step = 0; step < steps; step += 1) {
    const candidate: Vec3 = {
      x: bullet.position.x + bullet.direction.x * stepDistance,
      y: bullet.position.y + bullet.direction.y * stepDistance,
      z: bullet.position.z + bullet.direction.z * stepDistance,
    };
    const cell = worldToCell(grid, candidate.x, candidate.z);

    if (candidate.y <= coverHeightAt(grid, cell)) {
      return hitCover(grid, cell, bullet, candidate);
    }

    const target = findTargetHit(candidate, bullet, targets);
    if (target) {
      bullet.alive = false;
      return {
        kind: 'target',
        position: candidate,
        cell: null,
        material: null,
        destroyedCover: false,
        targetId: target.id,
        damage: bullet.damage,
        owner: bullet.owner,
      };
    }

    bullet.position = candidate;
  }

  bullet.age += stepSeconds;
  if (bullet.age > COMBAT.bulletMaxAgeSeconds) bullet.alive = false;
  return null;
}

/** Actualiza todos los proyectiles, elimina los muertos y devuelve los impactos del paso. */
export function updateProjectiles(input: ProjectilesInput): ProjectileEvent[] {
  const events: ProjectileEvent[] = [];

  for (const bullet of input.bullets) {
    if (!bullet.alive) continue;
    const event = advanceBullet(bullet, input);
    if (event) events.push(event);
  }

  for (let index = input.bullets.length - 1; index >= 0; index -= 1) {
    if (!input.bullets[index]?.alive) input.bullets.splice(index, 1);
  }

  return events;
}
