import { describe, expect, it } from 'vitest';
import { MISSIONS } from '../../src/config/missions';
import { buildMissionParams, buildMissionRoster, missionBonus, missionSeed } from '../../src/systems/mission';

describe('campaña de misiones', () => {
  it('tiene tres misiones con dificultad creciente', () => {
    expect(MISSIONS).toHaveLength(3);
    expect(MISSIONS.map((mission) => mission.id)).toEqual([1, 2, 3]);
    expect(MISSIONS[0]?.enemies).toHaveLength(3);
    expect(MISSIONS[1]?.enemies).toHaveLength(5);
    expect(MISSIONS[2]?.enemies).toHaveLength(6);
    expect(MISSIONS[0]?.enemies.filter((type) => type === 'heavy')).toHaveLength(0);
    expect(MISSIONS[1]?.enemies.filter((type) => type === 'heavy')).toHaveLength(1);
    expect(MISSIONS[2]?.enemies.filter((type) => type === 'heavy')).toHaveLength(2);
    expect(MISSIONS[2]?.ai.damageMultiplier).toBeGreaterThan(
      MISSIONS[0]?.ai.damageMultiplier ?? 0,
    );
    expect(MISSIONS[2]?.ai.reactionSeconds).toBeLessThan(
      MISSIONS[0]?.ai.reactionSeconds ?? 0,
    );
  });

  it('genera parámetros de arena y reparte los tipos de enemigo', () => {
    const mission = MISSIONS[1];
    if (!mission) throw new Error('Falta la misión 2.');
    const params = buildMissionParams(mission, missionSeed(42, 1));
    expect(params.seed).toBe(missionSeed(42, 1));
    expect(params.enemyCount).toBe(mission.enemies.length);
    expect(params.widthCells).toBe(mission.arena.widthCells);
    expect(params.pickupCount).toBe(mission.arena.pickupCount);

    const spawns = Array.from({ length: mission.enemies.length }, (_, index) => ({
      x: index * 4,
      z: 20,
      yaw: 0,
    }));
    const roster = buildMissionRoster(mission, spawns);
    expect(roster.map((entry) => entry.type)).toEqual([...mission.enemies]);
    expect(roster[0]?.spawn.x).toBe(0);
  });

  it('calcula semillas y bonus de forma determinista', () => {
    expect(missionSeed(42, 0)).toBe(42);
    expect(missionSeed(42, 1)).not.toBe(missionSeed(42, 0));
    expect(missionSeed(42, 1)).toBe(missionSeed(42, 1));
    expect(missionBonus(100)).toBe(700);
    expect(missionBonus(0)).toBe(500);
  });
});
