import { describe, expect, it } from 'vitest';
import { AI_TUNING, AIM_LIMITS, ARMOR_ZONES } from '../../src/config/balance';
import { classifyArmorZone, zoneDamageMultiplier } from '../../src/systems/armor';

/** Dirección del proyectil que llega desde `degrees` respecto al frente del blanco (0 = de frente). */
function incomingFrom(degrees: number): { x: number; y: number; z: number } {
  const radians = (degrees * Math.PI) / 180;
  return { x: -Math.sin(radians), y: 0, z: -Math.cos(radians) };
}

describe('blindaje direccional', () => {
  it('clasifica frontal, lateral y trasero con los umbrales configurados', () => {
    expect(ARMOR_ZONES.frontMaxDegrees).toBe(60);
    expect(ARMOR_ZONES.sideMaxDegrees).toBe(120);
    expect(classifyArmorZone(0, incomingFrom(0))).toBe('front');
    expect(classifyArmorZone(0, incomingFrom(59.9))).toBe('front');
    expect(classifyArmorZone(0, incomingFrom(60))).toBe('front');
    expect(classifyArmorZone(0, incomingFrom(60.1))).toBe('side');
    expect(classifyArmorZone(0, incomingFrom(90))).toBe('side');
    expect(classifyArmorZone(0, incomingFrom(120))).toBe('side');
    expect(classifyArmorZone(0, incomingFrom(120.1))).toBe('rear');
    expect(classifyArmorZone(0, incomingFrom(180))).toBe('rear');
  });

  it('gira con el rumbo del blanco', () => {
    expect(classifyArmorZone(Math.PI, incomingFrom(180))).toBe('front');
    expect(classifyArmorZone(Math.PI / 2, incomingFrom(90))).toBe('front');
    expect(classifyArmorZone(Math.PI / 2, incomingFrom(0))).toBe('side');
    expect(classifyArmorZone(Math.PI / 2, incomingFrom(180))).toBe('side');
    expect(classifyArmorZone(Math.PI / 2, incomingFrom(270))).toBe('rear');
  });

  it('aplica ×0,5 frontal, ×1,0 lateral y ×1,5 trasero', () => {
    expect(zoneDamageMultiplier('front')).toBe(ARMOR_ZONES.frontMultiplier);
    expect(zoneDamageMultiplier('side')).toBe(ARMOR_ZONES.sideMultiplier);
    expect(zoneDamageMultiplier('rear')).toBe(ARMOR_ZONES.rearMultiplier);
    expect(ARMOR_ZONES.frontMultiplier).toBe(0.5);
    expect(ARMOR_ZONES.sideMultiplier).toBe(1);
    expect(ARMOR_ZONES.rearMultiplier).toBe(1.5);
  });

  it('el arco de fuego enemigo es simétrico al cono del jugador', () => {
    expect(AI_TUNING.fireArcDegrees).toBe(AIM_LIMITS.maxYawDegrees);
  });
});
