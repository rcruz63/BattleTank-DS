import { describe, expect, it } from 'vitest';
import {
  cameraBasis,
  createCameraFrame,
  focalLengthForFov,
  projectCameraPoint,
  projectWorldPoint,
  worldToCamera,
} from '../../src/render/camera';
import type { PerspectiveCamera, Viewport } from '../../src/render/types';

const viewport: Viewport = { width: 100, height: 100 };
const camera: PerspectiveCamera = {
  position: { x: 0, y: 0, z: 0 },
  yaw: 0,
  pitch: 0,
  fovRadians: Math.PI / 2,
  near: 0.1,
};

describe('cámara y proyección', () => {
  it('calcula la focal a partir del FOV horizontal', () => {
    expect(focalLengthForFov(Math.PI / 2, 1280)).toBeCloseTo(640, 9);
  });

  it('proyecta el centro de la pantalla en el eje de la mirada', () => {
    const frame = createCameraFrame(camera, viewport);
    const projected = projectWorldPoint({ x: 0, y: 0, z: 10 }, frame);
    expect(projected).not.toBeNull();
    expect(projected?.x).toBeCloseTo(50, 9);
    expect(projected?.y).toBeCloseTo(50, 9);
  });

  it('proyecta derecha arriba y abajo en el lado correcto', () => {
    const frame = createCameraFrame(camera, viewport);
    expect(projectWorldPoint({ x: 5, y: 0, z: 10 }, frame)?.x).toBeGreaterThan(50);
    expect(projectWorldPoint({ x: 0, y: 5, z: 10 }, frame)?.y).toBeLessThan(50);
    expect(projectWorldPoint({ x: 0, y: -5, z: 10 }, frame)?.y).toBeGreaterThan(50);
  });

  it('devuelve null para puntos detrás del plano cercano', () => {
    const frame = createCameraFrame(camera, viewport);
    expect(projectWorldPoint({ x: 0, y: 0, z: -1 }, frame)).toBeNull();
    expect(projectCameraPoint({ x: 0, y: 0, z: 0 }, camera, viewport, 50)).toBeNull();
  });

  it('transforma al espacio de cámara respetando el giro', () => {
    const origin = worldToCamera({ x: 0, y: 0, z: 10 }, camera);
    expect(origin).toEqual({ x: 0, y: 0, z: 10 });

    const turned: PerspectiveCamera = { ...camera, yaw: Math.PI / 2 };
    const toTheEast = worldToCamera({ x: 10, y: 0, z: 0 }, turned);
    expect(toTheEast.z).toBeCloseTo(10, 9);
    expect(toTheEast.x).toBeCloseTo(0, 9);
  });

  it('la base es ortonormal y mira a +Z con yaw 0', () => {
    const basis = cameraBasis(camera);
    expect(basis.forward.z).toBeCloseTo(1, 9);
    expect(basis.right.x).toBeCloseTo(1, 9);
    expect(basis.up.y).toBeCloseTo(1, 9);
    const frame = createCameraFrame({ ...camera, pitch: 0.4 }, viewport);
    expect(frame.basis.forward.y).toBeCloseTo(Math.sin(0.4), 9);
  });
});
