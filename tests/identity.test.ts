import { describe, expect, it } from 'vitest';
import { GAME_SUBTITLE, GAME_TITLE, GAME_VERSION } from '../src/config/identity';

describe('identidad del juego', () => {
  it('expone un título no vacío', () => {
    expect(GAME_TITLE.length).toBeGreaterThan(0);
  });

  it('usa una versión semántica', () => {
    expect(GAME_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('tiene un subtítulo ambientado en la Segunda Guerra Mundial', () => {
    expect(GAME_SUBTITLE).toContain('1944');
  });
});
