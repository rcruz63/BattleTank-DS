import { describe, expect, it } from 'vitest';
import { createEnemy } from '../../src/entities/enemy';
import { projectWorldFaces } from '../../src/render/faces';
import { tankWorldFaces } from '../../src/render/models';
import type { PerspectiveCamera, ScreenPoint, Viewport } from '../../src/render/types';
import { buildWallWorldFaces } from '../../src/render/worldFaces';
import { createEmptyGrid, damageObstacle, placeObstacle } from '../../src/world/grid';

const viewport: Viewport = { width: 1280, height: 720 };
const crosshair: ScreenPoint = { x: 640, y: 360 };

function cameraAt(): PerspectiveCamera {
  return {
    position: { x: 10, y: 1.7, z: 5 },
    yaw: 0,
    pitch: 0,
    fovRadians: Math.PI / 2,
    near: 0.3,
  };
}

function pointInPolygon(point: ScreenPoint, polygon: readonly ScreenPoint[]): boolean {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const a = polygon[index] as ScreenPoint;
    const b = polygon[previous] as ScreenPoint;
    const intersects =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function scene() {
  const grid = createEmptyGrid(6, 6, 4, 1);
  placeObstacle(grid, 2, 2, 'ladrillo');
  const camera = cameraAt();
  const enemy = createEnemy('enemigo-1', 'light', { x: 10, z: 18, yaw: Math.PI });
  return { grid, camera, enemy };
}

describe('oclusión de enemigos por coberturas', () => {
  it('la cobertura intacta tapa al enemigo en el centro de la mira', () => {
    const { grid, camera, enemy } = scene();
    const walls = projectWorldFaces(buildWallWorldFaces(grid, camera, 100), {
      camera,
      viewport,
    });
    const tanks = projectWorldFaces(tankWorldFaces(enemy), { camera, viewport });

    expect(tanks.length).toBeGreaterThan(0);
    expect(walls.some((face) => pointInPolygon(crosshair, face.points))).toBe(true);
  });

  it('al destruir la cobertura, la línea de visión queda despejada', () => {
    const { grid, camera, enemy } = scene();
    damageObstacle(grid, 2, 2, 999);
    const walls = projectWorldFaces(buildWallWorldFaces(grid, camera, 100), {
      camera,
      viewport,
    });
    const tanks = projectWorldFaces(tankWorldFaces(enemy), { camera, viewport });

    expect(tanks.length).toBeGreaterThan(0);
    expect(walls.some((face) => pointInPolygon(crosshair, face.points))).toBe(false);
  });
});
