/** Constantes y utilidades matemáticas puras compartidas por todo el juego. */

export const TAU = Math.PI * 2;
export const EPSILON = 1e-9;

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/** Interpolación inversa segura: devuelve 0 si el rango es nulo. */
export function inverseLerp(from: number, to: number, value: number): number {
  if (Math.abs(to - from) < EPSILON) return 0;
  return (value - from) / (to - from);
}

/** Normaliza un ángulo al rango [-PI, PI). */
export function wrapAngle(angle: number): number {
  const wrapped = (angle + Math.PI) % TAU;
  return (wrapped < 0 ? wrapped + TAU : wrapped) - Math.PI;
}

/** Diferencia angular más corta entre dos rumbos, en [-PI, PI). */
export function angleDifference(from: number, to: number): number {
  return wrapAngle(to - from);
}

/** Interpola entre dos ángulos por el camino corto. */
export function lerpAngle(from: number, to: number, t: number): number {
  return from + angleDifference(from, to) * t;
}

/** Gira `current` hacia `target` como mucho `maxDelta` radianes. */
export function rotateTowards(current: number, target: number, maxDelta: number): number {
  const difference = angleDifference(current, target);
  if (Math.abs(difference) <= maxDelta) return wrapAngle(target);
  return wrapAngle(current + Math.sign(difference) * maxDelta);
}

export function distance2D(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Dirección normalizada; devuelve (0, 0) si el vector es nulo. */
export function normalize2D(vector: Vec2): Vec2 {
  const length = Math.hypot(vector.x, vector.y);
  if (length < EPSILON) return { x: 0, y: 0 };
  return { x: vector.x / length, y: vector.y / length };
}

export function add3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function subtract3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scale3(vector: Vec3, scalar: number): Vec3 {
  return { x: vector.x * scalar, y: vector.y * scalar, z: vector.z * scalar };
}

export function dot3(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function cross3(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function length3(vector: Vec3): number {
  return Math.hypot(vector.x, vector.y, vector.z);
}

/** Normaliza un vector 3D; devuelve (0, 0, 0) si es nulo. */
export function normalize3(vector: Vec3): Vec3 {
  const length = length3(vector);
  if (length < EPSILON) return { x: 0, y: 0, z: 0 };
  return scale3(vector, 1 / length);
}

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}
