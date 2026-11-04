/**
 * Entrada de teclado y ratón.
 *
 * `createInputState` es puro y testeable; `bindKeyboardInput` y `bindMouseInput` conectan el
 * estado con el DOM. El disparo es de flanco: se consume al consultarlo.
 */

import { clamp } from '../core/math';
import { aimPointerFromCanvas } from './aim';

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
  /** Flanco de pausa (ESC). */
  readonly pause: boolean;
  /** Flanco de confirmación de pantalla (ENTER). */
  readonly confirm: boolean;
  /** Flanco de silencio (M). */
  readonly mute: boolean;
  /** -1 baja volumen, 1 sube, 0 sin cambio (− / +). */
  readonly volumeDelta: number;
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
const PAUSE_KEY = 'Escape';
const CONFIRM_KEY = 'Enter';
const MUTE_KEY = 'KeyM';
const VOLUME_DOWN_KEY = 'Minus';
const VOLUME_UP_KEY = 'Equal';

interface InputEdges {
  readonly held: Set<string>;
  fireQueued: boolean;
  pauseQueued: boolean;
  confirmQueued: boolean;
  muteQueued: boolean;
  volumeDelta: number;
  aimX: number;
  aimY: number;
}

function createEdges(): InputEdges {
  return {
    held: new Set<string>(),
    fireQueued: false,
    pauseQueued: false,
    confirmQueued: false,
    muteQueued: false,
    volumeDelta: 0,
    aimX: 0,
    aimY: 0,
  };
}

function resetEdges(edges: InputEdges): void {
  edges.held.clear();
  edges.fireQueued = false;
  edges.pauseQueued = false;
  edges.confirmQueued = false;
  edges.muteQueued = false;
  edges.volumeDelta = 0;
  edges.aimX = 0;
  edges.aimY = 0;
}

function queueOnce(
  held: ReadonlySet<string>,
  code: string,
  expected: string,
  action: () => void,
): void {
  if (code === expected && !held.has(expected)) action();
}

function press(edges: InputEdges, code: string): void {
  queueOnce(edges.held, code, FIRE_KEY, () => {
    edges.fireQueued = true;
  });
  queueOnce(edges.held, code, PAUSE_KEY, () => {
    edges.pauseQueued = true;
  });
  queueOnce(edges.held, code, CONFIRM_KEY, () => {
    edges.confirmQueued = true;
  });
  queueOnce(edges.held, code, MUTE_KEY, () => {
    edges.muteQueued = true;
  });
  queueOnce(edges.held, code, VOLUME_DOWN_KEY, () => {
    edges.volumeDelta = -1;
  });
  queueOnce(edges.held, code, VOLUME_UP_KEY, () => {
    edges.volumeDelta = 1;
  });
  edges.held.add(code);
}

function axis(
  positive: ReadonlySet<string>,
  negative: ReadonlySet<string>,
  held: ReadonlySet<string>,
): number {
  const forward = [...positive].some((key) => held.has(key)) ? 1 : 0;
  const backward = [...negative].some((key) => held.has(key)) ? 1 : 0;
  return forward - backward;
}

function takeSnapshot(edges: InputEdges): InputSnapshot {
  const snapshot: InputSnapshot = {
    forward: axis(FORWARD_KEYS, BACKWARD_KEYS, edges.held),
    turn: axis(RIGHT_KEYS, LEFT_KEYS, edges.held),
    fire: edges.fireQueued,
    aimX: edges.aimX,
    aimY: edges.aimY,
    pause: edges.pauseQueued,
    confirm: edges.confirmQueued,
    mute: edges.muteQueued,
    volumeDelta: edges.volumeDelta,
  };
  edges.fireQueued = false;
  edges.pauseQueued = false;
  edges.confirmQueued = false;
  edges.muteQueued = false;
  edges.volumeDelta = 0;
  return snapshot;
}

export function createInputState(): InputState {
  const edges = createEdges();

  return {
    snapshot: () => takeSnapshot(edges),
    handleKeyDown: (code) => press(edges, code),
    handleKeyUp: (code) => edges.held.delete(code),
    setPointer: (x, y) => {
      edges.aimX = clamp(x, -1, 1);
      edges.aimY = clamp(y, -1, 1);
    },
    requestFire: () => {
      edges.fireQueued = true;
    },
    clear: () => resetEdges(edges),
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
  'Escape',
  'Enter',
  'KeyM',
  'Minus',
  'Equal',
]);

/** Conecta el estado al teclado. Devuelve la función para desconectar. */
export function bindKeyboardInput(state: InputState, target: EventTarget = window): () => void {
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
    const offsetX = event.clientX - (rect.left + rect.width / 2);
    const offsetY = event.clientY - (rect.top + rect.height / 2);
    const pointer = aimPointerFromCanvas(offsetX, offsetY, rect.width);
    state.setPointer(pointer.x, pointer.y);
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
