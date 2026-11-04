import { describe, expect, it } from 'vitest';
import { AIM_LIMITS, CAMERA_DEFAULTS } from '../../src/config/balance';
import { aimPointerFromCanvas, resolveAim } from '../../src/systems/aim';
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

describe('mapeo del cursor al cono', () => {
  const maxYaw = (AIM_LIMITS.maxYawDegrees * Math.PI) / 180;
  const maxPitch = (AIM_LIMITS.maxPitchDegrees * Math.PI) / 180;

  it('con el cursor en el centro apunta al frente', () => {
    const pointer = aimPointerFromCanvas(0, 0, viewport.width);
    expect(pointer.x).toBeCloseTo(0, 9);
    expect(pointer.y).toBeCloseTo(0, 9);
  });

  it('la retícula sigue al cursor 1:1 hasta el límite del cono', () => {
    const offset = 120;
    const pointer = aimPointerFromCanvas(offset, 0, viewport.width);
    const aim = resolveAim(0, viewport, pointer);
    expect(aim.screenX).toBeCloseTo(viewport.width / 2 + offset, 6);
    expect(aim.screenY).toBeCloseTo(viewport.height / 2, 9);
  });

  it('alcanza el máximo del cono con el desplazamiento focal', () => {
    const atEdge = aimPointerFromCanvas(focal * Math.tan(maxYaw), 0, viewport.width);
    expect(atEdge.x).toBeCloseTo(1, 9);
    expect(aimPointerFromCanvas(-focal * Math.tan(maxYaw), 0, viewport.width).x).toBeCloseTo(-1, 9);
  });

  it('recorta el cursor fuera del cono', () => {
    const pointer = aimPointerFromCanvas(viewport.width, 0, viewport.width);
    expect(pointer.x).toBe(1);
    const aim = resolveAim(0, viewport, pointer);
    expect(aim.screenX).toBeCloseTo(viewport.width / 2 + focal * Math.tan(maxYaw), 6);
  });

  it('mapea la vertical con la misma focal y respeta el límite de cabeceo', () => {
    const pointer = aimPointerFromCanvas(0, -focal * Math.tan(maxPitch / 2), viewport.width);
    expect(pointer.y).toBeCloseTo(0.5, 9);
    expect(aimPointerFromCanvas(0, -viewport.height, viewport.width).y).toBe(1);
    expect(aimPointerFromCanvas(0, viewport.height, viewport.width).y).toBe(-1);
  });

  it('con un canvas sin ancho devuelve el centro', () => {
    expect(aimPointerFromCanvas(120, 40, 0)).toEqual({ x: 0, y: 0 });
  });
});
