import { describe, expect, it } from 'vitest';
import { PALETTE } from '../../src/config/palette';
import { buildWorldFaces } from '../../src/render/worldFaces';
import type { PerspectiveCamera, Viewport } from '../../src/render/types';
import { createEmptyGrid, damageObstacle, placeObstacle } from '../../src/world/grid';

const viewport: Viewport = { width: 1280, height: 720 };

function cameraAt(x: number, z: number): PerspectiveCamera {
  return {
    position: { x, y: 1.7, z },
    yaw: 0,
    pitch: 0,
    fovRadians: Math.PI / 2,
    near: 0.3,
  };
}

function gridWithWall(): ReturnType<typeof createEmptyGrid> {
  const grid = createEmptyGrid(5, 5, 4, 1);
  placeObstacle(grid, 2, 2, 'ladrillo');
  return grid;
}

function minScreenY(faces: ReturnType<typeof buildWorldFaces>): number {
  const ys = faces.flatMap((face) => face.points.map((point) => point.y));
  return Math.min(...ys);
}

describe('caras del mundo', () => {
  it('no genera caras para un mundo vacío', () => {
    const faces = buildWorldFaces({
      grid: createEmptyGrid(5, 5, 4, 1),
      camera: cameraAt(10, 5),
      viewport,
    });
    expect(faces).toHaveLength(0);
  });

  it('pinta la cara frontal visible de una cobertura intacta', () => {
    const faces = buildWorldFaces({ grid: gridWithWall(), camera: cameraAt(10, 5), viewport });
    expect(faces).toHaveLength(1);
    expect(faces[0]?.depth).toBeGreaterThan(0);
  });

  it('descarta coberturas que quedan detrás de la cámara', () => {
    const faces = buildWorldFaces({ grid: gridWithWall(), camera: cameraAt(10, 20), viewport });
    expect(faces).toHaveLength(0);
  });

  it('respeta la distancia máxima de dibujado', () => {
    const faces = buildWorldFaces({
      grid: gridWithWall(),
      camera: cameraAt(10, 5),
      viewport,
      maxDrawDistance: 0,
    });
    expect(faces).toHaveLength(0);
  });

  it('al destruir la cobertura la sustituye por escombros bajos', () => {
    const intact = buildWorldFaces({ grid: gridWithWall(), camera: cameraAt(10, 5), viewport });
    const destroyedGrid = gridWithWall();
    damageObstacle(destroyedGrid, 2, 2, 999);
    const destroyed = buildWorldFaces({
      grid: destroyedGrid,
      camera: cameraAt(10, 5),
      viewport,
    });

    expect(destroyed.length).toBeGreaterThan(0);
    expect(minScreenY(destroyed)).toBeGreaterThan(minScreenY(intact));
  });

  it('aplica niebla total cuando la distancia supera el final de la niebla', () => {
    const faces = buildWorldFaces({
      grid: gridWithWall(),
      camera: cameraAt(10, 5),
      viewport,
      fogStart: 0,
      fogEnd: 1,
      fogColor: PALETTE.niebla,
    });
    expect(faces[0]?.color).toBe(PALETTE.niebla);
  });

  it('dibuja dos coberturas contiguas como dos caras frontales', () => {
    const grid = gridWithWall();
    placeObstacle(grid, 3, 2, 'madera');
    const faces = buildWorldFaces({ grid, camera: cameraAt(10, 5), viewport });
    expect(faces).toHaveLength(2);
  });
});
