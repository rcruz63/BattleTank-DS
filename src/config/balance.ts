/** Valores por defecto de vista, escenario y render. Datos puros, fáciles de ajustar. */

export const VIEWPORT = { width: 1280, height: 720 } as const;

export const CAMERA_DEFAULTS = {
  fovDegrees: 72,
  near: 0.3,
  eyeHeight: 1.7,
  // La cámara mira al horizonte para que la retícula centrada corresponda a un tiro horizontal.
  pitchDegrees: 0,
} as const;

export const ARENA_DEFAULTS = {
  widthCells: 20,
  heightCells: 20,
  cellSize: 4,
  obstacleDensity: 0.14,
  destructibleRatio: 0.72,
  enemyCount: 4,
  pickupCount: 4,
  minEnemyDistance: 20,
  minPickupDistance: 8,
} as const;

export const RENDER_DEFAULTS = {
  maxDrawDistance: 82,
  fogStart: 16,
  fogEnd: 72,
} as const;

/** Dirección de la luz para el sombreado plano; se normaliza al usarla. */
export const LIGHT_DIRECTION = { x: 0.35, y: 0.85, z: 0.25 } as const;

/** Radio de colisión del jugador (m). Menor que media celda para poder sortear huecos. */
export const PLAYER_RADIUS = 1.35;

/** Combate: proyectiles, boca de cañón y retroceso. */
export const COMBAT = {
  muzzleHeight: 1.25,
  bulletRadius: 0.22,
  bulletMaxAgeSeconds: 3,
  bulletStepMeters: 0.5,
  recoilKickRadians: 0.055,
} as const;

/** Radio de colisión de los tanques enemigos (m). */
export const ENEMY_RADIUS = 1.4;

/** Margen de seguridad al colisionar dos tanques (m): se suma a la suma de sus radios. */
export const ENTITY_SEPARATION = 0.15;

/** Ajustes base de la IA; las misiones los escalan en la fase 9. */
export const AI_TUNING = {
  detectionRange: 70,
  attackRange: 34,
  minAdvanceDistance: 10,
  reactionSeconds: 1.1,
  aimToleranceRadians: 0.1,
  fireSpreadRadians: 0.05,
  pathIntervalSeconds: 1.1,
  moveSpeedFactor: 0.75,
} as const;

/** Cono de puntería del cañón respecto al rumbo del tanque. */
export const AIM_LIMITS = {
  maxYawDegrees: 15,
  maxPitchDegrees: 4,
} as const;

/** Geometría del cañón del jugador: pivote en la torreta y longitud del tubo. */
export const GUN = {
  pivotForward: 1.1,
  pivotHeight: 1.55,
  barrelLength: 2.2,
} as const;

/** Altura de impacto de un tanque (cilindro de colisión vertical). */
export const TANK_TARGET_HEIGHT = 2.2;
