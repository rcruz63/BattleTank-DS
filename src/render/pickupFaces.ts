/**
 * Modelos de pickups: caja con marca de suelo e icono flotante por tipo.
 *
 * La geometría es procedural (cajas planas) y estática; no anima ni muta el estado. El painter
 * ordena estas caras con las coberturas y los tanques, así que también quedan ocultos tras muros.
 */

import { PALETTE } from '../config/palette';
import { PICKUP_COLORS } from '../config/pickups';
import type { PickupKind } from '../config/pickups';
import type { PickupState } from '../entities/pickup';
import type { Vec3 } from '../core/math';
import { boxFaces } from './boxes';
import type { WorldFace } from './faces';

interface BoxAt {
  readonly center: Vec3;
  readonly size: Vec3;
  readonly color: string;
  readonly yaw?: number;
}

function boxAt(spec: BoxAt): WorldFace[] {
  return boxFaces({
    center: spec.center,
    size: spec.size,
    yaw: spec.yaw ?? 0,
    color: spec.color,
  });
}

/** Icono de cruz 3D: se lee desde cualquier ángulo del periscopio. */
function crossFaces(position: PickupState['position']): WorldFace[] {
  const y = 1.25;
  const color = PALETTE.texto;
  return [
    ...boxAt({
      center: { x: position.x, y, z: position.z },
      size: { x: 0.68, y: 0.18, z: 0.18 },
      color,
    }),
    ...boxAt({
      center: { x: position.x, y, z: position.z },
      size: { x: 0.18, y: 0.18, z: 0.68 },
      color,
    }),
    ...boxAt({
      center: { x: position.x, y, z: position.z },
      size: { x: 0.18, y: 0.68, z: 0.18 },
      color,
    }),
  ];
}

/** Tres chevrones ascendentes (barras que se estrechan) en el color de la mejora. */
function chevronFaces(position: PickupState['position']): WorldFace[] {
  const color = PICKUP_COLORS.upgrade;
  return [0, 1, 2].flatMap((index) =>
    boxAt({
      center: { x: position.x, y: 1.02 + index * 0.2, z: position.z },
      size: { x: 0.62 - index * 0.14, y: 0.12, z: 0.16 },
      color,
    }),
  );
}

/** Rayo amarillo en zigzag de tres tramos. */
function boltFaces(position: PickupState['position']): WorldFace[] {
  const color = PICKUP_COLORS.power;
  return [
    ...boxAt({
      center: { x: position.x - 0.12, y: 1.02, z: position.z },
      size: { x: 0.16, y: 0.34, z: 0.16 },
      color,
      yaw: Math.PI / 6,
    }),
    ...boxAt({
      center: { x: position.x + 0.08, y: 1.28, z: position.z },
      size: { x: 0.16, y: 0.32, z: 0.16 },
      color,
      yaw: -Math.PI / 6,
    }),
    ...boxAt({
      center: { x: position.x - 0.02, y: 1.52, z: position.z },
      size: { x: 0.14, y: 0.28, z: 0.14 },
      color,
      yaw: Math.PI / 5,
    }),
  ];
}

function iconFaces(kind: PickupKind, position: PickupState['position']): WorldFace[] {
  switch (kind) {
    case 'health':
      return crossFaces(position);
    case 'upgrade':
      return chevronFaces(position);
    case 'power':
      return boltFaces(position);
  }
}

/** Caras del pickup (caja, marca de suelo e icono flotante). Vacío si ya se recogió. */
export function pickupWorldFaces(pickup: PickupState): WorldFace[] {
  if (pickup.collected) return [];

  const { position, kind } = pickup;
  const color = PICKUP_COLORS[kind];

  return [
    ...boxAt({
      center: { x: position.x, y: 0.02, z: position.z },
      size: { x: 1.25, y: 0.04, z: 1.25 },
      color,
    }),
    ...boxAt({
      center: { x: position.x, y: 0.32, z: position.z },
      size: { x: 0.9, y: 0.6, z: 0.9 },
      color,
    }),
    ...boxAt({
      center: { x: position.x, y: 0.64, z: position.z },
      size: { x: 0.96, y: 0.07, z: 0.96 },
      color: PALETTE.texto,
    }),
    ...iconFaces(kind, position),
  ];
}
