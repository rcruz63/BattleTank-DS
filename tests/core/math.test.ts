import { describe, expect, it } from 'vitest';
import {
  angleDifference,
  clamp,
  cross3,
  degreesToRadians,
  dot3,
  inverseLerp,
  lerp,
  lerpAngle,
  normalize2D,
  normalize3,
  radiansToDegrees,
  rotateTowards,
  wrapAngle,
} from '../../src/core/math';

const EPSILON = 1e-9;

describe('clamp y lerp', () => {
  it('limita por abajo y por arriba', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('interpola y calcula la inversa', () => {
    expect(lerp(10, 20, 0.25)).toBe(12.5);
    expect(inverseLerp(10, 20, 12.5)).toBeCloseTo(0.25, 10);
    expect(inverseLerp(4, 4, 99)).toBe(0);
  });
});

describe('ángulos', () => {
  it('normaliza al rango [-PI, PI)', () => {
    expect(wrapAngle(0)).toBeCloseTo(0, 12);
    expect(wrapAngle(Math.PI * 2)).toBeCloseTo(0, 12);
    expect(wrapAngle(Math.PI)).toBeCloseTo(-Math.PI, 12);
    expect(wrapAngle(Math.PI * 3)).toBeCloseTo(-Math.PI, 12);
    expect(wrapAngle(-Math.PI * 1.5)).toBeCloseTo(Math.PI * 0.5, 12);
  });

  it('elige siempre el camino angular corto', () => {
    expect(angleDifference(0.1, -0.1)).toBeCloseTo(-0.2, 12);
    expect(angleDifference(3, -3)).toBeCloseTo(0.2831853, 5);
    expect(lerpAngle(0, Math.PI / 2, 0.5)).toBeCloseTo(Math.PI / 4, 12);
  });

  it('gira hacia el objetivo sin pasarse', () => {
    const rotated = rotateTowards(0, Math.PI / 2, 0.1);
    expect(rotated).toBeCloseTo(0.1, 12);
    const settled = rotateTowards(0, 0.05, 0.1);
    expect(settled).toBeCloseTo(0.05, 12);
    const backwards = rotateTowards(0, -Math.PI / 2, 0.2);
    expect(backwards).toBeCloseTo(-0.2, 12);
  });

  it('convierte grados y radianes', () => {
    expect(degreesToRadians(180)).toBeCloseTo(Math.PI, 12);
    expect(radiansToDegrees(Math.PI / 2)).toBeCloseTo(90, 12);
  });
});

describe('vectores', () => {
  it('normaliza vectores 2D y trata el vector nulo', () => {
    const unit = normalize2D({ x: 3, y: 4 });
    expect(unit.x).toBeCloseTo(0.6, 12);
    expect(unit.y).toBeCloseTo(0.8, 12);
    expect(normalize2D({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });

  it('opera con vectores 3D', () => {
    expect(dot3({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })).toBe(0);
    expect(cross3({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })).toEqual({ x: 0, y: 0, z: 1 });
    const normalized = normalize3({ x: 0, y: 3, z: 4 });
    expect(normalized.y).toBeCloseTo(0.6, 12);
    expect(normalized.z).toBeCloseTo(0.8, 12);
    expect(normalize3({ x: 0, y: 0, z: 0 }).x).toBe(0);
  });

  it('trata el ruido numérico como vector nulo', () => {
    const tiny = normalize2D({ x: EPSILON / 10, y: 0 });
    expect(tiny).toEqual({ x: 0, y: 0 });
  });
});
