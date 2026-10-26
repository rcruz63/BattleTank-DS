import { describe, expect, it } from 'vitest';
import { createPlayer } from '../../src/entities/player';
import { updatePlayerMovement } from '../../src/systems/movement';
import { createEmptyGrid, placeObstacle } from '../../src/world/grid';

function spawnAt(x: number, z: number, yaw = 0): ReturnType<typeof createPlayer> {
  return createPlayer({ x, z, yaw });
}

describe('movimiento del jugador', () => {
  it('avanza en el sentido de la mira y retrocede más despacio', () => {
    const grid = createEmptyGrid(5, 5, 4, 1);
    const player = spawnAt(10, 5);
    updatePlayerMovement(player, { forward: 1, turn: 0 }, 0.5, grid);
    expect(player.position.z).toBeCloseTo(8, 6);
    expect(player.position.x).toBeCloseTo(10, 6);

    const reverse = spawnAt(10, 5);
    updatePlayerMovement(reverse, { forward: -1, turn: 0 }, 0.5, grid);
    expect(reverse.position.z).toBeCloseTo(3.5, 6);
  });

  it('gira casco y mira a la vez', () => {
    const grid = createEmptyGrid(5, 5, 4, 1);
    const player = spawnAt(10, 5);
    updatePlayerMovement(player, { forward: 0, turn: 1 }, 1, grid);
    expect(player.yaw).toBeCloseTo(Math.PI / 2, 6);

    updatePlayerMovement(player, { forward: 1, turn: 0 }, 0.5, grid);
    expect(player.position.x).toBeCloseTo(13, 6);
    expect(player.position.z).toBeCloseTo(5, 6);
  });

  it('no modifica la posición ni el rumbo sin entrada', () => {
    const grid = createEmptyGrid(5, 5, 4, 1);
    const player = spawnAt(10, 5, 0.7);
    updatePlayerMovement(player, { forward: 0, turn: 0 }, 1, grid);
    expect(player.position).toEqual({ x: 10, z: 5 });
    expect(player.yaw).toBeCloseTo(0.7, 9);
  });

  it('se detiene ante una cobertura', () => {
    const grid = createEmptyGrid(5, 5, 4, 1);
    placeObstacle(grid, 2, 2, 'ladrillo');
    const player = spawnAt(10, 5);

    for (let step = 0; step < 180; step += 1) {
      updatePlayerMovement(player, { forward: 1, turn: 0 }, 1 / 60, grid);
    }

    expect(player.position.z).toBeLessThanOrEqual(6.66);
    expect(player.position.z).toBeGreaterThan(6.4);
  });

  it('el giro se normaliza al rango [-PI, PI)', () => {
    const grid = createEmptyGrid(5, 5, 4, 1);
    const player = spawnAt(10, 5);
    updatePlayerMovement(player, { forward: 0, turn: 1 }, 8, grid);
    expect(player.yaw).toBeGreaterThanOrEqual(-Math.PI);
    expect(player.yaw).toBeLessThan(Math.PI);
  });
});
