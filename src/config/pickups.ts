/** Datos de los pickups: efectos, aspecto y reparto determinista. Datos puros, sin lógica. */

import { PALETTE } from './palette';

export type PickupKind = 'health' | 'upgrade' | 'power';

export interface PickupDefinition {
  readonly label: string;
}

/** Etiqueta corta para avisos y HUD. */
export const PICKUP_DEFINITIONS: Record<PickupKind, PickupDefinition> = {
  health: { label: 'Botiquín' },
  upgrade: { label: 'Mejora' },
  power: { label: 'Potencia' },
};

/** Color de caja e icono de cada pickup (coincide con el del radar y el HUD). */
export const PICKUP_COLORS: Record<PickupKind, string> = {
  health: PALETTE.pickupCura,
  upgrade: PALETTE.pickupMejora,
  power: PALETTE.pickupPotencia,
};

/** Reglas de efecto y recogida; todo el balance de pickups vive aquí. */
export const PICKUP_RULES = {
  collectRadiusMeters: 2,
  healthRestore: 30,
  upgradeMaxStacks: 3,
  upgradeMaxHealth: 20,
  /** Reducción de daño recibido por acumulación (se combina de forma multiplicativa). */
  upgradeDamageReduction: 0.1,
  powerSeconds: 20,
  powerDamageMultiplier: 1.75,
  powerReloadMultiplier: 0.65,
} as const;

/** Orden de reparto determinista por spawn: con 3+ unidades aparecen siempre los tres tipos. */
export const PICKUP_SPAWN_KINDS: readonly PickupKind[] = ['health', 'upgrade', 'power'];
