import { describe, expect, it } from 'vitest';
import { ARENA_DEFAULTS } from '../../src/config/balance';
import { MATERIALS } from '../../src/config/materials';
import { generateArena } from '../../src/world/generate';
import { collectReachableCells, isBlocked, worldToCell } from '../../src/world/grid';
import type { GeneratedArena, WorldGrid, WorldPoint } from '../../src/world/types';

const params = { seed: 42, ...ARENA_DEFAULTS };

function reachableIndices(arena: GeneratedArena): Set<number> {
  const playerCell = worldToCell(arena.grid, arena.playerSpawn.x, arena.playerSpawn.z);
  return collectReachableCells(arena.grid, playerCell);
}

function isOnFreeReachableCell(
  grid: WorldGrid,
  reachable: Set<number>,
  point: WorldPoint,
): boolean {
  const cell = worldToCell(grid, point.x, point.z);
  return !isBlocked(grid, cell.x, cell.z) && reachable.has(cell.z * grid.width + cell.x);
}

function countMaterials(grid: WorldGrid): Set<string> {
  const found = new Set<string>();
  for (const obstacle of grid.obstacles) {
    if (obstacle && obstacle.health > 0) found.add(obstacle.material);
  }
  return found;
}

describe('generación de escenarios', () => {
  it('es determinista para la misma semilla', () => {
    const first = generateArena(params);
    const second = generateArena(params);
    expect(first.playerSpawn).toEqual(second.playerSpawn);
    expect(first.enemySpawns).toEqual(second.enemySpawns);
    expect(first.pickupSpawns).toEqual(second.pickupSpawns);
    expect(first.grid.obstacles).toEqual(second.grid.obstacles);
  });

  it('cambia con otra semilla', () => {
    const first = generateArena(params);
    const second = generateArena({ ...params, seed: 43 });
    expect(first.grid.obstacles).not.toEqual(second.grid.obstacles);
  });

  it('cierra el escenario con un borde indestructible', () => {
    const { grid } = generateArena(params);
    for (let x = 0; x < grid.width; x += 1) {
      expect(isBlocked(grid, x, 0)).toBe(true);
      expect(isBlocked(grid, x, grid.height - 1)).toBe(true);
    }
    for (let z = 0; z < grid.height; z += 1) {
      expect(isBlocked(grid, 0, z)).toBe(true);
      expect(isBlocked(grid, grid.width - 1, z)).toBe(true);
    }
  });

  it('coloca al jugador, enemigos y pickups en celdas libres alcanzables', () => {
    const arena = generateArena(params);
    const reachable = reachableIndices(arena);
    expect(isOnFreeReachableCell(arena.grid, reachable, arena.playerSpawn)).toBe(true);
    expect(arena.enemySpawns).toHaveLength(params.enemyCount);
    expect(arena.pickupSpawns).toHaveLength(params.pickupCount);
    for (const enemy of arena.enemySpawns) {
      expect(isOnFreeReachableCell(arena.grid, reachable, enemy)).toBe(true);
    }
    for (const pickup of arena.pickupSpawns) {
      expect(isOnFreeReachableCell(arena.grid, reachable, pickup)).toBe(true);
    }
  });

  it('respeta las distancias mínimas de aparición', () => {
    const arena = generateArena(params);
    const distance = (a: WorldPoint, b: WorldPoint) => Math.hypot(a.x - b.x, a.z - b.z);
    for (const enemy of arena.enemySpawns) {
      expect(distance(enemy, arena.playerSpawn)).toBeGreaterThanOrEqual(20);
    }
    for (const pickup of arena.pickupSpawns) {
      expect(distance(pickup, arena.playerSpawn)).toBeGreaterThanOrEqual(8);
    }
  });

  it('mezcla coberturas destructibles e indestructibles', () => {
    const materials = countMaterials(generateArena(params).grid);
    const destructibles = [...materials].filter((id) => MATERIALS[id as 'madera'].destructible);
    expect(destructibles.length).toBeGreaterThan(0);
    expect(materials.has('hormigon')).toBe(true);
  });

  it('todas las coberturas tienen la vida de su material', () => {
    const { grid } = generateArena(params);
    for (const obstacle of grid.obstacles) {
      if (!obstacle) continue;
      expect(obstacle.health).toBe(MATERIALS[obstacle.material].maxHealth);
    }
  });
});
