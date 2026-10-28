/** Persistencia de campaña: récord y misión máxima desbloqueada. Best-effort con localStorage. */

export const PROGRESSION_KEY = 'battletank-ds.progression.v1';

export interface Progression {
  readonly bestScore: number;
  readonly unlockedMission: number;
}

export interface ProgressionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const EMPTY_PROGRESSION: Progression = { bestScore: 0, unlockedMission: 0 };

function browserStorage(): ProgressionStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function isValid(value: unknown): value is { bestScore: number; unlockedMission: number } {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.bestScore === 'number' &&
    Number.isFinite(record.bestScore) &&
    record.bestScore >= 0 &&
    typeof record.unlockedMission === 'number' &&
    Number.isInteger(record.unlockedMission) &&
    record.unlockedMission >= 0
  );
}

/** Carga la progresión; ante cualquier error devuelve el estado inicial. */
export function loadProgression(storage: ProgressionStorage | null = browserStorage()): Progression {
  if (!storage) return EMPTY_PROGRESSION;
  try {
    const raw = storage.getItem(PROGRESSION_KEY);
    if (!raw) return EMPTY_PROGRESSION;
    const parsed: unknown = JSON.parse(raw);
    if (!isValid(parsed)) return EMPTY_PROGRESSION;
    return { bestScore: parsed.bestScore, unlockedMission: parsed.unlockedMission };
  } catch {
    return EMPTY_PROGRESSION;
  }
}

/** Guarda la progresión sin romper el juego si el almacenamiento falla. */
export function saveProgression(
  progression: Progression,
  storage: ProgressionStorage | null = browserStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(PROGRESSION_KEY, JSON.stringify(progression));
  } catch {
    // Persistencia best-effort: el juego sigue sin récord.
  }
}

/** Devuelve la progresión actualizada tras una victoria. */
export function recordVictory(
  progression: Progression,
  missionIndex: number,
  score: number,
  maxMissionIndex: number,
): Progression {
  const unlocked = Math.min(
    maxMissionIndex,
    Math.max(progression.unlockedMission, missionIndex + 1),
  );
  return {
    bestScore: Math.max(progression.bestScore, score),
    unlockedMission: unlocked,
  };
}
