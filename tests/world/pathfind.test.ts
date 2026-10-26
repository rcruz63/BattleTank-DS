import { describe, expect, it } from 'vitest';
import { createEmptyGrid, placeObstacle } from '../../src/world/grid';
import { findPath } from '../../src/world/pathfind';

describe('A* de rejilla', () => {
  it('encuentra la ruta recta y devuelve celdas contiguas', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    const path = findPath(grid, { x: 1, z: 1 }, { x: 4, z: 1 });
    expect(path).not.toBeNull();
    expect(path).toHaveLength(4);
    expect(path?.[0]).toEqual({ x: 1, z: 1 });
    expect(path?.at(-1)).toEqual({ x: 4, z: 1 });
    expect(path?.every((cell) => Math.abs(cell.z - 1) === 0)).toBe(true);
  });

  it('rodea una cobertura intermedia', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    placeObstacle(grid, 3, 1, 'hormigon');
    const path = findPath(grid, { x: 1, z: 1 }, { x: 5, z: 1 });
    expect(path).not.toBeNull();
    expect(path?.some((cell) => cell.x === 3 && cell.z === 1)).toBe(false);
    expect(path && path.length > 5).toBe(true);
  });

  it('devuelve null si el destino está bloqueado o encerrado', () => {
    const grid = createEmptyGrid(10, 10, 4, 1);
    placeObstacle(grid, 5, 5, 'hormigon');
    expect(findPath(grid, { x: 1, z: 1 }, { x: 5, z: 5 })).toBeNull();

    const enclosed = createEmptyGrid(10, 10, 4, 1);
    const ring = [3, 4, 5].flatMap((z) => [3, 4, 5].map((x) => ({ x, z })));
    ring
      .filter((cell) => !(cell.x === 4 && cell.z === 4))
      .forEach((cell) => placeObstacle(enclosed, cell.x, cell.z, 'hormigon'));
    expect(findPath(enclosed, { x: 1, z: 1 }, { x: 4, z: 4 })).toBeNull();
  });

  it('con origen igual a destino devuelve una ruta de una celda', () => {
    const grid = createEmptyGrid(5, 5, 4, 1);
    const path = findPath(grid, { x: 2, z: 2 }, { x: 2, z: 2 });
    expect(path).toEqual([{ x: 2, z: 2 }]);
  });

  it('rechaza orígenes bloqueados o fuera del mapa', () => {
    const grid = createEmptyGrid(5, 5, 4, 1);
    placeObstacle(grid, 2, 2, 'hormigon');
    expect(findPath(grid, { x: 2, z: 2 }, { x: 1, z: 1 })).toBeNull();
    expect(findPath(grid, { x: -1, z: 1 }, { x: 1, z: 1 })).toBeNull();
  });
});
