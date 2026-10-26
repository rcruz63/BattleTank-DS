/** Paleta visual del juego. Datos puros reutilizados por render y HUD. */

export const PALETTE = {
  fondo: '#050706',
  cieloAlto: '#0c1218',
  cieloHorizonte: '#6f7566',
  sueloLejos: '#4a4c3c',
  sueloCerca: '#1c1e17',
  niebla: '#6f7566',
  rejilla: '#9aa08a',
  rejillaMayor: '#b3b79d',
  mira: '#ddd6ba',
  miraAviso: '#c4452f',
  vidaAlta: '#6fae5c',
  vidaMedia: '#c8a24a',
  vidaBaja: '#c4452f',
  progreso: '#c8a24a',
  radar: '#88b06a',
  radarEnemigo: '#d0553c',
  radarPickup: '#79c46b',
  enemigo: '#7b3f34',
  enemigoOscuro: '#4c2a23',
  jugador: '#5f6b4a',
  pickupCura: '#79c46b',
  pickupMejora: '#6fa8d8',
  pickupPotencia: '#e0b84a',
  texto: '#d8d2bd',
  textoTenue: '#8a927f',
  panel: 'rgba(8, 12, 10, 0.78)',
  destelloDano: '#c4452f',
  destelloDisparo: '#f0d78c',
} as const;

export type Palette = typeof PALETTE;
