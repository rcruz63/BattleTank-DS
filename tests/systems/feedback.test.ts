import { describe, expect, it } from 'vitest';
import { createPlayer } from '../../src/entities/player';
import type { ProjectileEvent } from '../../src/systems/combat';
import type { DamageResult } from '../../src/systems/damage';
import { impactBearing, isHitMarker } from '../../src/systems/feedback';

function event(overrides: Partial<ProjectileEvent> = {}): ProjectileEvent {
  return {
    kind: 'target',
    position: { x: 0, y: 1, z: 0 },
    cell: null,
    material: null,
    destroyedCover: false,
    targetId: 'player',
    damage: 10,
    owner: 'enemy',
    zone: 'front',
    ...overrides,
  };
}

function result(overrides: Partial<DamageResult> = {}): DamageResult {
  return {
    playerHit: true,
    target: 'player',
    targetId: 'player',
    damage: 10,
    zone: 'front',
    killed: false,
    ...overrides,
  };
}

describe('marca de impacto', () => {
  it('no aparece cuando el jugador recibe daño', () => {
    expect(isHitMarker(event(), result())).toBe(false);
  });

  it('no aparece al golpear una cobertura', () => {
    const cover = event({ kind: 'cover', targetId: null, owner: 'player' });
    const none = result({ playerHit: false, target: null, targetId: null, damage: 0 });
    expect(isHitMarker(cover, none)).toBe(false);
  });

  it('aparece solo cuando el proyectil del jugador daña a un enemigo', () => {
    const hit = event({ owner: 'player', targetId: 'enemigo-1' });
    const enemyHit = result({
      playerHit: false,
      target: 'enemy',
      targetId: 'enemigo-1',
      damage: 20,
    });
    expect(isHitMarker(hit, enemyHit)).toBe(true);
    expect(isHitMarker(hit, { ...enemyHit, damage: 0 })).toBe(false);
  });
});

describe('dirección del daño recibido', () => {
  const player = createPlayer({ x: 10, z: 10, yaw: 0 });

  it('sitúa el impacto al frente, a la derecha y detrás respecto al rumbo', () => {
    expect(impactBearing(player, { x: 10, z: 20 })).toBeCloseTo(0, 9);
    expect(impactBearing(player, { x: 20, z: 10 })).toBeCloseTo(Math.PI / 2, 9);
    expect(impactBearing(player, { x: 10, z: 0 })).toBeCloseTo(Math.PI, 9);
  });

  it('devuelve el rumbo absoluto del impacto con independencia del rumbo del tanque', () => {
    const turned = createPlayer({ x: 10, z: 10, yaw: Math.PI / 2 });
    expect(impactBearing(turned, { x: 10, z: 20 })).toBeCloseTo(0, 9);
  });
});
