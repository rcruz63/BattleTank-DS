/** Proyectil balístico simple. La simulación y las colisiones viven en `systems/combat.ts`. */

import { COMBAT } from '../config/balance';
import { normalize3 } from '../core/math';
import type { Vec3 } from '../core/math';

export type ProjectileOwner = 'player' | 'enemy';

export interface Bullet {
  position: Vec3;
  readonly direction: Vec3;
  readonly speed: number;
  readonly damage: number;
  readonly owner: ProjectileOwner;
  readonly radius: number;
  age: number;
  alive: boolean;
}

export interface BulletParams {
  readonly position: Vec3;
  readonly direction: Vec3;
  readonly speed: number;
  readonly damage: number;
  readonly owner: ProjectileOwner;
  readonly radius?: number;
}

export function createBullet(params: BulletParams): Bullet {
  return {
    position: params.position,
    direction: normalize3(params.direction),
    speed: params.speed,
    damage: params.damage,
    owner: params.owner,
    radius: params.radius ?? COMBAT.bulletRadius,
    age: 0,
    alive: true,
  };
}
