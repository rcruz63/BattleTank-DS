/**
 * Combate: recarga del jugador, creación de proyectiles y avance con colisiones.
 *
 * Los proyectiles son balísticos discretos (no hitscan) con dirección 3D: el cabeceo del cañón
 * influye de verdad. El avance se hace en subpasos para no atravesar coberturas.
 */

import { COMBAT, GUN, TANK_TARGET_HEIGHT } from '../config/balance';
import { normalize3 } from '../core/math';
import type { Vec3 } from '../core/math';
import type { MaterialId } from '../config/materials';
import { createBullet } from '../entities/bullet';
import type { Bullet, ProjectileOwner } from '../entities/bullet';
import type { EnemyState } from '../entities/enemy';
import { playerForward } from '../entities/player';
import type { PlayerState } from '../entities/player';
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
  /** Altura del cilindro de impacto (m). */
  readonly height: number;
  readonly faction: ProjectileOwner;
}

export interface ProjectileEvent {
  readonly kind: 'cover' | 'ground' | 'target';
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
  if (player.reloadDuration <= 0) return 1;
  return 1 - player.reloadRemaining / player.reloadDuration;
}

/** Objetivos vivos del combate: el jugador y los enemigos que siguen en pie. */
export function buildProjectileTargets(
  player: PlayerState,
  enemies: readonly EnemyState[],
): ProjectileTarget[] {
  const targets: ProjectileTarget[] = [];
  if (player.alive) {
    targets.push({
      id: 'player',
      position: player.position,
      radius: player.radius,
      height: TANK_TARGET_HEIGHT,
      faction: 'player',
    });
  }
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    targets.push({
      id: enemy.id,
      position: enemy.position,
      radius: enemy.radius,
      height: TANK_TARGET_HEIGHT,
      faction: 'enemy',
    });
  }
  return targets;
}

/** Crea un proyectil en la boca del cañón, en la dirección 3D de la mira. */
export function createPlayerBullet(
  player: PlayerState,
  direction: Vec3,
  damageMultiplier = 1,
): Bullet {
  const forward = playerForward(player);
  const unit = normalize3(direction);
  const pivot: Vec3 = {
    x: player.position.x + forward.x * GUN.pivotForward,
    y: GUN.pivotHeight,
    z: player.position.z + forward.z * GUN.pivotForward,
  };
  const position: Vec3 = {
    x: pivot.x + unit.x * GUN.barrelLength,
    y: pivot.y + unit.y * GUN.barrelLength,
    z: pivot.z + unit.z * GUN.barrelLength,
  };

  return createBullet({
    position,
    direction: unit,
    speed: player.shellSpeed,
    damage: player.damage * damageMultiplier,
    owner: 'player',
  });
}

export interface PlayerWeaponStep {
  readonly player: PlayerState;
  readonly fireRequested: boolean;
  readonly stepSeconds: number;
  readonly bullets: Bullet[];
  readonly direction: Vec3;
  /** Multiplicador de daño (potencia); 1 por defecto. */
  readonly damageMultiplier?: number;
  /** Multiplicador de duración de la recarga (potencia); 1 por defecto. */
  readonly reloadMultiplier?: number;
}

/** Avanza la recarga y dispara si corresponde. Devuelve true si se disparó. */
export function updatePlayerWeapon(step: PlayerWeaponStep): boolean {
  const { player, fireRequested, stepSeconds, bullets, direction } = step;
  player.reloadRemaining = Math.max(0, player.reloadRemaining - stepSeconds);
  if (!fireRequested || player.reloadRemaining > 0) return false;

  bullets.push(createPlayerBullet(player, direction, step.damageMultiplier ?? 1));
  player.reloadDuration = player.reloadSeconds * (step.reloadMultiplier ?? 1);
  player.reloadRemaining = player.reloadDuration;
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
      position.y >= 0 &&
      position.y <= target.height &&
      planarDistanceSquared(point, target.position) <=
        (target.radius + bullet.radius) * (target.radius + bullet.radius),
  );
}

function hitGround(bullet: Bullet, position: Vec3): ProjectileEvent {
  bullet.alive = false;
  return {
    kind: 'ground',
    position,
    cell: null,
    material: null,
    destroyedCover: false,
    targetId: null,
    damage: bullet.damage,
    owner: bullet.owner,
  };
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

    if (candidate.y <= 0) return hitGround(bullet, candidate);

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
