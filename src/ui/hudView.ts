/** Modelo puro del HUD: transforma el estado de partida en datos listos para DOM y radar. */

import { clamp } from '../core/math';
import type { EnemyState } from '../entities/enemy';
import type { PickupState } from '../entities/pickup';
import type { PlayerState } from '../entities/player';
import type { LootState } from '../systems/loot';
import type { WorldGrid } from '../world/types';
import { buildRadarModel } from './radar';
import type { RadarModel } from './radar';

export interface HudNotice {
  readonly text: string;
  readonly color: string;
  readonly alpha: number;
}

export interface HudData {
  readonly seed: number;
  readonly player: PlayerState;
  readonly enemies: readonly EnemyState[];
  readonly pickups: readonly PickupState[];
  readonly loot: LootState;
  readonly grid: WorldGrid;
  readonly score: number;
  readonly paused: boolean;
  readonly notice: HudNotice;
}

export type HealthLevel = 'alta' | 'media' | 'baja';

export interface HudView {
  readonly health: {
    readonly fraction: number;
    readonly level: HealthLevel;
    readonly text: string;
  };
  readonly progress: {
    readonly fraction: number;
    readonly percent: number;
    readonly text: string;
  };
  readonly score: number;
  readonly reload: {
    readonly ready: boolean;
    readonly text: string;
  };
  readonly effects: {
    readonly upgrade: string | null;
    readonly power: string | null;
  };
  readonly paused: boolean;
  readonly seed: number;
  readonly notice: { readonly text: string; readonly color: string; readonly alpha: number } | null;
  readonly radar: RadarModel;
}

function healthLevel(fraction: number): HealthLevel {
  if (fraction > 0.6) return 'alta';
  if (fraction > 0.3) return 'media';
  return 'baja';
}

/** Construye la vista del HUD; no toca el DOM ni el estado. */
export function buildHudView(data: HudData): HudView {
  const { player, enemies, pickups, loot, grid, score, paused, notice, seed } = data;
  const healthFraction = player.maxHealth > 0 ? clamp(player.health / player.maxHealth, 0, 1) : 0;
  const destroyed = enemies.filter((enemy) => !enemy.alive).length;
  const total = enemies.length;
  const progressFraction = total > 0 ? clamp(destroyed / total, 0, 1) : 0;
  const percent = Math.round(progressFraction * 100);
  const reloadReady = player.reloadRemaining <= 0;
  const noticeVisible = notice.alpha > 0.01;

  return {
    health: {
      fraction: healthFraction,
      level: healthLevel(healthFraction),
      text: `${Math.round(player.health)} / ${Math.round(player.maxHealth)}`,
    },
    progress: {
      fraction: progressFraction,
      percent,
      text: `${percent} %`,
    },
    score,
    reload: {
      ready: reloadReady,
      text: reloadReady ? 'LISTO' : `${player.reloadRemaining.toFixed(1)} s`,
    },
    effects: {
      upgrade: loot.upgradeStacks > 0 ? `Mejora ×${loot.upgradeStacks}` : null,
      power:
        loot.powerRemaining > 0 ? `Potencia ${Math.ceil(loot.powerRemaining)} s` : null,
    },
    paused,
    seed,
    notice: noticeVisible
      ? {
          text: notice.text,
          color: notice.color,
          alpha: clamp(notice.alpha, 0, 1),
        }
      : null,
    radar: buildRadarModel(player, enemies, pickups, grid),
  };
}
