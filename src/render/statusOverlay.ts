/** Pantalla provisional de tanque destruido; el HUD definitivo llega en la fase 8. */

import { VIEWPORT } from '../config/balance';
import { PALETTE } from '../config/palette';

export function drawDestroyedOverlay(context: CanvasRenderingContext2D): void {
  context.fillStyle = 'rgba(22, 4, 3, 0.55)';
  context.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);
  context.fillStyle = PALETTE.texto;
  context.font = '600 42px Georgia, serif';
  context.textAlign = 'center';
  context.fillText('TANQUE DESTRUIDO', VIEWPORT.width / 2, VIEWPORT.height / 2 - 8);
  context.fillStyle = PALETTE.textoTenue;
  context.font = '18px monospace';
  context.fillText(
    'La pantalla de resultados llega en la fase 9',
    VIEWPORT.width / 2,
    VIEWPORT.height / 2 + 28,
  );
}
