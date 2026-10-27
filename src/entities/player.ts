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
  readonly reloadSeconds: number;
  readonly damage: number;
  readonly shellSpeed: number;
  readonly armor: number;
  /** Tiempo restante de recarga; 0 = arma lista. */
  reloadRemaining: number;
  /** Duración de la recarga en curso; la potencia la reduce temporalmente. */
  reloadDuration: number;
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
    reloadSeconds: PLAYER_TANK.reloadSeconds,
    damage: PLAYER_TANK.damage,
    shellSpeed: PLAYER_TANK.shellSpeed,
    armor: PLAYER_TANK.armor,
    reloadRemaining: 0,
    reloadDuration: PLAYER_TANK.reloadSeconds,
    alive: true,
  };
}

/** Vector unitario de avance del tanque (también es el de la mira). */
export function playerForward(player: PlayerState): WorldPoint {
  return { x: Math.sin(player.yaw), z: Math.cos(player.yaw) };
}
