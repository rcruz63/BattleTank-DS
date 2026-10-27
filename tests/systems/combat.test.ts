import { describe, expect, it } from 'vitest';
import { GUN } from '../../src/config/balance';
import { createBullet } from '../../src/entities/bullet';
import type { Bullet } from '../../src/entities/bullet';
import { createEnemy } from '../../src/entities/enemy';
import { createPlayer } from '../../src/entities/player';
import {
  buildProjectileTargets,
  createPlayerBullet,
  isWeaponReady,
  reloadProgress,
  updatePlayerWeapon,
  updateProjectiles,
} from '../../src/systems/combat';
import type { ProjectileTarget } from '../../src/systems/combat';
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

    expect(updatePlayerWeapon({
      player,
      fireRequested: true,
      stepSeconds: 1 / 60,
      bullets,
      direction: { x: 0, y: 0, z: 1 },
    })).toBe(true);
    expect(bullets).toHaveLength(1);
    expect(isWeaponReady(player)).toBe(false);
    expect(reloadProgress(player)).toBeLessThan(1);

    expect(updatePlayerWeapon({
      player,
      fireRequested: true,
      stepSeconds: 1 / 60,
      bullets,
      direction: { x: 0, y: 0, z: 1 },
    })).toBe(false);
    expect(bullets).toHaveLength(1);

    player.reloadRemaining = 0;
    expect(updatePlayerWeapon({
      player,
      fireRequested: true,
      stepSeconds: 1 / 60,
      bullets,
      direction: { x: 0, y: 0, z: 1 },
    })).toBe(true);
    expect(bullets).toHaveLength(2);
    expect(isWeaponReady(player)).toBe(false);
  });

  it('genera el proyectil en la boca del cañón y alineado con la mira', () => {
    const player = playerAt();
    const bullet = createPlayerBullet(player, { x: 0, y: 0, z: 1 });
    expect(bullet.position.x).toBeCloseTo(10, 6);
    expect(bullet.position.y).toBeCloseTo(GUN.pivotHeight, 6);
    expect(bullet.position.z).toBeCloseTo(5 + GUN.pivotForward + GUN.barrelLength, 6);
    expect(bullet.direction.z).toBeCloseTo(1, 6);
    expect(bullet.owner).toBe('player');
    expect(bullet.damage).toBe(player.damage);
  });
});

describe('multiplicadores de potencia y objetivos', () => {
  it('aplica daño y recarga temporales al disparar', () => {
    const player = playerAt();
    const bullets: Bullet[] = [];

    expect(
      updatePlayerWeapon({
        player,
        fireRequested: true,
        stepSeconds: 1 / 60,
        bullets,
        direction: { x: 0, y: 0, z: 1 },
        damageMultiplier: 1.75,
        reloadMultiplier: 0.65,
      }),
    ).toBe(true);

    expect(bullets[0]?.damage).toBeCloseTo(player.damage * 1.75, 9);
    expect(player.reloadRemaining).toBeCloseTo(player.reloadSeconds * 0.65, 9);
    expect(player.reloadDuration).toBeCloseTo(player.reloadSeconds * 0.65, 9);
    expect(reloadProgress(player)).toBeCloseTo(0, 9);
  });

  it('crea el proyectil con multiplicador de daño', () => {
    const player = playerAt();
    const bullet = createPlayerBullet(player, { x: 0, y: 0, z: 1 }, 1.75);
    expect(bullet.damage).toBeCloseTo(player.damage * 1.75, 9);
  });

  it('construye los objetivos vivos de cada facción', () => {
    const player = playerAt();
    const enemy = createEnemy('enemigo-1', 'light', { x: 10, z: 20, yaw: 0 });
    const dead = createEnemy('enemigo-2', 'heavy', { x: 10, z: 24, yaw: 0 });
    dead.alive = false;

    const targets = buildProjectileTargets(player, [enemy, dead]);
    expect(targets.map((target) => target.id)).toEqual(['player', 'enemigo-1']);
    expect(targets.map((target) => target.faction)).toEqual(['player', 'enemy']);
    expect(targets.map((target) => target.heading)).toEqual([player.yaw, enemy.yaw]);

    player.alive = false;
    expect(buildProjectileTargets(player, [enemy]).map((target) => target.id)).toEqual([
      'enemigo-1',
    ]);
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
      targets: [
        { id: 'enemigo-1', position: { x: 10, z: 10 }, radius: 1, height: 2.2, faction: 'enemy', heading: 0 },
      ],
    });
    expect(events).toHaveLength(1);
    expect(events[0]?.kind).toBe('target');
    expect(events[0]?.targetId).toBe('enemigo-1');
    expect(bullet.alive).toBe(false);
  });

  it('clasifica la zona del impacto respecto al rumbo del blanco', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    const target: ProjectileTarget = {
      id: 'enemigo-1',
      position: { x: 10, z: 10 },
      radius: 1,
      height: 2.2,
      faction: 'enemy',
      heading: 0,
    };
    const frontBullet = createBullet({
      position: { x: 10, y: 1.25, z: 13 },
      direction: { x: 0, y: 0, z: -1 },
      speed: 80,
      damage: 40,
      owner: 'player',
    });
    const front = updateProjectiles({
      bullets: [frontBullet],
      stepSeconds: 0.05,
      grid,
      targets: [target],
    });
    expect(front[0]?.zone).toBe('front');

    const rearBullet = createBullet({
      position: { x: 10, y: 1.25, z: 7 },
      direction: { x: 0, y: 0, z: 1 },
      speed: 80,
      damage: 40,
      owner: 'player',
    });
    const rear = updateProjectiles({
      bullets: [rearBullet],
      stepSeconds: 0.05,
      grid,
      targets: [target],
    });
    expect(rear[0]?.zone).toBe('rear');
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
        { id: 'aliado', position: { x: 10, z: 10 }, radius: 1, height: 2.2, faction: 'player', heading: 0 },
      ],
    });
    expect(events).toHaveLength(0);
    expect(bullets).toHaveLength(1);
  });

  it('una trayectoria descendente impacta contra el suelo', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    const bullet = createBullet({
      position: { x: 10, y: 0.3, z: 10 },
      direction: { x: 0, y: -1, z: 0 },
      speed: 80,
      damage: 40,
      owner: 'player',
    });
    const bullets = [bullet];
    const events = updateProjectiles({ bullets, stepSeconds: 0.05, grid, targets: [] });
    expect(events[0]?.kind).toBe('ground');
    expect(bullets).toHaveLength(0);
  });

  it('puede pasar por encima de un blanco si el proyectil vuela alto', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    const bullet = createBullet({
      position: { x: 10, y: 2.6, z: 7.5 },
      direction: { x: 0, y: 0, z: 1 },
      speed: 80,
      damage: 40,
      owner: 'player',
    });
    const bullets = [bullet];
    const events = updateProjectiles({
      bullets,
      stepSeconds: 0.05,
      grid,
      targets: [
        { id: 'enemigo-1', position: { x: 10, z: 10 }, radius: 1, height: 2.2, faction: 'enemy', heading: 0 },
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
