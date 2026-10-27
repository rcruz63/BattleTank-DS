import { describe, expect, it } from 'vitest';
import { PICKUP_RULES } from '../../src/config/pickups';
import type { PickupKind } from '../../src/config/pickups';
import { createPickups } from '../../src/entities/pickup';
import type { PickupState } from '../../src/entities/pickup';
import { createPlayer } from '../../src/entities/player';
import type { PlayerState } from '../../src/entities/player';
import {
  collectPickups,
  createLootState,
  damageMultiplier,
  damageTakenMultiplier,
  pickupEffectText,
  reloadMultiplier,
  updateLoot,
} from '../../src/systems/loot';
import type { LootState } from '../../src/systems/loot';
import type { WorldPoint } from '../../src/world/types';

function makePlayer(): PlayerState {
  return createPlayer({ x: 10, z: 10, yaw: 0 });
}

function pickupOfKind(kind: PickupKind, position: WorldPoint = { x: 10, z: 10 }): PickupState {
  const pickup = createPickups([position, position, position]).find((item) => item.kind === kind);
  if (!pickup) throw new Error(`No se generó el pickup ${kind}.`);
  return pickup;
}

function collect(player: PlayerState, loot: LootState, kind: PickupKind): boolean {
  return collectPickups(player, loot, [pickupOfKind(kind)]).length > 0;
}

describe('efectos de los pickups', () => {
  it('el botiquín cura 30 PV sin superar el máximo', () => {
    const player = makePlayer();
    const loot = createLootState();
    player.health = 90;

    const pickup = pickupOfKind('health');
    const collected = collectPickups(player, loot, [pickup]);

    expect(collected).toEqual([pickup]);
    expect(pickup.collected).toBe(true);
    expect(player.health).toBe(100);

    player.health = 100;
    expect(collect(player, loot, 'health')).toBe(true);
    expect(player.health).toBe(100);
  });

  it('la mejora sube la vida máxima y el daño reducido acumula hasta ×3', () => {
    const player = makePlayer();
    const loot = createLootState();
    expect(damageTakenMultiplier(player, loot)).toBeCloseTo(1 - player.armor, 9);

    for (let stack = 1; stack <= PICKUP_RULES.upgradeMaxStacks; stack += 1) {
      expect(collect(player, loot, 'upgrade')).toBe(true);
      expect(loot.upgradeStacks).toBe(stack);
      expect(player.maxHealth).toBe(100 + PICKUP_RULES.upgradeMaxHealth * stack);
      expect(player.health).toBe(player.maxHealth);
    }

    const expected =
      (1 - player.armor) *
      (1 - PICKUP_RULES.upgradeDamageReduction) ** PICKUP_RULES.upgradeMaxStacks;
    expect(damageTakenMultiplier(player, loot)).toBeCloseTo(expected, 9);

    expect(collect(player, loot, 'upgrade')).toBe(true);
    expect(loot.upgradeStacks).toBe(PICKUP_RULES.upgradeMaxStacks);
    expect(player.maxHealth).toBe(
      100 + PICKUP_RULES.upgradeMaxHealth * PICKUP_RULES.upgradeMaxStacks,
    );
  });

  it('la potencia activa durante 20 s el daño y la recarga y se renueva al repetir', () => {
    const player = makePlayer();
    const loot = createLootState();

    expect(collect(player, loot, 'power')).toBe(true);
    expect(loot.powerRemaining).toBe(PICKUP_RULES.powerSeconds);
    expect(damageMultiplier(loot)).toBe(PICKUP_RULES.powerDamageMultiplier);
    expect(reloadMultiplier(loot)).toBe(PICKUP_RULES.powerReloadMultiplier);

    updateLoot(loot, 5);
    expect(loot.powerRemaining).toBe(PICKUP_RULES.powerSeconds - 5);
    expect(collect(player, loot, 'power')).toBe(true);
    expect(loot.powerRemaining).toBe(PICKUP_RULES.powerSeconds);

    updateLoot(loot, PICKUP_RULES.powerSeconds);
    expect(loot.powerRemaining).toBe(0);
    expect(damageMultiplier(loot)).toBe(1);
    expect(reloadMultiplier(loot)).toBe(1);
  });

  it('solo se recoge dentro del radio de 2 m', () => {
    const player = makePlayer();
    const loot = createLootState();
    const near = pickupOfKind('health', { x: 11.9, z: 10 });
    const far = pickupOfKind('health', { x: 12.1, z: 10 });

    expect(collectPickups(player, loot, [far])).toHaveLength(0);
    expect(far.collected).toBe(false);
    expect(collectPickups(player, loot, [near])).toHaveLength(1);
    expect(near.collected).toBe(true);
  });

  it('un jugador destruido no recoge pickups', () => {
    const player = makePlayer();
    const loot = createLootState();
    player.alive = false;

    expect(collect(player, loot, 'health')).toBe(false);
    expect(player.health).toBe(100);
  });

  it('describe el efecto recogido para el aviso temporal', () => {
    const loot = createLootState();
    expect(pickupEffectText('health', loot)).toBe(`+${PICKUP_RULES.healthRestore} PV`);
    expect(pickupEffectText('power', loot)).toBe(`Potencia ${PICKUP_RULES.powerSeconds} s`);

    collect(makePlayer(), loot, 'upgrade');
    expect(pickupEffectText('upgrade', loot)).toBe('Mejora ×1');
  });
});
