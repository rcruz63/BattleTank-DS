import { describe, expect, it, vi } from 'vitest';
import { createEventBus } from '../../src/core/events';

interface TestEvents {
  disparo: { damage: number };
  muerte: { id: string };
}

describe('bus de eventos', () => {
  it('emite a los oyentes suscritos', () => {
    const bus = createEventBus<TestEvents>();
    const listener = vi.fn();
    bus.on('disparo', listener);
    bus.emit('disparo', { damage: 40 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ damage: 40 });
  });

  it('no mezcla tipos de evento', () => {
    const bus = createEventBus<TestEvents>();
    const shots = vi.fn();
    const deaths = vi.fn();
    bus.on('disparo', shots);
    bus.on('muerte', deaths);
    bus.emit('muerte', { id: 'panzer-1' });
    expect(shots).not.toHaveBeenCalled();
    expect(deaths).toHaveBeenCalledWith({ id: 'panzer-1' });
  });

  it('permite darse de baja', () => {
    const bus = createEventBus<TestEvents>();
    const listener = vi.fn();
    const unsubscribe = bus.on('disparo', listener);
    unsubscribe();
    bus.emit('disparo', { damage: 10 });
    expect(listener).not.toHaveBeenCalled();
    expect(bus.listenerCount('disparo')).toBe(0);
  });

  it('soporta bajas durante la emisión sin saltarse oyentes', () => {
    const bus = createEventBus<TestEvents>();
    const second = vi.fn();
    const unsubscribeFirst = bus.on('disparo', () => unsubscribeFirst());
    bus.on('disparo', second);
    bus.emit('disparo', { damage: 1 });
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('clear elimina todas las suscripciones', () => {
    const bus = createEventBus<TestEvents>();
    bus.on('disparo', vi.fn());
    bus.on('muerte', vi.fn());
    bus.clear();
    expect(bus.listenerCount('disparo')).toBe(0);
    expect(bus.listenerCount('muerte')).toBe(0);
  });
});
