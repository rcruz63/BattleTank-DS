/** Movimiento del jugador: giro solidario y avance con colisión deslizante contra rejilla y tanques. */

import { clamp, wrapAngle } from '../core/math';
import type { EnemyState } from '../entities/enemy';
import type { PlayerState } from '../entities/player';
import type { CollisionResult } from '../world/collision';
import { moveCircleAroundEntities } from '../world/entityCollision';
import type { EntityBlocker } from '../world/entityCollision';
import type { WorldGrid } from '../world/types';

export interface MovementCommand {
  /** -1 atrás .. 1 adelante. */
  readonly forward: number;
  /** -1 izquierda .. 1 derecha. */
  readonly turn: number;
}

export interface PlayerMovement {
  readonly player: PlayerState;
  readonly command: MovementCommand;
  readonly stepSeconds: number;
  readonly grid: WorldGrid;
  /** Enemigos vivos: sus círculos bloquean el paso del jugador. */
  readonly enemies: readonly EnemyState[];
}

/** Círculos bloqueadores de los enemigos vivos (los destruidos ya no existen para la colisión). */
function blockerCircles(enemies: readonly EnemyState[]): EntityBlocker[] {
  const blockers: EntityBlocker[] = [];
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    blockers.push({ position: enemy.position, radius: enemy.radius });
  }
  return blockers;
}

/** Aplica giro y avance en un paso de simulación. Devuelve el resultado de la colisión. */
export function updatePlayerMovement(move: PlayerMovement): CollisionResult {
  const { player, command, stepSeconds, grid, enemies } = move;
  const turn = clamp(command.turn, -1, 1);
  player.yaw = wrapAngle(player.yaw + turn * player.turnSpeed * stepSeconds);

  const forward = clamp(command.forward, -1, 1);
  if (forward === 0) {
    return { position: player.position, collided: false };
  }

  const distance = (forward > 0 ? player.speed : player.reverseSpeed) * forward * stepSeconds;
  const result = moveCircleAroundEntities({
    grid,
    position: player.position,
    delta: { x: Math.sin(player.yaw) * distance, z: Math.cos(player.yaw) * distance },
    radius: player.radius,
    blockers: blockerCircles(enemies),
  });
  player.position = result.position;
  return result;
}
