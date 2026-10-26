/** Bus de eventos tipado y minúsculo para desacoplar sistemas (audio, HUD, puntuación). */

export type EventMap = object;
export type EventListener<Payload> = (payload: Payload) => void;

export interface EventBus<Events extends EventMap> {
  /** Suscribe un oyente. Devuelve la función para darse de baja. */
  on<Key extends keyof Events & string>(
    type: Key,
    listener: EventListener<Events[Key]>,
  ): () => void;
  emit<Key extends keyof Events & string>(type: Key, payload: Events[Key]): void;
  clear(): void;
  listenerCount(type: keyof Events & string): number;
}

export function createEventBus<Events extends EventMap>(): EventBus<Events> {
  const listeners = new Map<string, Set<EventListener<unknown>>>();

  return {
    on: (type, listener) => {
      const bucket = listeners.get(type) ?? new Set<EventListener<unknown>>();
      bucket.add(listener as EventListener<unknown>);
      listeners.set(type, bucket);
      return () => {
        bucket.delete(listener as EventListener<unknown>);
      };
    },
    emit: (type, payload) => {
      const bucket = listeners.get(type);
      if (!bucket) return;
      // Copia para permitir bajas durante la emisión.
      for (const listener of [...bucket]) listener(payload);
    },
    clear: () => listeners.clear(),
    listenerCount: (type) => listeners.get(type)?.size ?? 0,
  };
}
