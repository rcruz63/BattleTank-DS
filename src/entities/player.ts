/** Estado del tanque del jugador. La lógica de movimiento vive en `systems/movement.ts`. */

import { PLAYER_RADIUS } from '../config/balance';
import { PLAYER_TANK } from '../config/tanks';
import { degreesToRadians } from '../core/math';
import type { SpawnPoint, WorldPoint } from '../world/types';

export interface PlayerState {
  position: WorldPoint;
  /** Rumbo del casco y de la mira (solidarios). */
  yaw: number;
  health: number;
  maxHealth: number;
  readonly speed: number;
  readonly reverseSpeed: number;
  readonly turnSpeed: number;
  readonly radius: number;
  alive: boolean;
}

export function createPlayer(spawn: SpawnPoint): PlayerState {
  return {
    position: { x: spawn.x, z: spawn.z },
    yaw: spawn.yaw,
    health: PLAYER_TANK.maxHealth,
    maxHealth: PLAYER_TANK.maxHealth,
    speed: PLAYER_TANK.speed,
    reverseSpeed: PLAYER_TANK.speed * 0.5,
    turnSpeed: degreesToRadians(PLAYER_TANK.turnSpeedDegrees),
    radius: PLAYER_RADIUS,
    alive: true,
  };
}

/** Vector unitario de avance del tanque (también es el de la mira). */
export function playerForward(player: PlayerState): WorldPoint {
  return { x: Math.sin(player.yaw), z: Math.cos(player.yaw) };
}
