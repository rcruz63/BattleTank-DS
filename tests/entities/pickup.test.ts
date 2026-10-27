import { describe, expect, it } from 'vitest';
import { createPickups } from '../../src/entities/pickup';

describe('entidad pickup', () => {
  it('crea un pickup por spawn con id estable y los tres tipos rotando', () => {
    const pickups = createPickups([
      { x: 1, z: 2 },
      { x: 3, z: 4 },
      { x: 5, z: 6 },
      { x: 7, z: 8 },
    ]);

    expect(pickups).toHaveLength(4);
    expect(pickups.map((pickup) => pickup.kind)).toEqual(['health', 'upgrade', 'power', 'health']);
    expect(pickups[0]).toEqual({
      id: 'pickup-1',
      kind: 'health',
      position: { x: 1, z: 2 },
      collected: false,
    });
    expect(pickups.every((pickup) => !pickup.collected)).toBe(true);
  });

  it('no comparte la posición con el spawn de origen', () => {
    const spawn = { x: 4, z: 8 };
    const [pickup] = createPickups([spawn]);
    expect(pickup?.position).toEqual(spawn);
    expect(pickup?.position).not.toBe(spawn);
  });
});
