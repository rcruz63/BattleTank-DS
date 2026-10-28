/** Aplicación del daño de un impacto: blindaje base, mejoras, zona direccional y muerte. */

import type { EnemyState } from '../entities/enemy';
import type { PlayerState } from '../entities/player';
import { zoneDamageMultiplier } from './armor';
import type { ArmorZone } from './armor';
import type { ProjectileEvent } from './combat';
import { damageTakenMultiplier } from './loot';
import type { LootState } from './loot';

export interface DamageContext {
  readonly player: PlayerState;
  readonly enemies: readonly EnemyState[];
  readonly loot: LootState;
}

export interface DamageResult {
  /** True si el impacto lo recibió el jugador. */
  readonly playerHit: boolean;
  readonly target: 'player' | 'enemy' | null;
  readonly targetId: string | null;
  /** Daño aplicado después de blindaje, mejoras y zona. */
  readonly damage: number;
  readonly zone: ArmorZone | null;
  readonly killed: boolean;
}

function noDamage(zone: ArmorZone | null): DamageResult {
  return {
    playerHit: false,
    target: null,
    targetId: null,
    damage: 0,
    zone,
    killed: false,
  };
}

/**
 * Resuelve el impacto y devuelve información suficiente para el feedback visual.
 * La lógica de daño sigue siendo la misma: `armor`, mejoras y multiplicador de zona.
 */
export function resolveProjectileHit(
  event: ProjectileEvent,
  context: DamageContext,
): DamageResult {
  if (!event.targetId) return noDamage(event.zone);
  const { player, enemies, loot } = context;
  const zoneMultiplier = event.zone ? zoneDamageMultiplier(event.zone) : 1;

  if (event.targetId === 'player') {
    if (!player.alive) return noDamage(event.zone);
    const damage = event.damage * damageTakenMultiplier(player, loot) * zoneMultiplier;
    player.health = Math.max(0, player.health - damage);
    if (player.health <= 0) player.alive = false;
    return {
      playerHit: true,
      target: 'player',
      targetId: 'player',
      damage,
      zone: event.zone,
      killed: !player.alive,
    };
  }

  const enemy = enemies.find((item) => item.id === event.targetId);
  if (!enemy || !enemy.alive) return noDamage(event.zone);
  const damage = event.damage * (1 - enemy.armor) * zoneMultiplier;
  enemy.health = Math.max(0, enemy.health - damage);
  enemy.hitFlash = 1;
  if (enemy.health <= 0) enemy.alive = false;
  return {
    playerHit: false,
    target: 'enemy',
    targetId: enemy.id,
    damage,
    zone: event.zone,
    killed: !enemy.alive,
  };
}

/** Compatibilidad: true si el jugador recibió daño. */
export function applyProjectileHit(event: ProjectileEvent, context: DamageContext): boolean {
  return resolveProjectileHit(event, context).playerHit;
}
