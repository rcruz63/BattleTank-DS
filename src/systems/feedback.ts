/** Estado de feedback para el HUD: visibilidad de enemigos y caducidad de daños flotantes. */

import type { EnemyState } from '../entities/enemy';
import type { PlayerState } from '../entities/player';
import type { DamagePopup } from '../render/combatFeedback';
import { planarDistance } from '../world/geometry';
import { hasLineOfSight } from '../world/los';
import type { WorldGrid } from '../world/types';

const ENEMY_VISIBILITY_RANGE = 65;

export const DAMAGE_POPUP_LIFETIME = 1.1;

/** Actualiza `visibleToPlayer` sin revelar enemigos a través de coberturas intactas. */
export function refreshEnemyVisibility(
  grid: WorldGrid,
  player: PlayerState,
  enemies: readonly EnemyState[],
): void {
  for (const enemy of enemies) {
    if (!enemy.alive) {
      enemy.visibleToPlayer = false;
      continue;
    }
    const distance = planarDistance(player.position, enemy.position);
    enemy.visibleToPlayer =
      distance <= ENEMY_VISIBILITY_RANGE &&
      hasLineOfSight(grid, player.position, enemy.position);
  }
}

/** Envejece los números de daño y elimina los caducados. */
export function updateDamagePopups(popups: DamagePopup[], stepSeconds: number): void {
  for (let index = popups.length - 1; index >= 0; index -= 1) {
    const popup = popups[index];
    if (!popup) continue;
    popup.age += stepSeconds;
    if (popup.age > DAMAGE_POPUP_LIFETIME) popups.splice(index, 1);
  }
}
