import { describe, expect, it } from 'vitest';
import { createEnemy } from '../../src/entities/enemy';
import { createPlayer } from '../../src/entities/player';
import type { PlayerState } from '../../src/entities/player';
import type { ProjectileEvent } from '../../src/systems/combat';
import { applyProjectileHit } from '../../src/systems/damage';
import { createLootState } from '../../src/systems/loot';
import type { LootState } from '../../src/systems/loot';

function makePlayer(): PlayerState {
  return createPlayer({ x: 10, z: 10, yaw: 0 });
}

function hit(
  targetId: string | null,
  damage = 40,
  owner: 'player' | 'enemy' = 'enemy',
): ProjectileEvent {
  return {
    kind: 'target',
    position: { x: 10, y: 1, z: 10 },
    cell: null,
    material: null,
    destroyedCover: false,
    targetId,
    damage,
    owner,
  };
}

function contextFor(player: PlayerState, loot: LootState) {
  return { player, enemies: [], loot };
}

describe('aplicación de daño', () => {
  it('aplica el blindaje base al jugador', () => {
    const player = makePlayer();
    const loot = createLootState();
    expect(applyProjectileHit(hit('player'), contextFor(player, loot))).toBe(true);
    expect(player.health).toBeCloseTo(100 - 40 * (1 - player.armor), 9);
  });

  it('las mejoras reducen además el daño recibido', () => {
    const player = makePlayer();
    const loot = createLootState();
    loot.upgradeStacks = 2;

    applyProjectileHit(hit('player'), contextFor(player, loot));

    expect(player.health).toBeCloseTo(100 - 40 * (1 - player.armor) * 0.9 ** 2, 9);
  });

  it('destruye al jugador al llegar a cero', () => {
    const player = makePlayer();
    const loot = createLootState();
    player.health = 10;

    expect(applyProjectileHit(hit('player'), contextFor(player, loot))).toBe(true);
    expect(player.health).toBe(0);
    expect(player.alive).toBe(false);
  });

  it('un jugador ya destruido no recibe más daño', () => {
    const player = makePlayer();
    const loot = createLootState();
    player.alive = false;
    player.health = 0;

    expect(applyProjectileHit(hit('player'), contextFor(player, loot))).toBe(false);
    expect(player.health).toBe(0);
  });

  it('daña al enemigo con su blindaje y sin multiplicadores', () => {
    const player = makePlayer();
    const loot = createLootState();
    const light = createEnemy('ligero', 'light', { x: 10, z: 20, yaw: 0 });
    const heavy = createEnemy('pesado', 'heavy', { x: 10, z: 24, yaw: 0 });

    expect(
      applyProjectileHit(hit('ligero', 40, 'player'), { player, enemies: [light, heavy], loot }),
    ).toBe(false);
    expect(light.health).toBe(60);

    applyProjectileHit(hit('pesado', 40, 'player'), { player, enemies: [light, heavy], loot });
    expect(heavy.health).toBeCloseTo(140 - 40 * (1 - heavy.armor), 9);
  });

  it('ignora impactos sin objetivo o contra un enemigo ya destruido', () => {
    const player = makePlayer();
    const loot = createLootState();
    const enemy = createEnemy('enemigo-1', 'light', { x: 10, z: 20, yaw: 0 });
    enemy.alive = false;

    expect(applyProjectileHit(hit(null), { player, enemies: [enemy], loot })).toBe(false);
    expect(applyProjectileHit(hit('enemigo-1'), { player, enemies: [enemy], loot })).toBe(false);
    expect(player.health).toBe(100);
  });
});
