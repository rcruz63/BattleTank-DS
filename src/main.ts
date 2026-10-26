import './ui/styles.css';
import { createFrameStepper, runAnimationLoop } from './core/loop';
import { createGame } from './game/game';
import { getGameContext, VIEWPORT } from './render/canvas';

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
    const game = createGame();

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
