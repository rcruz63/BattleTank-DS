/**
 * Entrada de teclado y ratón.
 *
 * `createInputState` es puro y testeable; `bindKeyboardInput` y `bindMouseInput` conectan el
 * estado con el DOM. El disparo es de flanco: se consume al consultarlo.
 */

import { clamp } from '../core/math';

export interface InputSnapshot {
  /** -1 (atrás) .. 1 (adelante). */
  readonly forward: number;
  /** -1 (izquierda) .. 1 (derecha). */
  readonly turn: number;
  /** Flanco de disparo; solo es true en la primera consulta tras pulsar. */
  readonly fire: boolean;
  /** Puntero normalizado: -1 (izquierda) .. 1 (derecha). */
  readonly aimX: number;
  /** Puntero normalizado: -1 (abajo) .. 1 (arriba). */
  readonly aimY: number;
}

export interface InputState {
  snapshot(): InputSnapshot;
  handleKeyDown(code: string): void;
  handleKeyUp(code: string): void;
  setPointer(x: number, y: number): void;
  requestFire(): void;
  clear(): void;
}

const FORWARD_KEYS = new Set(['KeyW', 'ArrowUp']);
const BACKWARD_KEYS = new Set(['KeyS', 'ArrowDown']);
const LEFT_KEYS = new Set(['KeyA', 'ArrowLeft']);
const RIGHT_KEYS = new Set(['KeyD', 'ArrowRight']);
const FIRE_KEY = 'Space';

function axis(
  positive: ReadonlySet<string>,
  negative: ReadonlySet<string>,
  held: ReadonlySet<string>,
): number {
  const forward = [...positive].some((key) => held.has(key)) ? 1 : 0;
  const backward = [...negative].some((key) => held.has(key)) ? 1 : 0;
  return forward - backward;
}

export function createInputState(): InputState {
  const held = new Set<string>();
  let fireQueued = false;
  let aimX = 0;
  let aimY = 0;

  return {
    snapshot: () => {
      const snapshot: InputSnapshot = {
        forward: axis(FORWARD_KEYS, BACKWARD_KEYS, held),
        turn: axis(RIGHT_KEYS, LEFT_KEYS, held),
        fire: fireQueued,
        aimX,
        aimY,
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
    setPointer: (x, y) => {
      aimX = clamp(x, -1, 1);
      aimY = clamp(y, -1, 1);
    },
    requestFire: () => {
      fireQueued = true;
    },
    clear: () => {
      held.clear();
      fireQueued = false;
      aimX = 0;
      aimY = 0;
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

/** Conecta la posición del ratón y el clic izquierdo al estado de entrada. */
export function bindMouseInput(state: InputState, canvas: HTMLCanvasElement): () => void {
  const onPointerMove = (event: PointerEvent): void => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = 1 - ((event.clientY - rect.top) / rect.height) * 2;
    state.setPointer(x, y);
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    event.preventDefault();
    state.requestFire();
  };

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);

  return () => {
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerdown', onPointerDown);
  };
}
