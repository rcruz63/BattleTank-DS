import { describe, expect, it } from 'vitest';
import { paintFaces, sortFacesByDepth } from '../../src/render/painter';
import type { FaceCanvas, RenderFace } from '../../src/render/types';

class RecordingCanvas implements FaceCanvas {
  fillStyle: unknown = '';
  readonly fills: Array<{ color: string; vertices: number }> = [];
  private vertexCount = 0;

  beginPath(): void {
    this.vertexCount = 0;
  }

  moveTo(): void {
    this.vertexCount += 1;
  }

  lineTo(): void {
    this.vertexCount += 1;
  }

  closePath(): void {}

  fill(): void {
    this.fills.push({ color: String(this.fillStyle), vertices: this.vertexCount });
  }
}

function face(depth: number, color: string): RenderFace {
  return {
    depth,
    color,
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ],
  };
}

describe('painter', () => {
  it('ordena de más lejos a más cerca sin mutar la entrada', () => {
    const faces = [face(1, '#111111'), face(5, '#555555'), face(3, '#333333')];
    const order = sortFacesByDepth(faces);
    expect(order.map((item) => item.depth)).toEqual([5, 3, 1]);
    expect(faces.map((item) => item.depth)).toEqual([1, 5, 3]);
  });

  it('pinta en orden de profundidad y cuenta las caras válidas', () => {
    const canvas = new RecordingCanvas();
    const painted = paintFaces(canvas, [face(1, '#111111'), face(9, '#999999')]);
    expect(painted).toBe(2);
    expect(canvas.fills).toEqual([
      { color: '#999999', vertices: 3 },
      { color: '#111111', vertices: 3 },
    ]);
  });

  it('descarta caras con menos de tres vértices', () => {
    const canvas = new RecordingCanvas();
    const degenerate: RenderFace = { depth: 1, color: '#000000', points: [{ x: 0, y: 0 }] };
    expect(paintFaces(canvas, [degenerate])).toBe(0);
    expect(canvas.fills).toHaveLength(0);
  });
});
