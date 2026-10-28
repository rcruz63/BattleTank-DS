/** Adaptador DOM del HUD: barras, recarga, efectos, avisos, pausa, pantallas y radar. */

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

interface ScreenElements {
  readonly screen: HTMLDivElement;
  readonly kicker: HTMLDivElement;
  readonly title: HTMLHeadingElement;
  readonly lines: HTMLDivElement;
  readonly action: HTMLDivElement;
}

interface HudElements extends VitalsElements, ProgressElements, EffectsElements, PauseElements, ScreenElements {
  readonly scoreText: HTMLDivElement;
  readonly toast: HTMLDivElement;
  readonly missionLabel: HTMLDivElement;
  readonly radarContext: CanvasRenderingContext2D;
}

function mustFind<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`HUD: no se encontró ${selector}.`);
  return element;
}

function queryVitals(root: ParentNode): VitalsElements {
  return {
    healthFill: mustFind<HTMLDivElement>(root, '#hud-health-fill'),
    healthText: mustFind<HTMLSpanElement>(root, '#hud-health-text'),
    reloadText: mustFind<HTMLSpanElement>(root, '#hud-reload-text'),
  };
}

function queryProgress(root: ParentNode): ProgressElements & { scoreText: HTMLDivElement } {
  return {
    progressFill: mustFind<HTMLDivElement>(root, '#hud-progress-fill'),
    progressText: mustFind<HTMLSpanElement>(root, '#hud-progress-text'),
    scoreText: mustFind<HTMLDivElement>(root, '#hud-score-text'),
  };
}

function queryEffects(root: ParentNode): EffectsElements {
  return {
    effects: mustFind<HTMLDivElement>(root, '#hud-effects'),
    upgradeText: mustFind<HTMLSpanElement>(root, '#hud-effects-upgrade'),
    powerText: mustFind<HTMLSpanElement>(root, '#hud-effects-power'),
  };
}

function queryPause(root: ParentNode): PauseElements & { toast: HTMLDivElement; missionLabel: HTMLDivElement } {
  return {
    pause: mustFind<HTMLDivElement>(root, '#hud-pause'),
    pauseSeed: mustFind<HTMLParagraphElement>(root, '#hud-pause-seed'),
    toast: mustFind<HTMLDivElement>(root, '#hud-toast'),
    missionLabel: mustFind<HTMLDivElement>(root, '#hud-mission'),
  };
}

function queryScreen(root: ParentNode): ScreenElements {
  return {
    screen: mustFind<HTMLDivElement>(root, '#hud-screen'),
    kicker: mustFind<HTMLDivElement>(root, '#hud-screen-kicker'),
    title: mustFind<HTMLHeadingElement>(root, '#hud-screen-title'),
    lines: mustFind<HTMLDivElement>(root, '#hud-screen-lines'),
    action: mustFind<HTMLDivElement>(root, '#hud-screen-action'),
  };
}

function queryRadar(root: ParentNode): CanvasRenderingContext2D {
  const canvas = mustFind<HTMLCanvasElement>(root, '#hud-radar');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('HUD: el radar no tiene Canvas 2D.');
  return context;
}

function queryHudElements(root: ParentNode): HudElements {
  const radarContext = queryRadar(root);
  return {
    ...queryVitals(root),
    ...queryProgress(root),
    ...queryEffects(root),
    ...queryPause(root),
    ...queryScreen(root),
    radarContext,
  };
}

function updateVitals(view: HudView, elements: VitalsElements): void {
  elements.healthFill.classList.remove('alta', 'media', 'baja');
  elements.healthFill.classList.add(view.health.level);
  elements.healthFill.style.width = `${view.health.fraction * 100}%`;
  elements.healthText.textContent = view.health.text;
  elements.reloadText.textContent = view.reload.text;
  elements.reloadText.classList.toggle('ready', view.reload.ready);
}

function updateProgress(view: HudView, elements: ProgressElements & { scoreText: HTMLDivElement }): void {
  elements.progressFill.style.width = `${view.progress.fraction * 100}%`;
  elements.progressText.textContent = view.progress.text;
  elements.scoreText.textContent = view.score.toString();
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

function updateScreen(view: HudView, elements: ScreenElements): void {
  const screen = view.screen;
  if (!screen) {
    elements.screen.hidden = true;
    return;
  }
  elements.screen.hidden = false;
  elements.kicker.textContent = screen.kicker;
  elements.title.textContent = screen.title;
  elements.action.textContent = screen.action;
  elements.lines.replaceChildren(
    ...screen.lines.map((line) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = line;
      return paragraph;
    }),
  );
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

function updateHud(elements: HudElements, view: HudView): void {
  updateVitals(view, elements);
  updateProgress(view, elements);
  updateEffects(view, elements);
  updatePause(view, elements);
  updateNotice(view, elements.toast);
  elements.missionLabel.textContent = view.missionLabel;
  updateScreen(view, elements);
  drawRadar(elements.radarContext, view.radar, performance.now() / 1000);
}

/** Conecta los elementos del HUD (definidos en index.html) con la vista calculada. */
export function createHud(root: ParentNode = document): Hud {
  const elements = queryHudElements(root);
  return { update: (view) => updateHud(elements, view) };
}
