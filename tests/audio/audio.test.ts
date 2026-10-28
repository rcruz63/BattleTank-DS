import { describe, expect, it } from 'vitest';
import { clampVolume, createAudioBus, createSilentAudioBus, DEFAULT_VOLUME } from '../../src/audio/audio';

describe('bus de audio', () => {
  it('el bus silencioso no falla y no produce efectos', () => {
    const bus = createSilentAudioBus();
    expect(() => {
      bus.play('fire');
      bus.setEngine(1);
      bus.setMuted(true);
      bus.setVolume(0.3);
      bus.dispose();
    }).not.toThrow();
  });

  it('en un entorno sin WebAudio devuelve un bus silencioso utilizable', () => {
    const bus = createAudioBus();
    expect(() => {
      bus.play('ui');
      bus.setEngine(0.5);
      bus.dispose();
    }).not.toThrow();
  });

  it('limita el volumen al rango 0..1', () => {
    expect(clampVolume(-1)).toBe(0);
    expect(clampVolume(0.4)).toBe(0.4);
    expect(clampVolume(2)).toBe(1);
    expect(DEFAULT_VOLUME).toBeGreaterThan(0);
  });
});
