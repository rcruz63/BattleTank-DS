import { describe, expect, it } from 'vitest';
import { PICKUP_COLORS } from '../../src/config/pickups';
import type { PickupKind } from '../../src/config/pickups';
import { createPickups } from '../../src/entities/pickup';
import type { PickupState } from '../../src/entities/pickup';
import { pickupWorldFaces } from '../../src/render/pickupFaces';

function pickupOfKind(kind: PickupKind): PickupState {
  const pickup = createPickups([
    { x: 10, z: 20 },
    { x: 10, z: 20 },
    { x: 10, z: 20 },
  ]).find((item) => item.kind === kind);
  if (!pickup) throw new Error(`No se generó el pickup ${kind}.`);
  return pickup;
}

describe('modelo de pickups', () => {
  it('genera geometría de caja e icono para los tres tipos', () => {
    for (const kind of ['health', 'upgrade', 'power'] as const) {
      const faces = pickupWorldFaces(pickupOfKind(kind));
      expect(faces.length).toBeGreaterThan(10);
      for (const face of faces) {
        expect(face.points).toHaveLength(4);
        for (const point of face.points) {
          expect(Number.isFinite(point.x)).toBe(true);
          expect(Number.isFinite(point.y)).toBe(true);
          expect(Number.isFinite(point.z)).toBe(true);
          expect(point.y).toBeGreaterThanOrEqual(0);
        }
      }
      expect(faces.some((face) => face.color === PICKUP_COLORS[kind])).toBe(true);
    }
  });

  it('flota y se centra sobre la posición del pickup', () => {
    const pickup = pickupOfKind('health');
    const faces = pickupWorldFaces(pickup);
    const ys = faces.flatMap((face) => face.points.map((point) => point.y));
    const xs = faces.flatMap((face) => face.points.map((point) => point.x));
    const zs = faces.flatMap((face) => face.points.map((point) => point.z));

    expect(Math.max(...ys)).toBeGreaterThan(1);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(pickup.position.x, 6);
    expect((Math.min(...zs) + Math.max(...zs)) / 2).toBeCloseTo(pickup.position.z, 6);
  });

  it('un pickup recogido no se dibuja', () => {
    const pickup = pickupOfKind('upgrade');
    pickup.collected = true;
    expect(pickupWorldFaces(pickup)).toHaveLength(0);
  });
});
