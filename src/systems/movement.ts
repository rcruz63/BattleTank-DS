/** Movimiento del jugador: giro solidario y avance con colisión deslizante. */

import { clamp, wrapAngle } from '../core/math';
import { moveCircle } from '../world/collision';
import type { CollisionResult } from '../world/collision';
import type { WorldGrid } from '../world/types';
import type { PlayerState } from '../entities/player';

export interface MovementCommand {
  /** -1 atrás .. 1 adelante. */
  readonly forward: number;
  /** -1 izquierda .. 1 derecha. */
  readonly turn: number;
}

/** Aplica giro y avance en un paso de simulación. Devuelve el resultado de la colisión. */
export function updatePlayerMovement(
  player: PlayerState,
  command: MovementCommand,
  stepSeconds: number,
  grid: WorldGrid,
): CollisionResult {
  const turn = clamp(command.turn, -1, 1);
  player.yaw = wrapAngle(player.yaw + turn * player.turnSpeed * stepSeconds);

  const forward = clamp(command.forward, -1, 1);
  if (forward === 0) {
    return { position: player.position, collided: false };
  }

  const distance =
    (forward > 0 ? player.speed : player.reverseSpeed) * forward * stepSeconds;
  const delta = {
    x: Math.sin(player.yaw) * distance,
    z: Math.cos(player.yaw) * distance,
  };
  const result = moveCircle(grid, player.position, delta, player.radius);
  player.position = result.position;
  return result;
}
