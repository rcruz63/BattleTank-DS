import { describe, expect, it } from 'vitest';
import { createEnemy } from '../../src/entities/enemy';
import { createPickups } from '../../src/entities/pickup';
import { createPlayer } from '../../src/entities/player';
import { buildRadarModel, RADAR_RANGE_METERS } from '../../src/ui/radar';
import { createEmptyGrid, placeObstacle } from '../../src/world/grid';

const grid = createEmptyGrid(20, 20, 4, 1);

function playerAt(yaw = 0): ReturnType<typeof createPlayer> {
  return createPlayer({ x: 40, z: 40, yaw });
}

describe('modelo del radar', () => {
  it('coloca delante arriba y a la derecha a la derecha', () => {
    const player = playerAt();
    const ahead = createEnemy('ahead', 'light', { x: 40, z: 60, yaw: 0 });
    const right = createEnemy('right', 'light', { x: 60, z: 40, yaw: 0 });

    const model = buildRadarModel(player, [ahead, right], [], grid);
    expect(model.blips).toHaveLength(2);
    const front = model.blips.find((blip) => blip.x === 0);
    const side = model.blips.find((blip) => blip.y === 0);
    expect(front?.y).toBeCloseTo(20 / RADAR_RANGE_METERS, 9);
    expect(side?.x).toBeCloseTo(20 / RADAR_RANGE_METERS, 9);
  });

  it('rota con el rumbo del tanque', () => {
    const player = playerAt(Math.PI / 2);
    const east = createEnemy('east', 'light', { x: 60, z: 40, yaw: 0 });
    const model = buildRadarModel(player, [east], [], grid);
    expect(model.blips[0]?.y).toBeCloseTo(20 / RADAR_RANGE_METERS, 9);
    expect(model.blips[0]?.x).toBeCloseTo(0, 9);
  });

  it('descarta enemigos muertos, pickups recogidos y contactos fuera de alcance', () => {
    const player = playerAt();
    const dead = createEnemy('dead', 'light', { x: 50, z: 40, yaw: 0 });
    dead.alive = false;
    const far = createEnemy('far', 'light', { x: 40, z: 200, yaw: 0 });
    const pickups = createPickups([
      { x: 45, z: 40 },
      { x: 40, z: 45 },
    ]);
    const collected = pickups[0];
    if (!collected) throw new Error('Debe haber pickups.');
    collected.collected = true;

    const model = buildRadarModel(player, [dead, far], pickups, grid);
    expect(model.blips.filter((blip) => blip.kind === 'enemy')).toHaveLength(0);
    expect(model.blips.filter((blip) => blip.kind === 'pickup')).toHaveLength(1);
  });

  it('incluye las coberturas dentro de alcance como trazos de radar', () => {
    const wallGrid = createEmptyGrid(20, 20, 4, 1);
    placeObstacle(wallGrid, 10, 10, 'hormigon');
    const model = buildRadarModel(playerAt(), [], [], wallGrid);
    expect(model.walls).toHaveLength(1);
    // La celda (10,10) tiene centro en (42,42), a 2 m en cada eje del jugador (40,40).
    expect(model.walls[0]?.x).toBeCloseTo(2 / RADAR_RANGE_METERS, 9);
    expect(model.walls[0]?.y).toBeCloseTo(2 / RADAR_RANGE_METERS, 9);
  });
});
