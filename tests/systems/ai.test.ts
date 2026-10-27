import { describe, expect, it } from 'vitest';
import { createRng } from '../../src/core/rng';
import { createEnemy } from '../../src/entities/enemy';
import type { Bullet } from '../../src/entities/bullet';
import { createPlayer } from '../../src/entities/player';
import { alertEnemiesNear, updateEnemies } from '../../src/systems/ai';
import { minEntityDistance } from '../../src/world/entityCollision';
import { createEmptyGrid, placeObstacle } from '../../src/world/grid';
import { planarDistance } from '../../src/world/geometry';

function makePlayer(): ReturnType<typeof createPlayer> {
  return createPlayer({ x: 10, z: 10, yaw: 0 });
}

function contextFor(
  grid: ReturnType<typeof createEmptyGrid>,
  player: ReturnType<typeof createPlayer>,
  bullets: Bullet[],
) {
  return { grid, player, stepSeconds: 0.1, rng: createRng(7), bullets };
}

describe('IA de enemigos', () => {
  it('dispara cuando ve al jugador, está encarado y ha recargado', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    const player = makePlayer();
    const enemy = createEnemy('enemigo-1', 'light', { x: 10, z: 26, yaw: Math.PI });
    enemy.alerted = true;
    enemy.reactionTimer = 0;

    const bullets: Bullet[] = [];
    updateEnemies([enemy], contextFor(grid, player, bullets));

    expect(bullets).toHaveLength(1);
    expect(bullets[0]?.owner).toBe('enemy');
    expect(enemy.aiMode).toBe('attack');
    expect(enemy.reloadRemaining).toBeGreaterThan(0);
  });

  it('no dispara a través de una cobertura intacta', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    placeObstacle(grid, 2, 4, 'hormigon');
    const player = makePlayer();
    const enemy = createEnemy('enemigo-2', 'light', { x: 10, z: 26, yaw: Math.PI });

    const bullets: Bullet[] = [];
    updateEnemies([enemy], contextFor(grid, player, bullets));

    expect(enemy.alerted).toBe(false);
    expect(enemy.aiMode).toBe('idle');
    expect(bullets).toHaveLength(0);
  });

  it('avanza con A* cuando está alertado pero no ve al jugador', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    placeObstacle(grid, 2, 4, 'hormigon');
    const player = makePlayer();
    const enemy = createEnemy('enemigo-3', 'light', { x: 10, z: 26, yaw: Math.PI });
    enemy.alerted = true;

    const bullets: Bullet[] = [];
    const context = contextFor(grid, player, bullets);
    const startDistance = planarDistance(enemy.position, player.position);
    for (let step = 0; step < 30; step += 1) {
      updateEnemies([enemy], context);
    }

    expect(enemy.aiMode).toBe('advance');
    expect(enemy.path).not.toBeNull();
    expect(planarDistance(enemy.position, player.position)).toBeLessThan(startDistance);
    expect(bullets).toHaveLength(0);
  });

  it('se queda quieto y no dispara si el jugador está destruido', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    const player = makePlayer();
    player.alive = false;
    const enemy = createEnemy('enemigo-4', 'heavy', { x: 10, z: 26, yaw: Math.PI });
    enemy.alerted = true;

    const bullets: Bullet[] = [];
    updateEnemies([enemy], contextFor(grid, player, bullets));

    expect(enemy.aiMode).toBe('idle');
    expect(bullets).toHaveLength(0);
  });

  it('el avance de la IA respeta a los demás tanques', () => {
    const grid = createEmptyGrid(20, 20, 4, 1);
    const player = createPlayer({ x: 10, z: 76, yaw: Math.PI });
    const blocker = createEnemy('bloqueador', 'light', { x: 10, z: 40, yaw: Math.PI });
    const mover = createEnemy('mover', 'light', { x: 10, z: 30, yaw: 0 });
    // El bloqueador se queda quieto delante de la ruta del que avanza: la colisión debe frenarlo.
    Object.assign(blocker, { speed: 0 });

    const bullets: Bullet[] = [];
    const context = contextFor(grid, player, bullets);
    const minimum = minEntityDistance(mover.radius, blocker.radius);

    for (let step = 0; step < 180; step += 1) {
      updateEnemies([mover, blocker], context);
      expect(planarDistance(mover.position, blocker.position)).toBeGreaterThanOrEqual(
        minimum - 1e-9,
      );
    }

    expect(mover.position.z).toBeGreaterThan(30);
    expect(mover.position.z).toBeLessThan(blocker.position.z);
  });

  it('no dispara si el jugador está fuera del arco frontal de ±15°', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    const player = makePlayer();
    const enemy = createEnemy('enemigo-5', 'light', { x: 10, z: 26, yaw: Math.PI / 2 });
    enemy.alerted = true;
    enemy.reactionTimer = 0;

    const bullets: Bullet[] = [];
    updateEnemies([enemy], contextFor(grid, player, bullets));

    expect(enemy.aiMode).toBe('attack');
    expect(bullets).toHaveLength(0);
  });

  it('no dispara a un jugador que tiene por la espalda', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    const player = makePlayer();
    const enemy = createEnemy('enemigo-6', 'light', { x: 10, z: 26, yaw: 0 });
    enemy.alerted = true;
    enemy.reactionTimer = 0;

    const bullets: Bullet[] = [];
    updateEnemies([enemy], contextFor(grid, player, bullets));

    expect(bullets).toHaveLength(0);
  });

  it('dispara cuando el jugador entra en su arco frontal', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    const player = makePlayer();
    const enemy = createEnemy('enemigo-7', 'light', {
      x: 10,
      z: 26,
      yaw: Math.PI - 0.25,
    });
    enemy.alerted = true;
    enemy.reactionTimer = 0;

    const bullets: Bullet[] = [];
    updateEnemies([enemy], contextFor(grid, player, bullets));

    expect(bullets).toHaveLength(1);
  });

  it('mientras recarga mantiene el rumbo y no corrige el apuntado', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    const player = makePlayer();
    const enemy = createEnemy('enemigo-8', 'light', { x: 10, z: 26, yaw: Math.PI / 2 });
    enemy.alerted = true;
    enemy.reactionTimer = 0;
    enemy.reloadRemaining = 2;

    const bullets: Bullet[] = [];
    const context = contextFor(grid, player, bullets);
    updateEnemies([enemy], context);

    expect(enemy.yaw).toBeCloseTo(Math.PI / 2, 6);
    expect(enemy.reloadRemaining).toBeCloseTo(1.9, 6);
    expect(bullets).toHaveLength(0);

    enemy.reloadRemaining = 0;
    updateEnemies([enemy], context);
    expect(enemy.yaw).toBeGreaterThan(Math.PI / 2 + 0.1);
  });

  it('la ventana de recarga permite ganar el flanco', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    const player = makePlayer();
    const enemy = createEnemy('enemigo-9', 'light', { x: 10, z: 26, yaw: Math.PI });
    enemy.alerted = true;
    enemy.reactionTimer = 0;
    enemy.reloadRemaining = enemy.reloadSeconds;

    const bullets: Bullet[] = [];
    const context = contextFor(grid, player, bullets);
    const heading = enemy.yaw;
    player.position = { x: 26, z: 26 };

    for (let step = 0; step < 10; step += 1) updateEnemies([enemy], context);

    expect(enemy.yaw).toBeCloseTo(heading, 6);
    expect(enemy.reloadRemaining).toBeGreaterThan(0);
    expect(bullets).toHaveLength(0);
  });

  it('el estampido de un disparo alerta a los enemigos cercanos', () => {
    const near = createEnemy('cerca', 'light', { x: 10, z: 30, yaw: 0 });
    const far = createEnemy('lejos', 'light', { x: 10, z: 120, yaw: 0 });
    alertEnemiesNear([near, far], { x: 10, z: 10 }, 60);
    expect(near.alerted).toBe(true);
    expect(far.alerted).toBe(false);
  });
});
