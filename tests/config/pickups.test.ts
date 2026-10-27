import { describe, expect, it } from 'vitest';
import {
  PICKUP_COLORS,
  PICKUP_DEFINITIONS,
  PICKUP_RULES,
  PICKUP_SPAWN_KINDS,
} from '../../src/config/pickups';

describe('datos de pickups', () => {
  it('define los tres tipos con etiqueta y color', () => {
    expect(Object.keys(PICKUP_DEFINITIONS).sort()).toEqual(['health', 'power', 'upgrade']);
    for (const kind of PICKUP_SPAWN_KINDS) {
      expect(PICKUP_DEFINITIONS[kind].label.length).toBeGreaterThan(0);
      expect(PICKUP_COLORS[kind]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('usa valores de efecto positivos y coherentes', () => {
    expect(PICKUP_RULES.collectRadiusMeters).toBe(2);
    expect(PICKUP_RULES.healthRestore).toBeGreaterThan(0);
    expect(PICKUP_RULES.upgradeMaxStacks).toBe(3);
    expect(PICKUP_RULES.upgradeMaxHealth).toBeGreaterThan(0);
    expect(PICKUP_RULES.upgradeDamageReduction).toBeGreaterThan(0);
    expect(PICKUP_RULES.upgradeDamageReduction * PICKUP_RULES.upgradeMaxStacks).toBeLessThan(1);
    expect(PICKUP_RULES.powerSeconds).toBe(20);
    expect(PICKUP_RULES.powerDamageMultiplier).toBeGreaterThan(1);
    expect(PICKUP_RULES.powerReloadMultiplier).toBeGreaterThan(0);
    expect(PICKUP_RULES.powerReloadMultiplier).toBeLessThan(1);
  });

  it('el reparto determinista cubre los tres tipos', () => {
    expect(new Set(PICKUP_SPAWN_KINDS)).toEqual(new Set(['health', 'upgrade', 'power']));
  });
});
