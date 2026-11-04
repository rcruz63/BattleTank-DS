import { describe, expect, it } from 'vitest';
import { createGame } from '../../src/game/game';
import { buildHudView } from '../../src/ui/hudView';
import type { HudData } from '../../src/ui/hudView';

function dataFor(seed = 42): HudData {
  const game = createGame({ seed });
  return game.getHudData();
}

describe('vista del HUD', () => {
  it('muestra vida, progreso inicial, puntuación y recarga lista', () => {
    const view = buildHudView(dataFor());
    expect(view.health.fraction).toBeCloseTo(1, 9);
    expect(view.health.level).toBe('alta');
    expect(view.health.text).toBe('100 / 100');
    expect(view.health.vignette).toBe(0);
    expect(view.progress.fraction).toBe(0);
    expect(view.progress.text).toBe('0 %');
    expect(view.score).toBe(0);
    expect(view.reload.ready).toBe(true);
    expect(view.effects).toEqual({ upgrade: null, power: null });
    expect(view.paused).toBe(false);
    expect(view.notice).toBeNull();
  });

  it('cambia el nivel de vida y calcula el avance al destruir enemigos', () => {
    const data = dataFor();
    data.player.health = 20;
    const [first] = data.enemies;
    if (!first) throw new Error('La arena debe tener enemigos.');
    first.alive = false;

    const view = buildHudView({ ...data, score: 100 });
    expect(view.health.level).toBe('baja');
    expect(view.health.vignette).toBeCloseTo(0.25, 9);
    expect(view.progress.percent).toBeGreaterThan(0);
    expect(view.score).toBe(100);
  });

  it('intensifica la viñeta de daño al bajar la vida y la anula por encima del umbral', () => {
    const data = dataFor();
    data.player.health = 40;
    expect(buildHudView(data).health.vignette).toBe(0);
    data.player.health = 0;
    expect(buildHudView(data).health.vignette).toBeCloseTo(0.5, 9);
    data.player.health = 100;
    expect(buildHudView(data).health.vignette).toBe(0);
  });

  it('formatea recarga y efectos temporales', () => {
    const data = dataFor();
    data.player.reloadRemaining = 1.4;
    data.loot.upgradeStacks = 2;
    data.loot.powerRemaining = 12.2;

    const view = buildHudView({
      ...data,
      notice: { text: 'Potencia 20 s', color: '#e0b84a', alpha: 0.8 },
    });
    expect(view.reload.ready).toBe(false);
    expect(view.reload.text).toBe('1.4 s');
    expect(view.effects).toEqual({ upgrade: 'Mejora ×2', power: 'Potencia 13 s' });
    expect(view.paused).toBe(false);
    expect(view.notice?.text).toBe('Potencia 20 s');
    expect(view.notice?.alpha).toBeCloseTo(0.8, 9);
  });

  it('oculta el aviso de pickup mientras la partida está en pausa', () => {
    const data = dataFor();
    const view = buildHudView({
      ...data,
      paused: true,
      notice: { text: 'Potencia 20 s', color: '#e0b84a', alpha: 0.8 },
    });
    expect(view.paused).toBe(true);
    expect(view.notice).toBeNull();
  });

  it('limita la vida al rango 0..max y oculta avisos caducados', () => {
    const data = dataFor();
    data.player.health = -10;
    const view = buildHudView({
      ...data,
      notice: { text: '', color: '#fff', alpha: 0 },
    });
    expect(view.health.fraction).toBe(0);
    expect(view.notice).toBeNull();
  });
});

describe('briefing de misión', () => {
  it('enseña controles y blindaje antes de desplegar', () => {
    const data = createGame({ seed: 42, autoStart: false }).getHudData();
    const view = buildHudView(data);
    const text = view.screen?.lines.join(' ') ?? '';

    expect(view.screen?.kicker).toBe('MISIÓN 1');
    expect(view.screen?.action).toBe('ENTER para desplegar');
    expect(text).toContain('WASD');
    expect(text).toContain('ESPACIO');
    expect(text).toContain('frontal ×0,5');
    expect(text).toContain('lateral ×1');
  });

  it('lista las misiones y marca las bloqueadas en el briefing', () => {
    const locked = buildHudView(createGame({ seed: 42, autoStart: false }).getHudData());
    const lockedText = locked.screen?.lines.join(' ') ?? '';
    expect(lockedText).toContain('Misiones:');
    expect(lockedText).toContain('Cruce de caminos (bloqueada)');
    expect(lockedText).toContain('Pulsa 1, 2 o 3 para cambiar de misión');

    const unlockedData = createGame({
      seed: 42,
      autoStart: false,
      progression: { bestScore: 100, unlockedMission: 2 },
    }).getHudData();
    const unlocked = buildHudView(unlockedData);
    const unlockedText = unlocked.screen?.lines.join(' ') ?? '';
    expect(unlockedText).toContain('▶ 3 · Última línea');
    expect(unlockedText).not.toContain('(bloqueada)');
  });
});
