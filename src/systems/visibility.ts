/** Visibilidad de los enemigos para el HUD/feedback: LOS y rango de representación. */

import type { EnemyState } from '../entities/enemy';
import type { PlayerState } from '../entities/player';
import { planarDistance } from '../world/geometry';
import { hasLineOfSight } from '../world/los';
import type { WorldGrid } from '../world/types';

const ENEMY_VISIBILITY_RANGE = 65;

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
