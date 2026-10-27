/** Aplicación del daño de un impacto: blindaje base, mejoras, zona direccional y muerte. */

import type { EnemyState } from '../entities/enemy';
import type { PlayerState } from '../entities/player';
import { zoneDamageMultiplier } from './armor';
import type { ProjectileEvent } from './combat';
import { damageTakenMultiplier } from './loot';
import type { LootState } from './loot';

export interface DamageContext {
  readonly player: PlayerState;
  readonly enemies: readonly EnemyState[];
  readonly loot: LootState;
}

/** Aplica el impacto al tanque correspondiente. Devuelve true si el jugador recibió daño. */
export function applyProjectileHit(event: ProjectileEvent, context: DamageContext): boolean {
  if (!event.targetId) return false;
  const { player, enemies, loot } = context;
  const zoneMultiplier = event.zone ? zoneDamageMultiplier(event.zone) : 1;

  if (event.targetId === 'player') {
    if (!player.alive) return false;
    player.health = Math.max(
      0,
      player.health - event.damage * damageTakenMultiplier(player, loot) * zoneMultiplier,
    );
    if (player.health <= 0) player.alive = false;
    return true;
  }

  const enemy = enemies.find((item) => item.id === event.targetId);
  if (!enemy || !enemy.alive) return false;
  enemy.health = Math.max(0, enemy.health - event.damage * (1 - enemy.armor) * zoneMultiplier);
  if (enemy.health <= 0) enemy.alive = false;
  return false;
}
