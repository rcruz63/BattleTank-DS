import { describe, expect, it } from 'vitest';
import { clipPolygonNearPlane, clipSegmentNearPlane } from '../../src/render/clip';
import type { Vec3 } from '../../src/core/math';

const near = 0.3;

function quadAt(z: number): Vec3[] {
  return [
    { x: -1, y: 0, z },
    { x: 1, y: 0, z },
    { x: 1, y: 1, z },
    { x: -1, y: 1, z },
  ];
}

describe('recorte de plano cercano', () => {
  it('deja intacto un polígono delante', () => {
    const result = clipPolygonNearPlane(quadAt(2), near);
    expect(result).toHaveLength(4);
    expect(result.every((point) => point.z >= near)).toBe(true);
  });

  it('elimina un polígono completamente detrás', () => {
    expect(clipPolygonNearPlane(quadAt(-2), near)).toEqual([]);
  });

  it('corta un polígono que cruza el plano', () => {
    const crossing: Vec3[] = [
      { x: 0, y: 0, z: -1 },
      { x: 1, y: 0, z: -1 },
      { x: 1, y: 0, z: 1 },
      { x: 0, y: 0, z: 1 },
    ];
    const result = clipPolygonNearPlane(crossing, near);
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.every((point) => point.z >= near - 1e-9)).toBe(true);
    expect(result.some((point) => Math.abs(point.z - near) < 1e-9)).toBe(true);
  });

  it('trata una lista vacía como resultado vacío', () => {
    expect(clipPolygonNearPlane([], near)).toEqual([]);
  });
});

describe('recorte de segmentos', () => {
  it('conserva segmentos visibles y elimina los ocultos', () => {
    expect(clipSegmentNearPlane({ x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 2 }, near)).toEqual([
      { x: 0, y: 0, z: 1 },
      { x: 1, y: 0, z: 2 },
    ]);
    expect(clipSegmentNearPlane({ x: 0, y: 0, z: -1 }, { x: 1, y: 0, z: -2 }, near)).toBeNull();
  });

  it('recorta un extremo que cruza el plano', () => {
    const result = clipSegmentNearPlane({ x: 0, y: 0, z: -1 }, { x: 0, y: 0, z: 1 }, near);
    expect(result).not.toBeNull();
    expect(result?.[0].z).toBeCloseTo(near, 9);
    expect(result?.[1].z).toBeCloseTo(1, 9);
  });
});
