import { describe, expect, it } from 'vitest';
import { AIM_LIMITS, CAMERA_DEFAULTS } from '../../src/config/balance';
import { resolveAim } from '../../src/systems/aim';
import type { Viewport } from '../../src/render/types';

const viewport: Viewport = { width: 1280, height: 720 };
const focal = viewport.width / 2 / Math.tan((CAMERA_DEFAULTS.fovDegrees * Math.PI) / 360);

describe('puntería del cañón', () => {
  it('con el puntero centrado apunta al frente y la retícula al centro', () => {
    const aim = resolveAim(0, viewport, { x: 0, y: 0 });
    expect(aim.direction.x).toBeCloseTo(0, 9);
    expect(aim.direction.y).toBeCloseTo(0, 9);
    expect(aim.direction.z).toBeCloseTo(1, 9);
    expect(aim.screenX).toBeCloseTo(640, 9);
    expect(aim.screenY).toBeCloseTo(360, 9);
  });

  it('gira a la derecha y dibuja la retícula a la derecha', () => {
    const aim = resolveAim(0, viewport, { x: 1, y: 0 });
    const maxYaw = (AIM_LIMITS.maxYawDegrees * Math.PI) / 180;
    expect(aim.yawOffset).toBeCloseTo(maxYaw, 9);
    expect(aim.direction.x).toBeCloseTo(Math.sin(maxYaw), 9);
    expect(aim.screenX).toBeCloseTo(640 + focal * Math.tan(maxYaw), 6);
    expect(aim.screenY).toBeCloseTo(360, 9);
  });

  it('eleva el cañón y sube la retícula', () => {
    const aim = resolveAim(0, viewport, { x: 0, y: 1 });
    const maxPitch = (AIM_LIMITS.maxPitchDegrees * Math.PI) / 180;
    expect(aim.pitchOffset).toBeCloseTo(maxPitch, 9);
    expect(aim.direction.y).toBeCloseTo(Math.sin(maxPitch), 9);
    expect(aim.screenY).toBeCloseTo(360 - focal * Math.tan(maxPitch), 6);
  });

  it('limita el puntero al cono', () => {
    const clamped = resolveAim(0, viewport, { x: 5, y: -5 });
    const edge = resolveAim(0, viewport, { x: 1, y: -1 });
    expect(clamped.direction).toEqual(edge.direction);
    expect(clamped.screenX).toBeCloseTo(edge.screenX, 9);
    expect(clamped.screenY).toBeCloseTo(edge.screenY, 9);
  });

  it('rota con el rumbo del tanque sin mover la cámara', () => {
    const aim = resolveAim(Math.PI / 2, viewport, { x: 0, y: 0 });
    expect(aim.direction.x).toBeCloseTo(1, 9);
    expect(aim.direction.z).toBeCloseTo(0, 9);
  });

  it('devuelve siempre una dirección normalizada', () => {
    for (const pointer of [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: -1, y: 0.5 },
      { x: 0.3, y: -0.7 },
    ]) {
      const aim = resolveAim(0.8, viewport, pointer);
      const length = Math.hypot(aim.direction.x, aim.direction.y, aim.direction.z);
      expect(length).toBeCloseTo(1, 9);
    }
  });
});
