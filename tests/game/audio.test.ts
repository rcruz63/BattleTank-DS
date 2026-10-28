import { describe, expect, it } from 'vitest';
import type { AudioBus, AudioCue } from '../../src/audio/audio';
import { DEFAULT_VOLUME } from '../../src/audio/audio';
import { createGame } from '../../src/game/game';
import { createInputState } from '../../src/systems/input';

class FakeAudio implements AudioBus {
  readonly cues: AudioCue[] = [];
  engine = -1;
  muted = false;
  volume = -1;

  play(cue: AudioCue): void {
    this.cues.push(cue);
  }
  setEngine(speed: number): void {
    this.engine = speed;
  }
  setMuted(muted: boolean): void {
    this.muted = muted;
  }
  setVolume(volume: number): void {
    this.volume = volume;
  }
  dispose(): void {
    // No-op en el doble.
  }
}

describe('audio de la partida', () => {
  it('inicializa el bus y dispara el cañonazo', () => {
    const input = createInputState();
    const audio = new FakeAudio();
    const game = createGame({ seed: 42, input, audio });

    expect(audio.volume).toBe(DEFAULT_VOLUME);
    expect(audio.muted).toBe(false);

    input.requestFire();
    game.update(1 / 60);
    expect(audio.cues).toContain('fire');

    game.dispose();
    expect(audio.engine).toBe(0);
  });

  it('suena la recarga completada y la recogida de un pickup', () => {
    const input = createInputState();
    const audio = new FakeAudio();
    const game = createGame({ seed: 42, input, audio });

    game.player.reloadRemaining = 0.04;
    game.update(0.1);
    expect(audio.cues).toContain('reload');

    const pickup = game.pickups.find((item) => item.collected === false);
    if (!pickup) throw new Error('No hay pickup.');
    game.player.position = { ...pickup.position };
    game.update(1 / 60);
    expect(audio.cues).toContain('pickup');

    game.dispose();
  });

  it('M silencia y los controles de volumen actualizan el HUD', () => {
    const input = createInputState();
    const audio = new FakeAudio();
    const game = createGame({ seed: 42, input, audio });

    input.handleKeyDown('KeyM');
    game.update(1 / 60);
    expect(audio.muted).toBe(true);
    expect(game.getHudData().muted).toBe(true);
    input.handleKeyUp('KeyM');

    input.handleKeyDown('Minus');
    game.update(1 / 60);
    expect(game.getHudData().volume).toBeCloseTo(0.6);
    expect(audio.volume).toBeCloseTo(0.6);
    input.handleKeyUp('Minus');

    input.handleKeyDown('Equal');
    game.update(1 / 60);
    expect(game.getHudData().volume).toBeCloseTo(0.7);

    game.dispose();
  });

  it('el motor sigue al avance y se para al soltar', () => {
    const input = createInputState();
    const audio = new FakeAudio();
    const game = createGame({ seed: 42, input, audio });

    input.handleKeyDown('KeyW');
    game.update(1 / 60);
    expect(audio.engine).toBe(1);

    input.handleKeyUp('KeyW');
    game.update(1 / 60);
    expect(audio.engine).toBe(0);

    game.dispose();
  });
});
