import { describe, expect, it } from 'vitest';
import { createRng } from '../../src/core/rng';

describe('RNG determinista', () => {
  it('reproduce la misma secuencia con la misma semilla', () => {
    const first = createRng(1234);
    const second = createRng(1234);
    const sequenceA = Array.from({ length: 20 }, () => first.next());
    const sequenceB = Array.from({ length: 20 }, () => second.next());
    expect(sequenceA).toEqual(sequenceB);
  });

  it('produce secuencias distintas con semillas distintas', () => {
    const first = createRng(1);
    const second = createRng(2);
    expect(Array.from({ length: 10 }, () => first.next())).not.toEqual(
      Array.from({ length: 10 }, () => second.next()),
    );
  });

  it('genera números en [0, 1)', () => {
    const rng = createRng(99);
    for (let i = 0; i < 500; i += 1) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('respeta los límites de int y range', () => {
    const rng = createRng(7);
    for (let i = 0; i < 500; i += 1) {
      const integer = rng.int(-3, 5);
      expect(Number.isInteger(integer)).toBe(true);
      expect(integer).toBeGreaterThanOrEqual(-3);
      expect(integer).toBeLessThan(5);
      const decimal = rng.range(2.5, 4.5);
      expect(decimal).toBeGreaterThanOrEqual(2.5);
      expect(decimal).toBeLessThan(4.5);
    }
  });

  it('chance respeta los extremos 0 y 1', () => {
    const rng = createRng(3);
    expect(rng.chance(0)).toBe(false);
    expect(rng.chance(1)).toBe(true);
  });

  it('pick devuelve elementos de la lista y falla con listas vacías', () => {
    const rng = createRng(42);
    const items = ['a', 'b', 'c'] as const;
    for (let i = 0; i < 100; i += 1) {
      expect(items).toContain(rng.pick(items));
    }
    expect(() => rng.pick([])).toThrow();
  });

  it('rechaza rangos inválidos', () => {
    const rng = createRng(1);
    expect(() => rng.int(5, 5)).toThrow();
    expect(() => rng.int(1.5, 3)).toThrow();
  });
});
