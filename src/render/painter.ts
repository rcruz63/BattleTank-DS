/** Algoritmo del pintor: ordena caras por profundidad y las pinta de atrás hacia delante. */

import type { FaceCanvas, RenderFace, ScreenPoint } from './types';

/** Copia ordenada de mayor a menor profundidad (lo más lejano primero). */
export function sortFacesByDepth(faces: readonly RenderFace[]): RenderFace[] {
  return [...faces].sort((a, b) => b.depth - a.depth);
}

function tracePolygon(canvas: FaceCanvas, points: readonly ScreenPoint[]): void {
  const first = points[0];
  if (!first) return;

  canvas.beginPath();
  canvas.moveTo(first.x, first.y);
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index] as ScreenPoint;
    canvas.lineTo(point.x, point.y);
  }
  canvas.closePath();
  canvas.fill();
}

/** Pinta las caras visibles. Devuelve cuántas se pintaron. */
export function paintFaces(canvas: FaceCanvas, faces: readonly RenderFace[]): number {
  let painted = 0;

  for (const face of sortFacesByDepth(faces)) {
    if (face.points.length < 3) continue;
    canvas.fillStyle = face.color;
    tracePolygon(canvas, face.points);
    painted += 1;
  }

  return painted;
}
