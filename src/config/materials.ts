/** Materiales de cobertura: datos editables. Las coberturas indestructibles no tienen vida finita. */

export type MaterialId = 'madera' | 'ladrillo' | 'hormigon' | 'acero';

export interface MaterialDefinition {
  readonly id: MaterialId;
  readonly label: string;
  readonly destructible: boolean;
  /** Vida en puntos de daño; `Infinity` para materiales indestructibles. */
  readonly maxHealth: number;
  /** Altura en metros. Debe superar la altura del ojo para ocultar la visión. */
  readonly height: number;
  /** Altura de los escombros una vez destruida (no oculta ni bloquea). */
  readonly rubbleHeight: number;
  readonly color: string;
  readonly rubbleColor: string;
}

export const MATERIALS: Readonly<Record<MaterialId, MaterialDefinition>> = {
  madera: {
    id: 'madera',
    label: 'Cajones de madera',
    destructible: true,
    maxHealth: 40,
    height: 2.4,
    rubbleHeight: 0.35,
    color: '#8a6a3f',
    rubbleColor: '#4c3b23',
  },
  ladrillo: {
    id: 'ladrillo',
    label: 'Muro de ladrillo',
    destructible: true,
    maxHealth: 90,
    height: 3,
    rubbleHeight: 0.45,
    color: '#8c4b3a',
    rubbleColor: '#573128',
  },
  hormigon: {
    id: 'hormigon',
    label: 'Bloque de hormigón',
    destructible: false,
    maxHealth: Number.POSITIVE_INFINITY,
    height: 3.2,
    rubbleHeight: 0.5,
    color: '#86867c',
    rubbleColor: '#56564f',
  },
  acero: {
    id: 'acero',
    label: 'Plancha de acero',
    destructible: false,
    maxHealth: Number.POSITIVE_INFINITY,
    height: 3.4,
    rubbleHeight: 0.5,
    color: '#5d666b',
    rubbleColor: '#3d4448',
  },
};

/** Materiales que puede destruir el jugador (para generación y balance). */
export const DESTRUCTIBLE_MATERIALS: readonly MaterialId[] = ['madera', 'ladrillo'];

/** Materiales que bloquean para siempre. */
export const INDESTRUCTIBLE_MATERIALS: readonly MaterialId[] = ['hormigon', 'acero'];
