import { describe, expect, it } from 'vitest';
import { createEnemy } from '../../src/entities/enemy';
import { createPlayer } from '../../src/entities/player';
import type { PlayerState } from '../../src/entities/player';
import type { ArmorZone } from '../../src/systems/armor';
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
  zone: ArmorZone | null = 'side',
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
    zone,
  };
}

function contextFor(player: PlayerState, loot: LootState) {
  return { player, enemies: [], loot };
}

function shotsToKill(
  type: 'light' | 'heavy',
  zone: ArmorZone,
): { shots: number; enemy: ReturnType<typeof createEnemy> } {
  const player = makePlayer();
  const loot = createLootState();
  const enemy = createEnemy('objetivo', type, { x: 10, z: 20, yaw: 0 });
  let shots = 0;

  while (enemy.alive && shots < 20) {
    applyProjectileHit(hit(enemy.id, 40, 'player', zone), { player, enemies: [enemy], loot });
    shots += 1;
  }

  return { shots, enemy };
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

  it('combina la zona con el blindaje y las mejoras', () => {
    const player = makePlayer();
    const loot = createLootState();
    loot.upgradeStacks = 2;
    const factor = (1 - player.armor) * 0.9 ** 2;

    applyProjectileHit(hit('player', 40, 'enemy', 'front'), contextFor(player, loot));
    expect(player.health).toBeCloseTo(100 - 40 * factor * 0.5, 9);

    player.health = 100;
    applyProjectileHit(hit('player', 40, 'enemy', 'rear'), contextFor(player, loot));
    expect(player.health).toBeCloseTo(100 - 40 * factor * 1.5, 9);
  });

  it('aplica los multiplicadores de zona al jugador sin mejoras', () => {
    const player = makePlayer();
    const loot = createLootState();
    const base = 40 * (1 - player.armor);

    applyProjectileHit(hit('player', 40, 'enemy', 'front'), contextFor(player, loot));
    expect(player.health).toBeCloseTo(100 - base * 0.5, 9);

    player.health = 100;
    applyProjectileHit(hit('player', 40, 'enemy', 'rear'), contextFor(player, loot));
    expect(player.health).toBeCloseTo(100 - base * 1.5, 9);
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

  it('daña al enemigo con su blindaje y la zona del impacto', () => {
    const player = makePlayer();
    const loot = createLootState();
    const light = createEnemy('ligero', 'light', { x: 10, z: 20, yaw: 0 });
    const heavy = createEnemy('pesado', 'heavy', { x: 10, z: 24, yaw: 0 });

    applyProjectileHit(hit('ligero', 40, 'player', 'front'), {
      player,
      enemies: [light, heavy],
      loot,
    });
    expect(light.health).toBe(80);

    applyProjectileHit(hit('ligero', 40, 'player', 'rear'), {
      player,
      enemies: [light, heavy],
      loot,
    });
    expect(light.health).toBe(20);

    applyProjectileHit(hit('pesado', 40, 'player', 'rear'), {
      player,
      enemies: [light, heavy],
      loot,
    });
    expect(heavy.health).toBeCloseTo(140 - 40 * (1 - heavy.armor) * 1.5, 9);
  });

  it('mantiene el balance previsto de impactos por zona', () => {
    expect(shotsToKill('light', 'front').shots).toBe(5);
    expect(shotsToKill('light', 'side').shots).toBe(3);
    expect(shotsToKill('light', 'rear').shots).toBe(2);
    expect(shotsToKill('heavy', 'front').shots).toBe(8);
    expect(shotsToKill('heavy', 'side').shots).toBe(4);
    expect(shotsToKill('heavy', 'rear').shots).toBe(3);
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
