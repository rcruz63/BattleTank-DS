/** Modelo puro del HUD: transforma el estado de partida en datos listos para DOM y radar. */

import { clamp } from '../core/math';
import { MISSIONS } from '../config/missions';
import type { MissionDefinition, MissionPhase } from '../config/missions';
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

export interface HudStats {
  readonly shotsFired: number;
  readonly shotsHit: number;
  readonly accuracy: number;
  readonly damageTaken: number;
  readonly elapsedSeconds: number;
}

export interface HudData {
  readonly seed: number;
  readonly player: PlayerState;
  readonly enemies: readonly EnemyState[];
  readonly pickups: readonly PickupState[];
  readonly loot: LootState;
  readonly grid: WorldGrid;
  readonly mission: MissionDefinition;
  readonly phase: MissionPhase;
  readonly score: number;
  readonly bestScore: number;
  readonly unlockedMission: number;
  readonly stats: HudStats;
  readonly paused: boolean;
  readonly muted: boolean;
  readonly volume: number;
  readonly notice: HudNotice;
}

export type HealthLevel = 'alta' | 'media' | 'baja';

export interface HudScreen {
  readonly kicker: string;
  readonly title: string;
  readonly lines: readonly string[];
  readonly action: string;
}

export interface HudView {
  readonly health: {
    readonly fraction: number;
    readonly level: HealthLevel;
    readonly text: string;
    /** 0..0,5 de opacidad de la viñeta roja cuando la vida está baja. */
    readonly vignette: number;
  };
  readonly progress: {
    readonly fraction: number;
    readonly percent: number;
    readonly text: string;
  };
  readonly missionLabel: string;
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
  readonly drive: string;
  readonly audio: {
    readonly muted: boolean;
    readonly text: string;
    readonly volume: number;
  };
  readonly seed: number;
  readonly screen: HudScreen | null;
  readonly notice: { readonly text: string; readonly color: string; readonly alpha: number } | null;
  readonly radar: RadarModel;
}

function healthLevel(fraction: number): HealthLevel {
  if (fraction > 0.6) return 'alta';
  if (fraction > 0.3) return 'media';
  return 'baja';
}

/** La viñeta de daño empieza al 40 % de vida y sube hasta 0,5 de opacidad al 0 %. */
const HEALTH_VIGNETTE_START = 0.4;
const HEALTH_VIGNETTE_MAX = 0.5;

function healthVignette(fraction: number): number {
  const intensity = clamp((HEALTH_VIGNETTE_START - fraction) / HEALTH_VIGNETTE_START, 0, 1);
  return intensity * HEALTH_VIGNETTE_MAX;
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

function accuracyPercent(stats: HudStats): number {
  return Math.round(clamp(stats.accuracy, 0, 1) * 100);
}

function statLines(data: HudData): string[] {
  return [
    `Puntos de misión: ${data.score}`,
    `Precisión: ${accuracyPercent(data.stats)} %`,
    `Tiempo: ${formatTime(data.stats.elapsedSeconds)}`,
    `Daño recibido: ${Math.round(data.stats.damageTaken)}`,
    `Récord: ${data.bestScore}`,
  ];
}

/** Lista de misiones con la actual y las bloqueadas marcadas; se usa en el briefing. */
function missionMenu(data: HudData): string {
  return MISSIONS.map((mission, index) => {
    const current = index === data.mission.id - 1 ? '▶ ' : '';
    const locked = index > data.unlockedMission ? ' (bloqueada)' : '';
    return `${current}${index + 1} · ${mission.name}${locked}`;
  }).join('   ');
}

function buildScreen(data: HudData): HudScreen | null {
  if (data.paused) return null;

  switch (data.phase) {
    case 'briefing':
      return {
        kicker: `MISIÓN ${data.mission.id}`,
        title: data.mission.name,
        lines: [
          data.mission.briefing,
          'Objetivo: destruye todas las fuerzas enemigas.',
          'Controles: WASD/flechas mover y girar · ratón apuntar · clic o ESPACIO disparar · ESC pausa',
          'Blindaje: frontal ×0,5 · lateral ×1 · trasero ×1,5 — busca el flanco',
          `Misiones: ${missionMenu(data)}`,
          'Pulsa 1, 2 o 3 para cambiar de misión',
          `Escenario #${data.seed}`,
        ],
        action: 'ENTER para desplegar',
      };
    case 'victory':
      return {
        kicker: 'OBJETIVO CUMPLIDO',
        title: 'MISIÓN CUMPLIDA',
        lines: statLines(data),
        action: 'ENTER para continuar',
      };
    case 'defeat':
      return {
        kicker: 'MISIÓN FALLIDA',
        title: 'TANQUE DESTRUIDO',
        lines: [
          `Puntos: ${data.score}`,
          `Precisión: ${accuracyPercent(data.stats)} %`,
          `Daño recibido: ${Math.round(data.stats.damageTaken)}`,
        ],
        action: 'ENTER para reintentar',
      };
    case 'campaign-complete':
      return {
        kicker: 'CAMPAÑA',
        title: 'COMPLETADA',
        lines: [
          `Puntuación final: ${data.score}`,
          `Récord: ${data.bestScore}`,
          `Misiones desbloqueadas: ${data.unlockedMission + 1}/3`,
        ],
        action: 'ENTER para nueva campaña',
      };
    case 'playing':
      return null;
  }
}

/** Construye la vista del HUD; no toca el DOM ni el estado. */
export function buildHudView(data: HudData): HudView {
  const { player, enemies, pickups, loot, grid, score, paused, notice, seed } = data;
  const volumePercent = Math.round(clamp(data.volume, 0, 1) * 100);
  const healthFraction = player.maxHealth > 0 ? clamp(player.health / player.maxHealth, 0, 1) : 0;
  const destroyed = enemies.filter((enemy) => !enemy.alive).length;
  const total = enemies.length;
  const progressFraction = total > 0 ? clamp(destroyed / total, 0, 1) : 0;
  const percent = Math.round(progressFraction * 100);
  const reloadReady = player.reloadRemaining <= 0;
  const noticeVisible = notice.alpha > 0.01 && !paused;

  return {
    health: {
      fraction: healthFraction,
      level: healthLevel(healthFraction),
      text: `${Math.round(player.health)} / ${Math.round(player.maxHealth)}`,
      vignette: healthVignette(healthFraction),
    },
    progress: {
      fraction: progressFraction,
      percent,
      text: `${percent} %`,
    },
    missionLabel: `MISIÓN ${data.mission.id} · ${data.mission.name}`,
    score,
    reload: {
      ready: reloadReady,
      text: reloadReady ? 'LISTO' : `${player.reloadRemaining.toFixed(1)} s`,
    },
    effects: {
      upgrade: loot.upgradeStacks > 0 ? `Mejora ×${loot.upgradeStacks}` : null,
      power: loot.powerRemaining > 0 ? `Potencia ${Math.ceil(loot.powerRemaining)} s` : null,
    },
    paused,
    drive: 'M4 SHERMAN',
    audio: {
      muted: data.muted,
      text: data.muted ? 'SILENCIADO' : `SONIDO ${volumePercent} %`,
      volume: volumePercent,
    },
    seed,
    screen: buildScreen(data),
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
