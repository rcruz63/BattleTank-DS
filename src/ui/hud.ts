/** Adaptador DOM del HUD: barras, recarga, efectos, avisos, pausa y radar. */

import type { HudView } from './hudView';
import { drawRadar } from './radar';

export interface Hud {
  update(view: HudView): void;
}

interface VitalsElements {
  readonly healthFill: HTMLDivElement;
  readonly healthText: HTMLSpanElement;
  readonly reloadText: HTMLSpanElement;
}

interface ProgressElements {
  readonly progressFill: HTMLDivElement;
  readonly progressText: HTMLSpanElement;
}

interface EffectsElements {
  readonly effects: HTMLDivElement;
  readonly upgradeText: HTMLSpanElement;
  readonly powerText: HTMLSpanElement;
}

interface PauseElements {
  readonly pause: HTMLDivElement;
  readonly pauseSeed: HTMLParagraphElement;
}

function updateVitals(view: HudView, elements: VitalsElements): void {
  elements.healthFill.style.width = `${view.health.fraction * 100}%`;
  elements.healthText.textContent = view.health.text;
  elements.reloadText.textContent = view.reload.text;
  elements.reloadText.classList.toggle('ready', view.reload.ready);
}

function updateProgress(view: HudView, elements: ProgressElements): void {
  elements.progressFill.style.width = `${view.progress.fraction * 100}%`;
  elements.progressText.textContent = view.progress.text;
}

function updateEffects(view: HudView, elements: EffectsElements): void {
  const hasEffects = view.effects.upgrade !== null || view.effects.power !== null;
  elements.effects.hidden = !hasEffects;
  elements.upgradeText.hidden = view.effects.upgrade === null;
  elements.upgradeText.textContent = view.effects.upgrade ?? '';
  elements.powerText.hidden = view.effects.power === null;
  elements.powerText.textContent = view.effects.power ?? '';
}

function updatePause(view: HudView, elements: PauseElements): void {
  elements.pause.hidden = !view.paused;
  elements.pauseSeed.textContent = `Escenario #${view.seed}`;
}

function updateNotice(view: HudView, toast: HTMLDivElement): void {
  if (!view.notice) {
    toast.hidden = true;
    return;
  }
  toast.hidden = false;
  toast.textContent = view.notice.text;
  toast.style.color = view.notice.color;
  toast.style.opacity = String(view.notice.alpha);
}

function mustFind<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`HUD: no se encontró ${selector}.`);
  return element;
}

/** Conecta los elementos del HUD (definidos en index.html) con la vista calculada. */
export function createHud(root: ParentNode = document): Hud {
  const healthFill = mustFind<HTMLDivElement>(root, '#hud-health-fill');
  const healthText = mustFind<HTMLSpanElement>(root, '#hud-health-text');
  const reloadText = mustFind<HTMLSpanElement>(root, '#hud-reload-text');
  const effects = mustFind<HTMLDivElement>(root, '#hud-effects');
  const upgradeText = mustFind<HTMLSpanElement>(root, '#hud-effects-upgrade');
  const powerText = mustFind<HTMLSpanElement>(root, '#hud-effects-power');
  const progressFill = mustFind<HTMLDivElement>(root, '#hud-progress-fill');
  const progressText = mustFind<HTMLSpanElement>(root, '#hud-progress-text');
  const scoreText = mustFind<HTMLDivElement>(root, '#hud-score-text');
  const pause = mustFind<HTMLDivElement>(root, '#hud-pause');
  const pauseSeed = mustFind<HTMLParagraphElement>(root, '#hud-pause-seed');
  const toast = mustFind<HTMLDivElement>(root, '#hud-toast');
  const radar = mustFind<HTMLCanvasElement>(root, '#hud-radar');
  const radarContext = radar.getContext('2d');
  if (!radarContext) throw new Error('HUD: el radar no tiene Canvas 2D.');

  const setHealthLevel = (level: HudView['health']['level']): void => {
    healthFill.classList.remove('alta', 'media', 'baja');
    healthFill.classList.add(level);
  };

  return {
    update: (view) => {
      setHealthLevel(view.health.level);
      updateVitals(view, { healthFill, healthText, reloadText });
      updateProgress(view, { progressFill, progressText });
      scoreText.textContent = view.score.toString();
      updateEffects(view, { effects, upgradeText, powerText });
      updatePause(view, { pause, pauseSeed });
      updateNotice(view, toast);
      drawRadar(radarContext, view.radar, performance.now() / 1000);
    },
  };
}
