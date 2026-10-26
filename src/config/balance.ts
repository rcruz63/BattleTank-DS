/** Valores por defecto de vista, escenario y render. Datos puros, fáciles de ajustar. */

export const VIEWPORT = { width: 1280, height: 720 } as const;

export const CAMERA_DEFAULTS = {
  fovDegrees: 72,
  near: 0.3,
  eyeHeight: 1.7,
  pitchDegrees: -4,
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
