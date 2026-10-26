/**
 * Bucle de simulación con paso fijo e interpolación de render.
 *
 * La simulación avanza siempre en incrementos idénticos (determinismo); el render recibe el
 * factor de interpolación entre los dos últimos estados. Es independiente de requestAnimationFrame
 * para poder probarse sin navegador.
 */

export interface FrameStepperOptions {
  /** Duración de cada paso de simulación, en segundos. */
  readonly fixedStepSeconds: number;
  /** Máximo tiempo real que se acumula en un frame (protege tras pestañas en segundo plano). */
  readonly maxFrameSeconds: number;
  readonly onUpdate: (stepSeconds: number) => void;
  readonly onRender: (alpha: number, frameSeconds: number) => void;
}

export interface FrameStepper {
  /** Avanza el reloj hasta `nowMs`. Devuelve cuántos pasos de simulación se ejecutaron. */
  advance(nowMs: number): number;
  /** Fija el origen temporal (usar al arrancar o reanudar). */
  reset(nowMs: number): void;
}

export function createFrameStepper(options: FrameStepperOptions): FrameStepper {
  const { fixedStepSeconds, maxFrameSeconds, onUpdate, onRender } = options;
  let lastMs = 0;
  let accumulator = 0;

  const advance = (nowMs: number): number => {
    const elapsedMs = Math.max(0, nowMs - lastMs);
    const frameSeconds = Math.min(elapsedMs / 1000, maxFrameSeconds);
    lastMs = nowMs;
    accumulator += frameSeconds;

    let steps = 0;
    // El epsilon absorbe el redondeo binario (p. ej. 0,3 s / 0,1 s = 2,999…).
    while (accumulator >= fixedStepSeconds - 1e-9) {
      onUpdate(fixedStepSeconds);
      accumulator -= fixedStepSeconds;
      steps += 1;
    }

    onRender(accumulator / fixedStepSeconds, frameSeconds);
    return steps;
  };

  return {
    advance,
    reset: (nowMs: number) => {
      lastMs = nowMs;
      accumulator = 0;
    },
  };
}

/** Lanza el bucle contra requestAnimationFrame. Devuelve la función para detenerlo. */
export function runAnimationLoop(stepper: FrameStepper): () => void {
  let handle = 0;
  let running = true;

  const frame = (timeMs: number): void => {
    if (!running) return;
    stepper.advance(timeMs);
    handle = requestAnimationFrame(frame);
  };

  stepper.reset(performance.now());
  handle = requestAnimationFrame(frame);

  return () => {
    running = false;
    cancelAnimationFrame(handle);
  };
}
