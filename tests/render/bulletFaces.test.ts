import { describe, expect, it } from 'vitest';
import { createBullet } from '../../src/entities/bullet';
import { buildBulletFaces } from '../../src/render/bulletFaces';
import type { PerspectiveCamera, Viewport } from '../../src/render/types';

const viewport: Viewport = { width: 100, height: 100 };
const camera: PerspectiveCamera = {
  position: { x: 10, y: 1.7, z: 5 },
  yaw: 0,
  pitch: 0,
  fovRadians: Math.PI / 2,
  near: 0.1,
};

function bulletAt(z: number) {
  return createBullet({
    position: { x: 10, y: 1.25, z },
    direction: { x: 0, y: 0, z: 1 },
    speed: 80,
    damage: 40,
    owner: 'player',
  });
}

describe('tracers de proyectiles', () => {
  it('genera núcleo y halo para un proyectil visible', () => {
    const faces = buildBulletFaces([bulletAt(10)], camera, viewport);
    expect(faces).toHaveLength(2);
    // El halo va 1 cm por detrás del núcleo para que el painter lo pinte antes.
    expect(faces[0]?.depth).toBeCloseTo(5.01, 6);
    expect(faces[1]?.depth).toBeCloseTo(5, 6);
  });

  it('descarta proyectiles detrás de la cámara', () => {
    expect(buildBulletFaces([bulletAt(4)], camera, viewport)).toHaveLength(0);
  });

  it('no genera caras sin proyectiles', () => {
    expect(buildBulletFaces([], camera, viewport)).toHaveLength(0);
  });
});
