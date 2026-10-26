import { describe, expect, it } from 'vitest';
import {
  mixHexColors,
  parseHexColor,
  shadeHexColor,
  toHexColor,
  withAlpha,
} from '../../src/render/color';

describe('color', () => {
  it('parsea formatos cortos y largos', () => {
    expect(parseHexColor('#abc')).toEqual({ r: 170, g: 187, b: 204 });
    expect(parseHexColor('ff8000')).toEqual({ r: 255, g: 128, b: 0 });
  });

  it('rechaza colores inválidos', () => {
    expect(() => parseHexColor('rojo')).toThrow();
    expect(() => parseHexColor('#12')).toThrow();
  });

  it('convierte a hexadecimal', () => {
    expect(toHexColor({ r: 255, g: 0, b: 16 })).toBe('#ff0010');
    expect(toHexColor({ r: 300, g: -5, b: 0 })).toBe('#ff0000');
  });

  it('sombrea multiplicando canales', () => {
    expect(shadeHexColor('#808080', 0.5)).toBe('#404040');
    expect(shadeHexColor('#808080', 2)).toBe('#ffffff');
  });

  it('mezcla con límites seguros', () => {
    expect(mixHexColors('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mixHexColors('#123456', '#ffffff', 0)).toBe('#123456');
    expect(mixHexColors('#123456', '#ffffff', 1)).toBe('#ffffff');
    expect(mixHexColors('#000000', '#ffffff', 2)).toBe('#ffffff');
  });

  it('añade alfa', () => {
    expect(withAlpha('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
    expect(withAlpha('#ff0000', 2)).toBe('rgba(255, 0, 0, 1)');
  });
});
