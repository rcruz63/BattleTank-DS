/**
 * Pickups: recogida, efectos de curación/mejora/potencia y multiplicadores derivados.
 *
 * El estado de partida (`LootState`) se guarda aparte del `PlayerState` para que este siga siendo
 * el de los stats base del tanque: aquí se acumulan las mejoras y el temporizador de potencia.
 */

import { PICKUP_RULES } from '../config/pickups';
import type { PickupKind } from '../config/pickups';
import type { PickupState } from '../entities/pickup';
import type { PlayerState } from '../entities/player';
import { planarDistance } from '../world/geometry';

export interface LootState {
  /** Mejoras acumuladas en la misión (0..`upgradeMaxStacks`). */
  upgradeStacks: number;
  /** Segundos restantes de potencia; 0 = inactiva. */
  powerRemaining: number;
}

export function createLootState(): LootState {
  return { upgradeStacks: 0, powerRemaining: 0 };
}

/**
 * Multiplicador del daño recibido: blindaje base del tanque y reducción de las mejoras.
 *
 * Supuesto actual: las reducciones son **multiplicativas** (`(1 − armor) × 0,9^mejoras`), para que
 * apilar mejoras nunca lleve a inmunidad; queda a validar por el Lead en la fase 9.
 */
export function damageTakenMultiplier(player: PlayerState, loot: LootState): number {
  return (1 - player.armor) * (1 - PICKUP_RULES.upgradeDamageReduction) ** loot.upgradeStacks;
}

/** Multiplicador de daño del cañón mientras la potencia está activa. */
export function damageMultiplier(loot: LootState): number {
  return loot.powerRemaining > 0 ? PICKUP_RULES.powerDamageMultiplier : 1;
}

/** Multiplicador de la duración de la recarga mientras la potencia está activa. */
export function reloadMultiplier(loot: LootState): number {
  return loot.powerRemaining > 0 ? PICKUP_RULES.powerReloadMultiplier : 1;
}

/** Avanza los temporizadores de los efectos temporales. */
export function updateLoot(loot: LootState, stepSeconds: number): void {
  loot.powerRemaining = Math.max(0, loot.powerRemaining - stepSeconds);
}

/** Texto corto del efecto para el aviso temporal (el HUD definitivo llega en la fase 8). */
export function pickupEffectText(kind: PickupKind, loot: LootState): string {
  switch (kind) {
    case 'health':
      return `+${PICKUP_RULES.healthRestore} PV`;
    case 'upgrade':
      return `Mejora ×${loot.upgradeStacks}`;
    case 'power':
      return `Potencia ${PICKUP_RULES.powerSeconds} s`;
  }
}

function applyUpgrade(player: PlayerState, loot: LootState): void {
  if (loot.upgradeStacks >= PICKUP_RULES.upgradeMaxStacks) return;
  loot.upgradeStacks += 1;
  player.maxHealth += PICKUP_RULES.upgradeMaxHealth;
  player.health = Math.min(player.maxHealth, player.health + PICKUP_RULES.upgradeMaxHealth);
}

function applyPickup(player: PlayerState, loot: LootState, kind: PickupKind): void {
  switch (kind) {
    case 'health':
      player.health = Math.min(player.maxHealth, player.health + PICKUP_RULES.healthRestore);
      return;
    case 'upgrade':
      applyUpgrade(player, loot);
      return;
    case 'power':
      loot.powerRemaining = PICKUP_RULES.powerSeconds;
  }
}

/**
 * Recoge los pickups al alcance del jugador y aplica su efecto.
 * Devuelve los recogidos en este paso (normalmente uno); los ya recogidos se ignoran.
 */
export function collectPickups(
  player: PlayerState,
  loot: LootState,
  pickups: readonly PickupState[],
): PickupState[] {
  const collected: PickupState[] = [];
  if (!player.alive) return collected;

  for (const pickup of pickups) {
    if (pickup.collected) continue;
    if (planarDistance(player.position, pickup.position) > PICKUP_RULES.collectRadiusMeters) {
      continue;
    }
    pickup.collected = true;
    applyPickup(player, loot, pickup.kind);
    collected.push(pickup);
  }

  return collected;
}
