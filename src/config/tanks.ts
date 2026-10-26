/** Carros de la Segunda Guerra Mundial: datos de balance centralizados, sin lógica. */

export type Faction = 'aliado' | 'eje';

export interface TankDefinition {
  readonly id: string;
  readonly label: string;
  readonly faction: Faction;
  readonly maxHealth: number;
  /** Velocidad máxima en m/s (marcha atrás a la mitad). */
  readonly speed: number;
  readonly turnSpeedDegrees: number;
  readonly reloadSeconds: number;
  readonly damage: number;
  /** Fracción de daño mitigada por el blindaje (0..1). */
  readonly armor: number;
  readonly shellSpeed: number;
}

/** M4 Sherman: equilibrado, buena cadencia. */
export const PLAYER_TANK: TankDefinition = {
  id: 'sherman',
  label: 'M4 Sherman',
  faction: 'aliado',
  maxHealth: 100,
  speed: 6,
  turnSpeedDegrees: 90,
  reloadSeconds: 2.4,
  damage: 40,
  armor: 0.1,
  shellSpeed: 80,
};

/** Panzer III: rápido y numeroso; aparece en la fase de IA. */
export const ENEMY_LIGHT_TANK: TankDefinition = {
  id: 'panzer-iii',
  label: 'Panzer III',
  faction: 'eje',
  maxHealth: 60,
  speed: 4.5,
  turnSpeedDegrees: 70,
  reloadSeconds: 3,
  damage: 10,
  armor: 0,
  shellSpeed: 55,
};

/** Tiger I: lento, duro y con mucho daño por impacto. */
export const ENEMY_HEAVY_TANK: TankDefinition = {
  id: 'tiger-i',
  label: 'Tiger I',
  faction: 'eje',
  maxHealth: 140,
  speed: 3.2,
  turnSpeedDegrees: 50,
  reloadSeconds: 4,
  damage: 20,
  armor: 0.15,
  shellSpeed: 60,
};
