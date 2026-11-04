/** Campaña de 0.1.0: tres misiones con dificultad creciente. Datos puros, sin lógica. */

export type MissionEnemyClass = 'light' | 'heavy';

export type MissionPhase = 'briefing' | 'playing' | 'victory' | 'defeat' | 'campaign-complete';

export interface MissionArenaConfig {
  readonly widthCells: number;
  readonly heightCells: number;
  readonly obstacleDensity: number;
  readonly destructibleRatio: number;
  readonly pickupCount: number;
  /** Distancia mínima jugador↔enemigo al aparecer (m). */
  readonly minEnemyDistance: number;
}

export interface MissionAiConfig {
  readonly reactionSeconds: number;
  readonly fireSpreadRadians: number;
  readonly damageMultiplier: number;
}

export interface MissionDefinition {
  readonly id: number;
  readonly name: string;
  readonly briefing: string;
  readonly enemies: readonly MissionEnemyClass[];
  readonly arena: MissionArenaConfig;
  readonly ai: MissionAiConfig;
}

export const MISSIONS: readonly MissionDefinition[] = [
  {
    id: 1,
    name: 'Avance por el valle',
    briefing:
      'El sector está débilmente defendido. Avanza por el valle, usa las ruinas como cobertura y elimina a los carros enemigos.',
    enemies: ['light', 'light', 'light'],
    arena: {
      widthCells: 20,
      heightCells: 20,
      obstacleDensity: 0.12,
      destructibleRatio: 0.72,
      pickupCount: 4,
      minEnemyDistance: 20,
    },
    ai: { reactionSeconds: 1.4, fireSpreadRadians: 0.07, damageMultiplier: 0.8 },
  },
  {
    id: 2,
    name: 'Cruce de caminos',
    briefing:
      'El cruce está fortificado y protege el paso de un Tiger. Flanquea las posiciones: el frontal no es una opción.',
    enemies: ['light', 'light', 'light', 'light', 'heavy'],
    arena: {
      widthCells: 22,
      heightCells: 22,
      obstacleDensity: 0.16,
      destructibleRatio: 0.72,
      pickupCount: 4,
      minEnemyDistance: 24,
    },
    ai: { reactionSeconds: 1.1, fireSpreadRadians: 0.05, damageMultiplier: 1 },
  },
  {
    id: 3,
    name: 'Última línea',
    briefing:
      'La última línea enemiga concentra dos Tigers y coberturas densas. Aprovecha los flancos y reserva la potencia para el asalto final.',
    enemies: ['light', 'light', 'light', 'light', 'heavy', 'heavy'],
    arena: {
      widthCells: 24,
      heightCells: 24,
      obstacleDensity: 0.2,
      destructibleRatio: 0.72,
      pickupCount: 5,
      minEnemyDistance: 28,
    },
    ai: { reactionSeconds: 0.9, fireSpreadRadians: 0.035, damageMultiplier: 1.2 },
  },
] as const;

/** Bonus por completar una misión y por cada punto de vida restante. */
export const MISSION_BONUS = 500;
export const HEALTH_BONUS_PER_POINT = 2;

export function missionCount(): number {
  return MISSIONS.length;
}
