import { describe, expect, it } from 'vitest';
import { createGame } from '../../src/game/game';
import { createInputState } from '../../src/systems/input';
import { buildHudView } from '../../src/ui/hudView';

function press(input: ReturnType<typeof createInputState>, code: 'Enter' | 'Escape'): void {
  input.handleKeyDown(code);
  input.handleKeyUp(code);
}

describe('campaña', () => {
  it('muestra el briefing, arranca con ENTER y avanza a la siguiente misión', () => {
    const input = createInputState();
    const game = createGame({ seed: 42, input, autoStart: false });

    expect(game.phase).toBe('briefing');
    expect(game.missionIndex).toBe(0);
    const briefing = buildHudView(game.getHudData());
    expect(briefing.screen?.action).toContain('ENTER');
    expect(briefing.screen?.title).toBe('Avance por el valle');

    press(input, 'Enter');
    game.update(1 / 60);
    expect(game.phase).toBe('playing');
    expect(buildHudView(game.getHudData()).screen).toBeNull();

    for (const enemy of game.enemies) enemy.alive = false;
    game.update(1 / 60);
    expect(game.phase).toBe('victory');
    expect(buildHudView(game.getHudData()).screen?.title).toBe('MISIÓN CUMPLIDA');
    expect(game.getHudData().score).toBeGreaterThan(0);

    press(input, 'Enter');
    game.update(1 / 60);
    expect(game.phase).toBe('briefing');
    expect(game.missionIndex).toBe(1);
    expect(game.enemies).toHaveLength(5);
    expect(game.enemies.some((enemy) => enemy.type === 'heavy')).toBe(true);

    game.dispose();
  });

  it('al morir muestra derrota y ENTER reintenta la misma misión', () => {
    const input = createInputState();
    const game = createGame({ seed: 42, input, autoStart: true });

    game.player.health = 0;
    game.player.alive = false;
    game.update(1 / 60);
    expect(game.phase).toBe('defeat');
    expect(buildHudView(game.getHudData()).screen?.title).toBe('TANQUE DESTRUIDO');

    press(input, 'Enter');
    game.update(1 / 60);
    expect(game.phase).toBe('briefing');
    expect(game.missionIndex).toBe(0);
    expect(game.player.health).toBeGreaterThan(0);

    game.dispose();
  });

  it('completa las tres misiones y vuelve a empezar la campaña', () => {
    const input = createInputState();
    const game = createGame({ seed: 42, input, autoStart: true });

    for (let mission = 0; mission < 3; mission += 1) {
      expect(game.missionIndex).toBe(mission);
      for (const enemy of game.enemies) enemy.alive = false;
      game.update(1 / 60);
      expect(game.phase).toBe('victory');

      press(input, 'Enter');
      game.update(1 / 60);
      if (mission < 2) {
        expect(game.phase).toBe('briefing');
        press(input, 'Enter');
        game.update(1 / 60);
        expect(game.phase).toBe('playing');
      }
    }

    expect(game.phase).toBe('campaign-complete');
    expect(buildHudView(game.getHudData()).screen?.title).toBe('COMPLETADA');

    press(input, 'Enter');
    game.update(1 / 60);
    expect(game.phase).toBe('briefing');
    expect(game.missionIndex).toBe(0);

    game.dispose();
  });
});
