/**
 * Blindaje direccional: clasificación de la zona de impacto y multiplicador de daño.
 *
 * La zona se mide respecto al rumbo del blanco y se aplica **después** del blindaje base y de las
 * mejoras. Es simétrica: el mismo cálculo sirve para el jugador y para los enemigos.
 */

import { ARMOR_ZONES } from '../config/balance';
import { angleDifference, degreesToRadians } from '../core/math';
import type { Vec3 } from '../core/math';

export type ArmorZone = 'front' | 'side' | 'rear';

/** Tolerancia angular para que los umbrales exactos (±60° y 120°) cuenten como inclusivos. */
const BOUNDARY_EPSILON = 1e-6;

/**
 * Zona del impacto respecto al rumbo del blanco.
 *
 * Se mide desde el blanco hacia el origen del disparo (dirección contraria al proyectil): un tiro
 * que llega de frente es «front» aunque el vector de avance del proyectil apunte al blanco.
 */
export function classifyArmorZone(targetYaw: number, impactDirection: Vec3): ArmorZone {
  const shooterAngle = Math.atan2(-impactDirection.x, -impactDirection.z);
  const bearing = Math.abs(angleDifference(targetYaw, shooterAngle));
  if (bearing <= degreesToRadians(ARMOR_ZONES.frontMaxDegrees) + BOUNDARY_EPSILON) {
    return 'front';
  }
  if (bearing <= degreesToRadians(ARMOR_ZONES.sideMaxDegrees) + BOUNDARY_EPSILON) {
    return 'side';
  }
  return 'rear';
}

/** Multiplicador de daño de la zona; los valores viven en `config/balance.ts`. */
export function zoneDamageMultiplier(zone: ArmorZone): number {
  switch (zone) {
    case 'front':
      return ARMOR_ZONES.frontMultiplier;
    case 'side':
      return ARMOR_ZONES.sideMultiplier;
    case 'rear':
      return ARMOR_ZONES.rearMultiplier;
  }
}
