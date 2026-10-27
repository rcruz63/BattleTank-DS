import { describe, expect, it } from 'vitest';
import { ENTITY_SEPARATION, ENEMY_RADIUS, PLAYER_RADIUS } from '../../src/config/balance';
import { createEnemy } from '../../src/entities/enemy';
import type { EnemyState } from '../../src/entities/enemy';
import { createPlayer } from '../../src/entities/player';
import type { PlayerState } from '../../src/entities/player';
import { updatePlayerMovement } from '../../src/systems/movement';
import { planarDistance } from '../../src/world/geometry';
import { createEmptyGrid, placeObstacle } from '../../src/world/grid';

type Grid = ReturnType<typeof createEmptyGrid>;

const MIN_DISTANCE = PLAYER_RADIUS + ENEMY_RADIUS + ENTITY_SEPARATION;

function spawnAt(x: number, z: number, yaw = 0): PlayerState {
  return createPlayer({ x, z, yaw });
}

interface MoveOptions {
  readonly forward: number;
  readonly turn?: number;
  readonly stepSeconds?: number;
  readonly enemies?: readonly EnemyState[];
}

function move(player: PlayerState, grid: Grid, options: MoveOptions): void {
  const { forward, turn = 0, stepSeconds = 0.5, enemies = [] } = options;
  updatePlayerMovement({ player, command: { forward, turn }, stepSeconds, grid, enemies });
}

function enemyAt(x: number, z: number): EnemyState {
  return createEnemy('enemigo-1', 'light', { x, z, yaw: Math.PI });
}

describe('movimiento del jugador', () => {
  it('avanza en el sentido de la mira y retrocede más despacio', () => {
    const grid = createEmptyGrid(5, 5, 4, 1);
    const player = spawnAt(10, 5);
    move(player, grid, { forward: 1 });
    expect(player.position.z).toBeCloseTo(8, 6);
    expect(player.position.x).toBeCloseTo(10, 6);

    const reverse = spawnAt(10, 5);
    move(reverse, grid, { forward: -1 });
    expect(reverse.position.z).toBeCloseTo(3.5, 6);
  });

  it('gira casco y mira a la vez', () => {
    const grid = createEmptyGrid(5, 5, 4, 1);
    const player = spawnAt(10, 5);
    move(player, grid, { forward: 0, turn: 1, stepSeconds: 1 });
    expect(player.yaw).toBeCloseTo(Math.PI / 2, 6);

    move(player, grid, { forward: 1 });
    expect(player.position.x).toBeCloseTo(13, 6);
    expect(player.position.z).toBeCloseTo(5, 6);
  });

  it('no modifica la posición ni el rumbo sin entrada', () => {
    const grid = createEmptyGrid(5, 5, 4, 1);
    const player = spawnAt(10, 5, 0.7);
    move(player, grid, { forward: 0, turn: 0, stepSeconds: 1 });
    expect(player.position).toEqual({ x: 10, z: 5 });
    expect(player.yaw).toBeCloseTo(0.7, 9);
  });

  it('se detiene ante una cobertura', () => {
    const grid = createEmptyGrid(5, 5, 4, 1);
    placeObstacle(grid, 2, 2, 'ladrillo');
    const player = spawnAt(10, 5);

    for (let step = 0; step < 180; step += 1) {
      move(player, grid, { forward: 1, stepSeconds: 1 / 60 });
    }

    expect(player.position.z).toBeLessThanOrEqual(6.66);
    expect(player.position.z).toBeGreaterThan(6.4);
  });

  it('el giro se normaliza al rango [-PI, PI)', () => {
    const grid = createEmptyGrid(5, 5, 4, 1);
    const player = spawnAt(10, 5);
    move(player, grid, { forward: 0, turn: 1, stepSeconds: 8 });
    expect(player.yaw).toBeGreaterThanOrEqual(-Math.PI);
    expect(player.yaw).toBeLessThan(Math.PI);
  });

  it('no atraviesa a un enemigo a 6 m/s y 60 Hz (BUG-001)', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    const player = spawnAt(10, 10);
    const enemy = enemyAt(10, 20);

    for (let step = 0; step < 300; step += 1) {
      move(player, grid, { forward: 1, stepSeconds: 1 / 60, enemies: [enemy] });
      expect(planarDistance(player.position, enemy.position)).toBeGreaterThanOrEqual(
        MIN_DISTANCE - 1e-9,
      );
    }

    expect(player.position.z).toBeLessThan(enemy.position.z - ENEMY_RADIUS);
    // La cámara va en el centro del tanque: nunca puede quedar dentro del modelo enemigo.
    expect(planarDistance(player.position, enemy.position)).toBeGreaterThan(enemy.radius + 1);
    expect(planarDistance(player.position, enemy.position)).toBeLessThanOrEqual(
      MIN_DISTANCE + 0.25,
    );
  });

  it('tampoco atraviesa al retroceder', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    const player = spawnAt(10, 10);
    const enemy = enemyAt(10, 4);

    for (let step = 0; step < 300; step += 1) {
      move(player, grid, { forward: -1, stepSeconds: 1 / 60, enemies: [enemy] });
      expect(planarDistance(player.position, enemy.position)).toBeGreaterThanOrEqual(
        MIN_DISTANCE - 1e-9,
      );
    }

    expect(player.position.z).toBeGreaterThan(enemy.position.z);
  });

  it('no bloquea el paso de un enemigo destruido', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    const player = spawnAt(10, 10);
    const enemy = enemyAt(10, 20);
    enemy.alive = false;

    for (let step = 0; step < 120; step += 1) {
      move(player, grid, { forward: 1, stepSeconds: 1 / 60, enemies: [enemy] });
    }

    expect(player.position.z).toBeGreaterThan(enemy.position.z + 2);
  });
});
