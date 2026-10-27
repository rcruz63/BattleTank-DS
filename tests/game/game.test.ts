import { describe, expect, it } from 'vitest';
import { createGame } from '../../src/game/game';
import { createInputState } from '../../src/systems/input';
import { canCircleOccupy } from '../../src/world/collision';
import { planarDistance } from '../../src/world/geometry';

describe('composición del juego', () => {
  it('crea el escenario con la semilla pedida y expone el estado', () => {
    const game = createGame({ seed: 42 });
    expect(game.seed).toBe(42);
    expect(game.arena.grid.seed).toBe(42);
    expect(game.player.health).toBeGreaterThan(0);
    expect(game.player.alive).toBe(true);
    expect(game.enemies).toHaveLength(4);
    expect(game.enemies.every((enemy) => enemy.alive)).toBe(true);
    game.dispose();
  });

  it('dispara, consume el flanco y entra en recarga', () => {
    const input = createInputState();
    const game = createGame({ seed: 42, input });

    input.handleKeyDown('Space');
    game.update(1 / 60);
    expect(game.bullets).toHaveLength(1);
    expect(game.player.reloadRemaining).toBeGreaterThan(0);

    game.update(1 / 60);
    expect(game.bullets).toHaveLength(1);

    game.dispose();
  });

  it('el ratón orienta el cañón dentro del cono', () => {
    const input = createInputState();
    const game = createGame({ seed: 42, input });

    input.setPointer(1, 0);
    input.requestFire();
    game.update(1 / 60);

    expect(game.bullets).toHaveLength(1);
    const bullet = game.bullets[0];
    expect(bullet?.direction.x).toBeCloseTo(Math.sin((15 * Math.PI) / 180), 5);
    expect(bullet?.direction.y).toBeCloseTo(0, 5);

    game.dispose();
  });

  it('el jugador no atraviesa tanques enemigos (BUG-001)', () => {
    const input = createInputState();
    const game = createGame({ seed: 42, input });
    const enemy = game.enemies[0];
    if (!enemy) throw new Error('La arena de prueba debe tener enemigos.');
    const grid = game.arena.grid;
    const origin = game.player.position;
    const distanceToEnemy = 4.5;
    let placed = false;

    for (let quarter = 0; quarter < 4 && !placed; quarter += 1) {
      const yaw = (quarter * Math.PI) / 2;
      const forward = { x: Math.sin(yaw), z: Math.cos(yaw) };
      const target = {
        x: origin.x + forward.x * distanceToEnemy,
        z: origin.z + forward.z * distanceToEnemy,
      };
      const pathClear = [1, 2, 3, 4].every((distance) =>
        canCircleOccupy(
          grid,
          { x: origin.x + forward.x * distance, z: origin.z + forward.z * distance },
          game.player.radius,
        ),
      );
      if (!pathClear || !canCircleOccupy(grid, target, enemy.radius)) continue;
      game.player.yaw = yaw;
      enemy.position = target;
      placed = true;
    }

    expect(placed).toBe(true);

    input.handleKeyDown('KeyW');
    for (let step = 0; step < 120; step += 1) {
      game.update(1 / 60);
      expect(planarDistance(game.player.position, enemy.position)).toBeGreaterThanOrEqual(
        game.player.radius + enemy.radius - 1e-9,
      );
    }

    const forward = { x: Math.sin(game.player.yaw), z: Math.cos(game.player.yaw) };
    const ahead =
      (enemy.position.x - game.player.position.x) * forward.x +
      (enemy.position.z - game.player.position.z) * forward.z;
    expect(ahead).toBeGreaterThan(0);

    game.dispose();
  });

  it('responde a la entrada de avance y giro', () => {
    const input = createInputState();
    const game = createGame({ seed: 42, input });
    const start = { ...game.player.position };

    input.handleKeyDown('KeyW');
    game.update(0.1);
    expect(game.player.position.z).toBeGreaterThan(start.z);
    expect(game.player.position.x).toBeCloseTo(start.x, 6);

    input.handleKeyUp('KeyW');
    input.handleKeyDown('KeyD');
    const yawBefore = game.player.yaw;
    game.update(0.1);
    expect(game.player.yaw).toBeGreaterThan(yawBefore);

    game.dispose();
  });
});
