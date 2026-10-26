import { describe, expect, it } from 'vitest';
import { createEnemy } from '../../src/entities/enemy';
import { tankWorldFaces } from '../../src/render/models';

function makeEnemy(yaw = 0): ReturnType<typeof createEnemy> {
  return createEnemy('enemigo-1', 'light', { x: 10, z: 10, yaw });
}

describe('modelos de tanques', () => {
  it('genera casco, cadenas, torreta y cañón', () => {
    const faces = tankWorldFaces(makeEnemy());
    expect(faces).toHaveLength(25);
    for (const face of faces) {
      expect(face.points).toHaveLength(4);
      for (const point of face.points) {
        expect(Number.isFinite(point.x)).toBe(true);
        expect(Number.isFinite(point.y)).toBe(true);
        expect(Number.isFinite(point.z)).toBe(true);
      }
    }
  });

  it('mantiene todas las caras entre el suelo y la altura del tanque', () => {
    const ys = tankWorldFaces(makeEnemy()).flatMap((face) =>
      face.points.map((point) => point.y),
    );
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...ys)).toBeLessThan(3.5);
  });

  it('orienta las caras según el rumbo', () => {
    const front = tankWorldFaces(makeEnemy()).some(
      (face) => face.normal.z > 0.9 && Math.abs(face.normal.x) < 0.01,
    );
    const turned = tankWorldFaces(makeEnemy(Math.PI / 2)).some(
      (face) => face.normal.x > 0.9 && Math.abs(face.normal.z) < 0.01,
    );
    expect(front).toBe(true);
    expect(turned).toBe(true);
  });
});
