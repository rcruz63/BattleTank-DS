/** Generador pseudoaleatorio determinista (mulberry32) para escenarios reproducibles. */

export interface Rng {
  /** Semilla original; permite reconstruir el mismo escenario. */
  readonly seed: number;
  /** Número en el intervalo [0, 1). */
  next(): number;
  /** Entero en el intervalo [min, maxExclusive). */
  int(min: number, maxExclusive: number): number;
  /** Número real en el intervalo [min, max). */
  range(min: number, max: number): number;
  /** Verdadero con la probabilidad indicada (0..1). */
  chance(probability: number): boolean;
  /** Elemento aleatorio de una lista no vacía. */
  pick<T>(items: readonly T[]): T;
}

function nextUnit(state: { value: number }): number {
  state.value = (state.value + 0x6d2b79f5) >>> 0;
  let mixed = state.value;
  mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
  mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
  return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
}

/** Crea un RNG determinista: la misma semilla produce siempre la misma secuencia. */
export function createRng(seed: number): Rng {
  const state = { value: seed >>> 0 };

  const int = (min: number, maxExclusive: number): number => {
    if (!Number.isInteger(min) || !Number.isInteger(maxExclusive)) {
      throw new Error('int() requiere límites enteros.');
    }
    if (maxExclusive <= min) {
      throw new Error('int() requiere maxExclusive > min.');
    }
    return min + Math.floor(nextUnit(state) * (maxExclusive - min));
  };

  return {
    seed: state.value,
    next: () => nextUnit(state),
    int,
    range: (min, max) => min + nextUnit(state) * (max - min),
    chance: (probability) => nextUnit(state) < probability,
    pick: <T>(items: readonly T[]): T => {
      if (items.length === 0) throw new Error('pick() requiere una lista no vacía.');
      return items[int(0, items.length)] as T;
    },
  };
}
