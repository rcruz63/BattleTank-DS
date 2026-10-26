import { describe, expect, it } from 'vitest';
import { createRng } from '../../src/core/rng';
import { createEnemy } from '../../src/entities/enemy';
import type { Bullet } from '../../src/entities/bullet';
import { createPlayer } from '../../src/entities/player';
import { alertEnemiesNear, updateEnemies } from '../../src/systems/ai';
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

  it('el estampido de un disparo alerta a los enemigos cercanos', () => {
    const near = createEnemy('cerca', 'light', { x: 10, z: 30, yaw: 0 });
    const far = createEnemy('lejos', 'light', { x: 10, z: 120, yaw: 0 });
    alertEnemiesNear([near, far], { x: 10, z: 10 }, 60);
    expect(near.alerted).toBe(true);
    expect(far.alerted).toBe(false);
  });
});
