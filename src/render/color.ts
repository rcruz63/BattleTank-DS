/** Utilidades de color para sombreado plano y niebla de distancia. */

export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/** Acepta `#rgb`, `rgb`, `#rrggbb` o `rrggbb`. Lanza error si el formato no es válido. */
export function parseHexColor(color: string): Rgb {
  const match = HEX_PATTERN.exec(color);
  if (!match) throw new Error(`Color hexadecimal no válido: ${color}`);
  const digits = match[1] as string;
  const expanded =
    digits.length === 3
      ? digits
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : digits;
  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16),
  };
}

export function toHexColor(color: Rgb): string {
  const channel = (value: number) => clampChannel(value).toString(16).padStart(2, '0');
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`;
}

/** Multiplica los canales por `factor` (1 = sin cambios, 0 = negro). */
export function shadeHexColor(color: string, factor: number): string {
  const rgb = parseHexColor(color);
  return toHexColor({ r: rgb.r * factor, g: rgb.g * factor, b: rgb.b * factor });
}

/** Mezcla lineal entre dos colores; t=0 devuelve `from`, t=1 devuelve `to`. */
export function mixHexColors(from: string, to: string, t: number): string {
  const a = parseHexColor(from);
  const b = parseHexColor(to);
  const ratio = Math.max(0, Math.min(1, t));
  return toHexColor({
    r: a.r + (b.r - a.r) * ratio,
    g: a.g + (b.g - a.g) * ratio,
    b: a.b + (b.b - a.b) * ratio,
  });
}

export function withAlpha(color: string, alpha: number): string {
  const rgb = parseHexColor(color);
  const clamped = Math.max(0, Math.min(1, alpha));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamped})`;
}
