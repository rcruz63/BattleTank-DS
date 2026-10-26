import './ui/styles.css';
import { ARENA_DEFAULTS } from './config/balance';
import { createFrameStepper, runAnimationLoop } from './core/loop';
import { getGameContext, VIEWPORT } from './render/canvas';
import { createPlayerCamera } from './render/playerCamera';
import { renderWorld } from './render/renderer';
import { generateArena } from './world/generate';

const context = getGameContext();

function drawDebugOverlay(seed: number, faces: number): void {
  context.fillStyle = 'rgba(0, 0, 0, 0.5)';
  context.fillRect(16, 16, 330, 66);
  context.fillStyle = '#d8d2bd';
  context.font = '16px monospace';
  context.textAlign = 'left';
  context.fillText(`Semilla ${seed} · caras ${faces}`, 28, 42);
  context.fillStyle = '#8a927f';
  context.fillText('Fase 3 · escenario procedural', 28, 64);
}

function drawError(message: string): void {
  context.fillStyle = '#050706';
  context.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);
  context.fillStyle = '#d8d2bd';
  context.font = '20px monospace';
  context.textAlign = 'center';
  context.fillText(message, VIEWPORT.width / 2, VIEWPORT.height / 2);
}

function boot(): void {
  const seed = Date.now() >>> 0;
  try {
    const arena = generateArena({ seed, ...ARENA_DEFAULTS });
    let yaw = arena.playerSpawn.yaw;

    const stepper = createFrameStepper({
      fixedStepSeconds: 1 / 60,
      maxFrameSeconds: 0.25,
      onUpdate: (stepSeconds) => {
        yaw += stepSeconds * 0.25;
      },
      onRender: () => {
        const camera = createPlayerCamera(arena.playerSpawn, yaw);
        const stats = renderWorld(context, { grid: arena.grid, camera });
        drawDebugOverlay(seed, stats.faces);
      },
    });

    runAnimationLoop(stepper);
  } catch (error) {
    drawError(error instanceof Error ? error.message : 'Error al generar el escenario.');
    throw error;
  }
}

boot();
