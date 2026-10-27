/**
 * Overlays de estado temporales del canvas mientras no existe el HUD de la fase 8:
 * panel de estado, aviso de pickup y pantalla provisional de tanque destruido.
 *
 * Solo leen datos y pintan; no mutan el estado ni conocen los sistemas de juego.
 */

import { VIEWPORT } from '../config/balance';
import { PALETTE } from '../config/palette';
import type { EnemyState } from '../entities/enemy';
import type { PlayerState } from '../entities/player';

/** Datos de efectos temporales que el render necesita (sin depender de `systems`). */
export interface LootStatus {
  readonly upgradeStacks: number;
  readonly powerRemaining: number;
}

export interface TemporaryStatus {
  readonly seed: number;
  readonly player: PlayerState;
  readonly enemies: readonly EnemyState[];
  readonly bulletCount: number;
  readonly loot: LootStatus;
}

export interface PickupNotice {
  readonly text: string;
  readonly color: string;
  readonly alpha: number;
}

function lootLine(loot: LootStatus): string {
  if (loot.powerRemaining > 0) {
    return `mejora ×${loot.upgradeStacks} · potencia ${loot.powerRemaining.toFixed(1)} s`;
  }
  return `mejora ×${loot.upgradeStacks} · potencia inactiva`;
}

/** Panel superior con semilla, enemigos, vida, recarga y efectos activos. */
export function drawTemporaryStatus(
  context: CanvasRenderingContext2D,
  status: TemporaryStatus,
): void {
  const { seed, player, enemies, bulletCount, loot } = status;
  const alive = enemies.filter((enemy) => enemy.alive).length;
  context.fillStyle = 'rgba(4, 6, 5, 0.55)';
  context.fillRect(24, 24, 620, 84);
  context.fillStyle = PALETTE.texto;
  context.font = '16px monospace';
  context.textAlign = 'left';
  context.fillText(
    `Semilla ${seed} · fase 7 · enemigos ${alive}/${enemies.length} · proyectiles ${bulletCount}`,
    36,
    48,
  );
  context.fillStyle = PALETTE.textoTenue;
  const reload =
    player.reloadRemaining > 0 ? `recargando ${player.reloadRemaining.toFixed(1)} s` : 'lista';
  context.fillText(
    `W/S · A/D girar · ratón apuntar · clic/ESPACIO disparar · vida ${Math.round(player.health)}/${player.maxHealth} · ${reload}`,
    36,
    70,
  );
  context.fillStyle = PALETTE.texto;
  context.fillText(lootLine(loot), 36, 92);
}

/** Aviso flotante del último pickup recogido, con desvanecimiento. */
export function drawPickupNotice(context: CanvasRenderingContext2D, notice: PickupNotice): void {
  if (notice.alpha <= 0) return;
  context.globalAlpha = Math.min(1, notice.alpha);
  context.fillStyle = 'rgba(4, 6, 5, 0.6)';
  context.fillRect(VIEWPORT.width / 2 - 120, 112, 240, 38);
  context.fillStyle = notice.color;
  context.font = '600 24px Georgia, serif';
  context.textAlign = 'center';
  context.fillText(notice.text, VIEWPORT.width / 2, 138);
  context.globalAlpha = 1;
}

/** Pantalla provisional de tanque destruido (la definitiva llega con las misiones). */
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
