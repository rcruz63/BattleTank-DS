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
  readonly hullColor: string;
  readonly turretColor: string;
  readonly trackColor: string;
  readonly barrelColor: string;
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
  hullColor: '#5f6b4a',
  turretColor: '#6d7956',
  trackColor: '#33362c',
  barrelColor: '#414738',
};

/** Panzer III: rápido y numeroso; aparece en la fase de IA. */
export const ENEMY_LIGHT_TANK: TankDefinition = {
  id: 'panzer-iii',
  label: 'Panzer III',
  faction: 'eje',
  maxHealth: 100,
  speed: 4.5,
  turnSpeedDegrees: 70,
  reloadSeconds: 3,
  damage: 10,
  armor: 0,
  shellSpeed: 55,
  hullColor: '#6b7060',
  turretColor: '#7a7f6c',
  trackColor: '#3a3d35',
  barrelColor: '#4a4e44',
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
  armor: 0.1,
  shellSpeed: 60,
  hullColor: '#8a7a55',
  turretColor: '#9a8a62',
  trackColor: '#4a4233',
  barrelColor: '#5a5242',
};
