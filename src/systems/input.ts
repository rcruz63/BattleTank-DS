/**
 * Entrada de teclado.
 *
 * `createInputState` es puro y testeable; `bindKeyboardInput` conecta el estado con el DOM. El
 * disparo es de flanco: se consume al consultarlo para que un solo toque no dispare en bucle.
 */

export interface InputSnapshot {
  /** -1 (atrás) .. 1 (adelante). */
  readonly forward: number;
  /** -1 (izquierda) .. 1 (derecha). */
  readonly turn: number;
  /** Flanco de disparo; solo es true en la primera consulta tras pulsar. */
  readonly fire: boolean;
}

export interface InputState {
  snapshot(): InputSnapshot;
  handleKeyDown(code: string): void;
  handleKeyUp(code: string): void;
  clear(): void;
}

const FORWARD_KEYS = new Set(['KeyW', 'ArrowUp']);
const BACKWARD_KEYS = new Set(['KeyS', 'ArrowDown']);
const LEFT_KEYS = new Set(['KeyA', 'ArrowLeft']);
const RIGHT_KEYS = new Set(['KeyD', 'ArrowRight']);
const FIRE_KEY = 'Space';

function axis(positive: ReadonlySet<string>, negative: ReadonlySet<string>, held: ReadonlySet<string>): number {
  const forward = [...positive].some((key) => held.has(key)) ? 1 : 0;
  const backward = [...negative].some((key) => held.has(key)) ? 1 : 0;
  return forward - backward;
}

export function createInputState(): InputState {
  const held = new Set<string>();
  let fireQueued = false;

  return {
    snapshot: () => {
      const snapshot: InputSnapshot = {
        forward: axis(FORWARD_KEYS, BACKWARD_KEYS, held),
        turn: axis(RIGHT_KEYS, LEFT_KEYS, held),
        fire: fireQueued,
      };
      fireQueued = false;
      return snapshot;
    },
    handleKeyDown: (code) => {
      if (code === FIRE_KEY && !held.has(FIRE_KEY)) fireQueued = true;
      held.add(code);
    },
    handleKeyUp: (code) => {
      held.delete(code);
    },
    clear: () => {
      held.clear();
      fireQueued = false;
    },
  };
}

const GAME_KEYS = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Space',
]);

/** Conecta el estado al teclado. Devuelve la función para desconectar. */
export function bindKeyboardInput(
  state: InputState,
  target: EventTarget = window,
): () => void {
  const onKeyDown = (event: Event): void => {
    const keyboardEvent = event as KeyboardEvent;
    if (!GAME_KEYS.has(keyboardEvent.code)) return;
    keyboardEvent.preventDefault();
    state.handleKeyDown(keyboardEvent.code);
  };

  const onKeyUp = (event: Event): void => {
    const keyboardEvent = event as KeyboardEvent;
    if (!GAME_KEYS.has(keyboardEvent.code)) return;
    keyboardEvent.preventDefault();
    state.handleKeyUp(keyboardEvent.code);
  };

  const onBlur = (): void => state.clear();

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);
  target.addEventListener('blur', onBlur);

  return () => {
    target.removeEventListener('keydown', onKeyDown);
    target.removeEventListener('keyup', onKeyUp);
    target.removeEventListener('blur', onBlur);
  };
}
