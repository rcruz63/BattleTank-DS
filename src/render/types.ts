/** Tipos compartidos por el pipeline de render. Nada aquí conoce el DOM ni muta el estado. */

import type { Vec3 } from '../core/math';

export interface ScreenPoint {
  readonly x: number;
  readonly y: number;
}

/** Cámara de periscopio. `position` es el ojo; `yaw` 0 mira hacia +Z. */
export interface PerspectiveCamera {
  readonly position: Vec3;
  readonly yaw: number;
  readonly pitch: number;
  readonly fovRadians: number;
  readonly near: number;
}

export interface Viewport {
  readonly width: number;
  readonly height: number;
}

/** Cara ya proyectada, lista para pintar con el algoritmo del pintor. */
export interface RenderFace {
  readonly points: readonly ScreenPoint[];
  readonly color: string;
  /** Profundidad media en espacio de cámara; mayor = más lejos. */
  readonly depth: number;
}

/** Subconjunto del contexto Canvas 2D que necesita el pintor (permite simularlo en tests). */
export interface FaceCanvas {
  fillStyle: unknown;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  closePath(): void;
  fill(): void;
}
