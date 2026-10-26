import { describe, expect, it } from 'vitest';
import { createBullet } from '../../src/entities/bullet';
import type { Bullet } from '../../src/entities/bullet';
import { createPlayer } from '../../src/entities/player';
import {
  createPlayerBullet,
  isWeaponReady,
  reloadProgress,
  updatePlayerWeapon,
  updateProjectiles,
} from '../../src/systems/combat';
import {
  createEmptyGrid,
  damageObstacle,
  getObstacle,
  isBlocked,
  placeObstacle,
} from '../../src/world/grid';

function playerAt(): ReturnType<typeof createPlayer> {
  return createPlayer({ x: 10, z: 5, yaw: 0 });
}

function gridWithWall(material: 'madera' | 'ladrillo' | 'hormigon'): ReturnType<typeof createEmptyGrid> {
  const grid = createEmptyGrid(5, 5, 4, 1);
  placeObstacle(grid, 2, 2, material);
  return grid;
}

function bulletAt(z = 7.5): Bullet {
  return createBullet({
    position: { x: 10, y: 1.25, z },
    direction: { x: 0, y: 0, z: 1 },
    speed: 80,
    damage: 40,
    owner: 'player',
  });
}

function impact(grid: ReturnType<typeof createEmptyGrid>, bullet: Bullet, stepSeconds = 0.1) {
  const bullets = [bullet];
  const events = updateProjectiles({ bullets, stepSeconds, grid, targets: [] });
  return { events, bullets };
}

describe('recarga y disparo', () => {
  it('respeta el tiempo de recarga y el disparo de flanco', () => {
    const player = playerAt();
    const bullets: Bullet[] = [];
    expect(isWeaponReady(player)).toBe(true);

    expect(updatePlayerWeapon(player, true, 1 / 60, bullets)).toBe(true);
    expect(bullets).toHaveLength(1);
    expect(isWeaponReady(player)).toBe(false);
    expect(reloadProgress(player)).toBeLessThan(1);

    expect(updatePlayerWeapon(player, true, 1 / 60, bullets)).toBe(false);
    expect(bullets).toHaveLength(1);

    player.reloadRemaining = 0;
    expect(updatePlayerWeapon(player, true, 1 / 60, bullets)).toBe(true);
    expect(bullets).toHaveLength(2);
    expect(isWeaponReady(player)).toBe(false);
  });

  it('genera el proyectil en la boca del cañón y alineado con la mira', () => {
    const player = playerAt();
    const bullet = createPlayerBullet(player);
    expect(bullet.position.x).toBeCloseTo(10, 6);
    expect(bullet.position.z).toBeCloseTo(5 + player.radius + 0.9, 6);
    expect(bullet.direction.z).toBeCloseTo(1, 6);
    expect(bullet.owner).toBe('player');
    expect(bullet.damage).toBe(player.damage);
  });
});

describe('impactos de proyectiles', () => {
  it('destruye una cobertura de madera de un disparo', () => {
    const grid = gridWithWall('madera');
    const { events, bullets } = impact(grid, bulletAt());
    expect(events).toHaveLength(1);
    expect(events[0]?.kind).toBe('cover');
    expect(events[0]?.destroyedCover).toBe(true);
    expect(isBlocked(grid, 2, 2)).toBe(false);
    expect(bullets).toHaveLength(0);
  });

  it('el ladrillo aguanta tres impactos', () => {
    const grid = gridWithWall('ladrillo');

    impact(grid, bulletAt());
    expect(getObstacle(grid, 2, 2)?.health).toBe(50);
    impact(grid, bulletAt());
    expect(getObstacle(grid, 2, 2)?.health).toBe(10);
    const third = impact(grid, bulletAt());
    expect(third.events[0]?.destroyedCover).toBe(true);
    expect(getObstacle(grid, 2, 2)?.health).toBe(0);
  });

  it('el hormigón detiene el proyectil sin dañarse', () => {
    const grid = gridWithWall('hormigon');
    const { events } = impact(grid, bulletAt());
    expect(events[0]?.kind).toBe('cover');
    expect(events[0]?.destroyedCover).toBe(false);
    expect(Number.isFinite(getObstacle(grid, 2, 2)?.health)).toBe(false);
  });

  it('los escombros no detienen los proyectiles', () => {
    const grid = gridWithWall('madera');
    damageObstacle(grid, 2, 2, 999);
    const bullet = bulletAt(7.5);
    const events = updateProjectiles({ bullets: [bullet], stepSeconds: 0.05, grid, targets: [] });
    expect(events).toHaveLength(0);
    expect(bullet.alive).toBe(true);
  });

  it('impacta en un blanco dentro de su radio', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    const bullet = bulletAt();
    const events = updateProjectiles({
      bullets: [bullet],
      stepSeconds: 0.05,
      grid,
      targets: [{ id: 'enemigo-1', position: { x: 10, z: 10 }, radius: 1, faction: 'enemy' }],
    });
    expect(events).toHaveLength(1);
    expect(events[0]?.kind).toBe('target');
    expect(events[0]?.targetId).toBe('enemigo-1');
    expect(bullet.alive).toBe(false);
  });

  it('no impacta a un blanco de su misma facción', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    const bullet = bulletAt(7.5);
    const bullets = [bullet];
    const events = updateProjectiles({
      bullets,
      stepSeconds: 0.05,
      grid,
      targets: [
        { id: 'aliado', position: { x: 10, z: 10 }, radius: 1, faction: 'player' },
      ],
    });
    expect(events).toHaveLength(0);
    expect(bullets).toHaveLength(1);
  });

  it('caduca pasado el tiempo máximo de vuelo', () => {
    const grid = createEmptyGrid(50, 50, 4, 1);
    const bullet = createBullet({
      position: { x: 100, y: 1.25, z: 100 },
      direction: { x: 0, y: 0, z: 1 },
      speed: 4,
      damage: 10,
      owner: 'player',
    });
    const bullets = [bullet];
    for (let step = 0; step < 8; step += 1) {
      updateProjectiles({ bullets, stepSeconds: 0.5, grid, targets: [] });
    }
    expect(bullets).toHaveLength(0);
  });
});
