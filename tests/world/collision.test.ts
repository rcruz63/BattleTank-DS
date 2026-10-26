import { describe, expect, it } from 'vitest';
import { canCircleOccupy, moveCircle } from '../../src/world/collision';
import { createEmptyGrid, placeObstacle } from '../../src/world/grid';

function gridWithWall(): ReturnType<typeof createEmptyGrid> {
  const grid = createEmptyGrid(5, 5, 4, 1);
  placeObstacle(grid, 2, 2, 'ladrillo');
  return grid;
}

describe('colisión del tanque', () => {
  it('deja ocupar celdas libres y rechaza muros y exteriores', () => {
    const grid = gridWithWall();
    expect(canCircleOccupy(grid, { x: 10, z: 5 }, 1)).toBe(true);
    expect(canCircleOccupy(grid, { x: 10, z: 7.5 }, 1)).toBe(false);
    expect(canCircleOccupy(grid, { x: 10, z: 10 }, 1)).toBe(false);
    expect(canCircleOccupy(grid, { x: 0.5, z: 10 }, 1.35)).toBe(false);
  });

  it('avanza en campo libre', () => {
    const grid = createEmptyGrid(5, 5, 4, 1);
    const result = moveCircle(grid, { x: 2, z: 2 }, { x: 1, z: 1 }, 0.5);
    expect(result.collided).toBe(false);
    expect(result.position.x).toBeCloseTo(3, 6);
    expect(result.position.z).toBeCloseTo(3, 6);
  });

  it('se detiene al chocar con una cobertura', () => {
    const grid = gridWithWall();
    const result = moveCircle(grid, { x: 10, z: 5 }, { x: 0, z: 5 }, 1);
    expect(result.collided).toBe(true);
    expect(result.position.x).toBeCloseTo(10, 6);
    expect(result.position.z).toBeLessThanOrEqual(7.01);
    expect(result.position.z).toBeGreaterThan(6.5);
  });

  it('desliza por el eje libre al chocar en diagonal', () => {
    const grid = gridWithWall();
    placeObstacle(grid, 1, 2, 'ladrillo');
    placeObstacle(grid, 3, 2, 'ladrillo');
    const result = moveCircle(grid, { x: 10, z: 5 }, { x: 4, z: 5 }, 1);
    expect(result.collided).toBe(true);
    expect(result.position.x).toBeGreaterThan(13.5);
    expect(result.position.z).toBeLessThanOrEqual(7.01);
  });

  it('no atraviesa la cobertura con un desplazamiento grande', () => {
    const grid = gridWithWall();
    const result = moveCircle(grid, { x: 10, z: 5 }, { x: 0, z: 20 }, 1);
    expect(result.collided).toBe(true);
    expect(result.position.z).toBeLessThanOrEqual(7.01);
  });
});
