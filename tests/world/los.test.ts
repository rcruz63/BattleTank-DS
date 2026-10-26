import { describe, expect, it } from 'vitest';
import { damageObstacle, createEmptyGrid, placeObstacle } from '../../src/world/grid';
import { hasLineOfSight } from '../../src/world/los';

describe('línea de visión', () => {
  it('ve en línea recta por celdas libres', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    expect(hasLineOfSight(grid, { x: 2, z: 2 }, { x: 38, z: 2 })).toBe(true);
  });

  it('una cobertura intacta bloquea la visión', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    placeObstacle(grid, 5, 0, 'hormigon');
    expect(hasLineOfSight(grid, { x: 2, z: 2 }, { x: 38, z: 2 })).toBe(false);
  });

  it('una cobertura fuera de la línea no bloquea', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    placeObstacle(grid, 5, 5, 'hormigon');
    expect(hasLineOfSight(grid, { x: 2, z: 2 }, { x: 38, z: 2 })).toBe(true);
  });

  it('los escombros no bloquean la visión', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    placeObstacle(grid, 5, 0, 'ladrillo');
    damageObstacle(grid, 5, 0, 999);
    expect(hasLineOfSight(grid, { x: 2, z: 2 }, { x: 38, z: 2 })).toBe(true);
  });

  it('fuera del escenario no hay visión', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    expect(hasLineOfSight(grid, { x: 2, z: 2 }, { x: 100, z: 2 })).toBe(false);
  });
});
