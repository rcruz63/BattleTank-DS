/** Pickup del escenario: estado puro. Las reglas de recogida y efecto viven en `systems/loot.ts`. */

import { PICKUP_SPAWN_KINDS } from '../config/pickups';
import type { PickupKind } from '../config/pickups';
import type { WorldPoint } from '../world/types';

export interface PickupState {
  readonly id: string;
  readonly kind: PickupKind;
  readonly position: WorldPoint;
  collected: boolean;
}

/** Crea un pickup por spawn, repartiendo los tipos en orden determinista. */
export function createPickups(spawns: readonly WorldPoint[]): PickupState[] {
  return spawns.map((spawn, index) => ({
    id: `pickup-${index + 1}`,
    kind: PICKUP_SPAWN_KINDS[index % PICKUP_SPAWN_KINDS.length] ?? 'health',
    position: { x: spawn.x, z: spawn.z },
    collected: false,
  }));
}
