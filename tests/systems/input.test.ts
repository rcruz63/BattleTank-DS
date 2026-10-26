import { describe, expect, it } from 'vitest';
import { createInputState } from '../../src/systems/input';

describe('entrada de teclado', () => {
  it('calcula el avance con W/S y flechas', () => {
    const input = createInputState();
    input.handleKeyDown('KeyW');
    expect(input.snapshot().forward).toBe(1);
    input.handleKeyDown('ArrowDown');
    expect(input.snapshot().forward).toBe(0);
    input.handleKeyUp('KeyW');
    expect(input.snapshot().forward).toBe(-1);
    input.handleKeyUp('ArrowDown');
    expect(input.snapshot().forward).toBe(0);
  });

  it('calcula el giro con A/D y flechas', () => {
    const input = createInputState();
    input.handleKeyDown('KeyD');
    expect(input.snapshot().turn).toBe(1);
    input.handleKeyDown('KeyA');
    expect(input.snapshot().turn).toBe(0);
    input.handleKeyUp('KeyD');
    expect(input.snapshot().turn).toBe(-1);
  });

  it('el disparo es un flanco que se consume', () => {
    const input = createInputState();
    input.handleKeyDown('Space');
    expect(input.snapshot().fire).toBe(true);
    expect(input.snapshot().fire).toBe(false);

    input.handleKeyDown('Space');
    expect(input.snapshot().fire).toBe(false);
    input.handleKeyUp('Space');
    input.handleKeyDown('Space');
    expect(input.snapshot().fire).toBe(true);
  });

  it('clear libera teclas y disparo pendiente', () => {
    const input = createInputState();
    input.handleKeyDown('KeyW');
    input.handleKeyDown('Space');
    input.clear();
    const snapshot = input.snapshot();
    expect(snapshot.forward).toBe(0);
    expect(snapshot.fire).toBe(false);
  });
});
