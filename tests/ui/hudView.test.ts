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
    expect(view.progress.percent).toBeGreaterThan(0);
    expect(view.score).toBe(100);
  });

  it('formatea recarga y efectos temporales', () => {
    const data = dataFor();
    data.player.reloadRemaining = 1.4;
    data.loot.upgradeStacks = 2;
    data.loot.powerRemaining = 12.2;

    const view = buildHudView({
      ...data,
      paused: true,
      notice: { text: 'Potencia 20 s', color: '#e0b84a', alpha: 0.8 },
    });
    expect(view.reload.ready).toBe(false);
    expect(view.reload.text).toBe('1.4 s');
    expect(view.effects).toEqual({ upgrade: 'Mejora ×2', power: 'Potencia 13 s' });
    expect(view.paused).toBe(true);
    expect(view.notice?.text).toBe('Potencia 20 s');
    expect(view.notice?.alpha).toBeCloseTo(0.8, 9);
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
