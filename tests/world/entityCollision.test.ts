import { describe, expect, it } from 'vitest';
import { ENTITY_SEPARATION, ENEMY_RADIUS, PLAYER_RADIUS } from '../../src/config/balance';
import {
  entityClearance,
  minEntityDistance,
  moveCircleAroundEntities,
} from '../../src/world/entityCollision';
import { planarDistance } from '../../src/world/geometry';
import { createEmptyGrid } from '../../src/world/grid';

const MIN_DISTANCE = PLAYER_RADIUS + ENEMY_RADIUS + ENTITY_SEPARATION;

function blockerAt(x: number, z: number): { position: { x: number; z: number }; radius: number } {
  return { position: { x, z }, radius: ENEMY_RADIUS };
}

describe('colisión entre tanques', () => {
  it('la separación mínima suma los radios y el margen de seguridad', () => {
    expect(ENTITY_SEPARATION).toBeGreaterThan(0);
    expect(minEntityDistance(PLAYER_RADIUS, ENEMY_RADIUS)).toBeCloseTo(MIN_DISTANCE, 9);
  });

  it('mide la holgura respecto al bloqueador más cercano', () => {
    const blockers = [blockerAt(10, 10), blockerAt(10, 30)];
    expect(entityClearance({ x: 10, z: 10 }, PLAYER_RADIUS, blockers)).toBeLessThan(0);
    expect(entityClearance({ x: 10, z: 14 }, PLAYER_RADIUS, blockers)).toBeCloseTo(
      4 - MIN_DISTANCE,
      9,
    );
    expect(entityClearance({ x: 10, z: 50 }, PLAYER_RADIUS, [])).toBe(Number.POSITIVE_INFINITY);
  });

  it('se detiene sin invadir a otro tanque a 6 m/s y 60 Hz', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    const blocker = blockerAt(10, 20);
    let position = { x: 10, z: 10 };

    for (let step = 0; step < 120; step += 1) {
      position = moveCircleAroundEntities({
        grid,
        position,
        delta: { x: 0, z: 6 / 60 },
        radius: PLAYER_RADIUS,
        blockers: [blocker],
      }).position;
      expect(planarDistance(position, blocker.position)).toBeGreaterThanOrEqual(
        MIN_DISTANCE - 1e-9,
      );
    }

    expect(position.z).toBeLessThan(blocker.position.z - ENEMY_RADIUS);
    const gap = planarDistance(position, blocker.position);
    expect(gap).toBeGreaterThanOrEqual(MIN_DISTANCE - 1e-9);
    expect(gap).toBeLessThanOrEqual(MIN_DISTANCE + 0.25);
  });

  it('desliza por el eje libre al rodear un tanque', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    const blocker = blockerAt(10, 20);
    let position = { x: 6.5, z: 20 };

    for (let step = 0; step < 30; step += 1) {
      position = moveCircleAroundEntities({
        grid,
        position,
        delta: { x: 0.1, z: 0.1 },
        radius: PLAYER_RADIUS,
        blockers: [blocker],
      }).position;
      expect(planarDistance(position, blocker.position)).toBeGreaterThanOrEqual(
        MIN_DISTANCE - 1e-9,
      );
    }

    expect(position.z).toBeGreaterThan(21.5);
  });

  it('puede escapar si empieza solapado, pero no hundirse más', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    const blocker = blockerAt(10, 20);
    const overlapped = { x: 10, z: 20.5 };

    const escaping = moveCircleAroundEntities({
      grid,
      position: overlapped,
      delta: { x: 0, z: 0.1 },
      radius: PLAYER_RADIUS,
      blockers: [blocker],
    });
    expect(escaping.position.z).toBeCloseTo(20.6, 9);
    expect(escaping.collided).toBe(false);

    const sinking = moveCircleAroundEntities({
      grid,
      position: overlapped,
      delta: { x: 0, z: -0.1 },
      radius: PLAYER_RADIUS,
      blockers: [blocker],
    });
    expect(sinking.position).toEqual(overlapped);
    expect(sinking.collided).toBe(true);
  });
});
