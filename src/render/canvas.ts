/** Adaptador DOM del canvas. Resolución interna fija; el CSS se encarga del escalado 16:9. */

import { VIEWPORT } from '../config/balance';
import { withAlpha } from './color';

export { VIEWPORT };

/** Obtiene el contexto 2D del canvas del juego o lanza un error claro. */
export function getGameContext(canvasId = 'game-canvas'): CanvasRenderingContext2D {
  const canvas = document.querySelector<HTMLCanvasElement>(`#${canvasId}`);
  if (!canvas) throw new Error(`No se encontró el canvas #${canvasId}.`);

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Este navegador no soporta Canvas 2D.');
  return context;
}

/** Limpia el viewport con un color sólido. */
export function clearViewport(
  context: CanvasRenderingContext2D,
  color = '#050706',
): void {
  context.fillStyle = color;
  context.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);
}

/** Tinte translúcido a pantalla completa para daño, impacto o pausa. */
export function overlayTint(
  context: CanvasRenderingContext2D,
  color: string,
  alpha: number,
): void {
  context.fillStyle = withAlpha(color, alpha);
  context.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);
}
