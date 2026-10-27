/**
 * IA de los tanques enemigos.
 *
 * Máquina de estados sencilla: sin alerta se quedan al acecho; al detectar al jugador (visión o
 * disparo cercano) avanzan con A* hasta tener línea de visión y entonces apuntan y disparan. Las
 * coberturas intactas bloquean tanto la visión como los proyectiles.
 */

import { AI_TUNING, COMBAT } from '../config/balance';
import { angleDifference, degreesToRadians, rotateTowards } from '../core/math';
import type { Rng } from '../core/rng';
import { createBullet } from '../entities/bullet';
import type { Bullet } from '../entities/bullet';
import type { EnemyState } from '../entities/enemy';
import type { PlayerState } from '../entities/player';
import { moveCircleAroundEntities } from '../world/entityCollision';
import type { EntityBlocker } from '../world/entityCollision';
import { planarDistance } from '../world/geometry';
import { cellCenter, worldToCell } from '../world/grid';
import { hasLineOfSight } from '../world/los';
import { findPath } from '../world/pathfind';
import type { CellPoint, WorldGrid, WorldPoint } from '../world/types';

export interface AiContext {
  readonly grid: WorldGrid;
  readonly player: PlayerState;
  readonly stepSeconds: number;
  readonly rng: Rng;
  readonly bullets: Bullet[];
}

function aimAngle(from: WorldPoint, to: WorldPoint): number {
  return Math.atan2(to.x - from.x, to.z - from.z);
}

/** Despierta a los enemigos cercanos cuando el jugador dispara (les delata el estampido). */
export function alertEnemiesNear(enemies: readonly EnemyState[], point: WorldPoint, radius: number): void {
  for (const enemy of enemies) {
    if (!enemy.alive || enemy.alerted) continue;
    if (planarDistance(enemy.position, point) <= radius) {
      enemy.alerted = true;
      enemy.pathTimer = 0;
    }
  }
}

function fireEnemyBullet(enemy: EnemyState, context: AiContext): void {
  const baseAngle = aimAngle(enemy.position, context.player.position);
  const spread = context.rng.range(-1, 1) * AI_TUNING.fireSpreadRadians;
  const angle = baseAngle + spread;
  const direction = { x: Math.sin(angle), y: 0, z: Math.cos(angle) };
  const offset = enemy.radius + 0.9;

  context.bullets.push(
    createBullet({
      position: {
        x: enemy.position.x + direction.x * offset,
        y: COMBAT.muzzleHeight,
        z: enemy.position.z + direction.z * offset,
      },
      direction,
      speed: enemy.shellSpeed,
      damage: enemy.damage,
      owner: 'enemy',
    }),
  );
}

function updateAttack(enemy: EnemyState, context: AiContext): void {
  const targetAngle = aimAngle(enemy.position, context.player.position);
  const reloading = enemy.reloadRemaining > 0;

  // Ventana táctica (bloque 7.5): mientras recarga mantiene el rumbo y no corrige el apuntado.
  if (!reloading) {
    enemy.yaw = rotateTowards(enemy.yaw, targetAngle, enemy.turnSpeed * context.stepSeconds);
  }

  const aimError = Math.abs(angleDifference(enemy.yaw, targetAngle));
  const canShoot =
    aimError <= degreesToRadians(AI_TUNING.fireArcDegrees) &&
    enemy.reactionTimer <= 0 &&
    !reloading;
  if (!canShoot) return;

  fireEnemyBullet(enemy, context);
  enemy.reloadRemaining = enemy.reloadSeconds;
  enemy.muzzleFlash = 1;
}

/** Siguiente centro de celda de la ruta; consume las celdas ya alcanzadas. */
function nextWaypoint(enemy: EnemyState, grid: WorldGrid): WorldPoint | null {
  const path = enemy.path;
  if (!path || path.length === 0) return null;

  while (path.length > 1) {
    const next = path[1] as CellPoint;
    const center = cellCenter(grid, next.x, next.z);
    if (planarDistance(enemy.position, center) > 1.2) return center;
    path.shift();
  }

  const last = path[0] as CellPoint;
  const center = cellCenter(grid, last.x, last.z);
  return planarDistance(enemy.position, center) > 1 ? center : null;
}

/** Círculos que bloquean el avance de un enemigo: el jugador y los demás enemigos, si están vivos. */
function blockerCircles(
  enemy: EnemyState,
  others: readonly EnemyState[],
  player: PlayerState,
): EntityBlocker[] {
  const blockers: EntityBlocker[] = [];
  if (player.alive) blockers.push({ position: player.position, radius: player.radius });
  for (const other of others) {
    if (other !== enemy && other.alive) {
      blockers.push({ position: other.position, radius: other.radius });
    }
  }
  return blockers;
}

function advanceEnemy(enemy: EnemyState, context: AiContext, others: readonly EnemyState[]): void {
  const { grid, player, stepSeconds } = context;
  if (planarDistance(enemy.position, player.position) <= AI_TUNING.minAdvanceDistance) {
    return;
  }

  if (enemy.pathTimer <= 0) {
    const start = worldToCell(grid, enemy.position.x, enemy.position.z);
    const goal = worldToCell(grid, player.position.x, player.position.z);
    enemy.path = findPath(grid, start, goal);
    enemy.pathTimer = AI_TUNING.pathIntervalSeconds;
  }

  const waypoint = nextWaypoint(enemy, grid);
  if (!waypoint) return;

  const targetAngle = aimAngle(enemy.position, waypoint);
  enemy.yaw = rotateTowards(enemy.yaw, targetAngle, enemy.turnSpeed * stepSeconds);
  if (Math.abs(angleDifference(enemy.yaw, targetAngle)) > 0.45) return;

  const distance = enemy.speed * AI_TUNING.moveSpeedFactor * stepSeconds;
  const result = moveCircleAroundEntities({
    grid,
    position: enemy.position,
    delta: { x: Math.sin(enemy.yaw) * distance, z: Math.cos(enemy.yaw) * distance },
    radius: enemy.radius,
    blockers: blockerCircles(enemy, others, player),
  });
  enemy.position = result.position;
  if (result.collided) enemy.pathTimer = 0;
}

interface Perception {
  readonly seesPlayer: boolean;
  readonly distance: number;
}

function tickEnemyTimers(enemy: EnemyState, stepSeconds: number): void {
  enemy.reloadRemaining = Math.max(0, enemy.reloadRemaining - stepSeconds);
  enemy.pathTimer = Math.max(0, enemy.pathTimer - stepSeconds);
  enemy.reactionTimer = Math.max(0, enemy.reactionTimer - stepSeconds);
  enemy.muzzleFlash = Math.max(0, enemy.muzzleFlash - stepSeconds * 6);
}

function perceive(enemy: EnemyState, context: AiContext): Perception {
  const distance = planarDistance(enemy.position, context.player.position);
  const seesPlayer =
    distance <= AI_TUNING.detectionRange &&
    hasLineOfSight(context.grid, enemy.position, context.player.position);
  return { seesPlayer, distance };
}

function updateAwareness(enemy: EnemyState, perception: Perception): void {
  if (!perception.seesPlayer || enemy.alerted) return;
  enemy.alerted = true;
  enemy.reactionTimer = AI_TUNING.reactionSeconds;
  enemy.pathTimer = 0;
}

function updateEnemy(enemy: EnemyState, context: AiContext, others: readonly EnemyState[]): void {
  tickEnemyTimers(enemy, context.stepSeconds);

  if (!context.player.alive) {
    enemy.aiMode = 'idle';
    return;
  }

  const perception = perceive(enemy, context);
  updateAwareness(enemy, perception);

  if (!enemy.alerted) {
    enemy.aiMode = 'idle';
    return;
  }

  if (perception.seesPlayer && perception.distance <= AI_TUNING.attackRange) {
    enemy.aiMode = 'attack';
    updateAttack(enemy, context);
    return;
  }

  enemy.aiMode = 'advance';
  advanceEnemy(enemy, context, others);
}

export function updateEnemies(enemies: readonly EnemyState[], context: AiContext): void {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    updateEnemy(enemy, context, enemies);
  }
}
