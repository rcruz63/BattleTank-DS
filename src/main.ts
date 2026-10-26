import './ui/styles.css';
import { createFrameStepper, runAnimationLoop } from './core/loop';
import { createGame } from './game/game';
import { getGameContext, VIEWPORT } from './render/canvas';

/** Semilla reproducible vía `?seed=123` para depurar escenarios concretos. */
function seedFromUrl(): number | undefined {
  const raw = new URLSearchParams(window.location.search).get('seed');
  if (!raw) return undefined;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed >>> 0 : undefined;
}

function drawFatalError(context: CanvasRenderingContext2D, message: string): void {
  context.fillStyle = '#050706';
  context.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);
  context.fillStyle = '#d8d2bd';
  context.font = '20px monospace';
  context.textAlign = 'center';
  context.fillText(message, VIEWPORT.width / 2, VIEWPORT.height / 2);
}

function boot(): void {
  const context = getGameContext();

  try {
    const game = createGame({ seed: seedFromUrl() });
    // Gancho de depuración/QA: inspeccionar o recolocar el estado desde la consola.
    window.__BT__ = game;

    const stepper = createFrameStepper({
      fixedStepSeconds: 1 / 60,
      maxFrameSeconds: 0.25,
      onUpdate: (stepSeconds) => game.update(stepSeconds),
      onRender: () => game.render(context),
    });

    const stop = runAnimationLoop(stepper);
    window.addEventListener('beforeunload', () => {
      stop();
      game.dispose();
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al iniciar el juego.';
    drawFatalError(context, message);
    throw error;
  }
}

boot();
