import { describe, expect, it } from 'vitest';
import { createEnemy } from '../../src/entities/enemy';
import { enemyReloadFraction } from '../../src/render/combatFeedback';

function lightEnemy() {
  return createEnemy('enemigo-1', 'light', { x: 10, z: 10, yaw: 0 });
}

describe('barra de recarga enemiga', () => {
  it('marca el arma lista con fracción 1', () => {
    const enemy = lightEnemy();
    enemy.reloadRemaining = 0;
    expect(enemyReloadFraction(enemy)).toBe(1);
  });

  it('progresa de 0 a 1 durante la recarga', () => {
    const enemy = lightEnemy();
    enemy.reloadRemaining = enemy.reloadSeconds;
    expect(enemyReloadFraction(enemy)).toBeCloseTo(0, 9);
    enemy.reloadRemaining = enemy.reloadSeconds / 2;
    expect(enemyReloadFraction(enemy)).toBeCloseTo(0.5, 9);
  });

  it('se limita al rango 0..1', () => {
    const enemy = lightEnemy();
    enemy.reloadRemaining = -1;
    expect(enemyReloadFraction(enemy)).toBe(1);
    enemy.reloadRemaining = enemy.reloadSeconds * 2;
    expect(enemyReloadFraction(enemy)).toBe(0);
  });
});
