import { describe, expect, it } from 'vitest';
import {
  loadProgression,
  PROGRESSION_KEY,
  recordVictory,
  saveProgression,
} from '../../src/systems/progression';
import type { ProgressionStorage } from '../../src/systems/progression';

class MemoryStorage implements ProgressionStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('persistencia de campaña', () => {
  it('devuelve el estado inicial sin datos o con datos inválidos', () => {
    const storage = new MemoryStorage();
    expect(loadProgression(storage)).toEqual({ bestScore: 0, unlockedMission: 0 });

    storage.setItem(PROGRESSION_KEY, '{roto');
    expect(loadProgression(storage)).toEqual({ bestScore: 0, unlockedMission: 0 });

    storage.setItem(PROGRESSION_KEY, JSON.stringify({ bestScore: -5, unlockedMission: 1 }));
    expect(loadProgression(storage)).toEqual({ bestScore: 0, unlockedMission: 0 });
  });

  it('guarda y recupera el récord y la misión desbloqueada', () => {
    const storage = new MemoryStorage();
    saveProgression({ bestScore: 1200, unlockedMission: 2 }, storage);
    expect(loadProgression(storage)).toEqual({ bestScore: 1200, unlockedMission: 2 });
  });

  it('una victoria actualiza récord y desbloqueo sin retroceder', () => {
    const first = recordVictory({ bestScore: 100, unlockedMission: 0 }, 0, 900, 2);
    expect(first).toEqual({ bestScore: 900, unlockedMission: 1 });

    const second = recordVictory(first, 1, 700, 2);
    expect(second).toEqual({ bestScore: 900, unlockedMission: 2 });

    const third = recordVictory(second, 2, 1600, 2);
    expect(third).toEqual({ bestScore: 1600, unlockedMission: 2 });
  });
});
