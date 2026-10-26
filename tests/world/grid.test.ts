import { describe, expect, it } from 'vitest';
import {
  cellCenter,
  cellIndex,
  collectReachableCells,
  createEmptyGrid,
  damageObstacle,
  getObstacle,
  isBlocked,
  isInside,
  placeObstacle,
  worldToCell,
} from '../../src/world/grid';
import { MATERIALS } from '../../src/config/materials';

function gridWithWall(): ReturnType<typeof createEmptyGrid> {
  const grid = createEmptyGrid(5, 5, 4, 1);
  placeObstacle(grid, 2, 0, 'ladrillo');
  placeObstacle(grid, 2, 1, 'ladrillo');
  placeObstacle(grid, 2, 2, 'ladrillo');
  placeObstacle(grid, 2, 3, 'ladrillo');
  placeObstacle(grid, 2, 4, 'ladrillo');
  return grid;
}

describe('rejilla del mundo', () => {
  it('valida tamaños mínimos', () => {
    expect(() => createEmptyGrid(4, 5, 4, 1)).toThrow();
    expect(() => createEmptyGrid(5, 5, 0, 1)).toThrow();
  });

  it('conoce los límites y las celdas', () => {
    const grid = createEmptyGrid(5, 5, 4, 1);
    expect(isInside(grid, 0, 0)).toBe(true);
    expect(isInside(grid, 4, 4)).toBe(true);
    expect(isInside(grid, 5, 0)).toBe(false);
    expect(isInside(grid, -1, 0)).toBe(false);
    expect(cellIndex(grid, 2, 3)).toBe(17);
  });

  it('bloquea solo con obstáculos con vida', () => {
    const grid = gridWithWall();
    expect(isBlocked(grid, 2, 1)).toBe(true);
    expect(isBlocked(grid, 3, 1)).toBe(false);
    expect(getObstacle(grid, 9, 9)).toBeNull();
  });

  it('aplica daño y destruye según el material', () => {
    const grid = gridWithWall();
    expect(damageObstacle(grid, 2, 1, 40)).toBe(false);
    expect(damageObstacle(grid, 2, 1, 50)).toBe(true);
    expect(isBlocked(grid, 2, 1)).toBe(false);
    expect(getObstacle(grid, 2, 1)?.health).toBe(0);
    expect(damageObstacle(grid, 2, 1, 99)).toBe(false);
  });

  it('no daña coberturas indestructibles', () => {
    const grid = createEmptyGrid(5, 5, 4, 1);
    placeObstacle(grid, 1, 1, 'hormigon');
    expect(damageObstacle(grid, 1, 1, 9999)).toBe(false);
    expect(getObstacle(grid, 1, 1)?.health).toBe(MATERIALS.hormigon.maxHealth);
  });

  it('convierte entre celdas y mundo', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    expect(cellCenter(grid, 0, 0)).toEqual({ x: 2, z: 2 });
    expect(cellCenter(grid, 2, 3)).toEqual({ x: 10, z: 14 });
    expect(worldToCell(grid, 9.9, 13.5)).toEqual({ x: 2, z: 3 });
  });

  it('calcula las celdas alcanzables sin atravesar muros', () => {
    const grid = gridWithWall();
    const reachable = collectReachableCells(grid, { x: 1, z: 2 });
    expect(reachable.has(cellIndex(grid, 1, 2))).toBe(true);
    expect(reachable.has(cellIndex(grid, 0, 2))).toBe(true);
    expect(reachable.has(cellIndex(grid, 3, 2))).toBe(false);
    expect(reachable.size).toBe(10);
  });

  it('devuelve vacío si el origen está bloqueado o fuera', () => {
    const grid = gridWithWall();
    expect(collectReachableCells(grid, { x: 2, z: 2 }).size).toBe(0);
    expect(collectReachableCells(grid, { x: -1, z: 0 }).size).toBe(0);
  });
});
