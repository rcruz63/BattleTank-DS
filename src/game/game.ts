/** Composición del juego: estado, entrada, simulación y render de la vista del jugador. */

import { ARENA_DEFAULTS } from '../config/balance';
import { PALETTE } from '../config/palette';
import { createPlayer } from '../entities/player';
import type { PlayerState } from '../entities/player';
import { drawPeriscope } from '../render/periscope';
import { createPlayerCamera } from '../render/playerCamera';
import { renderWorld } from '../render/renderer';
import { bindKeyboardInput, createInputState } from '../systems/input';
import type { InputState } from '../systems/input';
import { updatePlayerMovement } from '../systems/movement';
import { generateArena } from '../world/generate';
import type { GeneratedArena } from '../world/types';

export interface GameOptions {
  readonly seed?: number;
  /** Permite inyectar entrada en tests o en una futura pantalla de mandos. */
  readonly input?: InputState;
  /** Desactiva el teclado (tests headless). */
  readonly bindInput?: boolean;
}

export interface Game {
  readonly seed: number;
  readonly arena: GeneratedArena;
  readonly player: PlayerState;
  update(stepSeconds: number): void;
  render(context: CanvasRenderingContext2D): void;
  dispose(): void;
}

function drawTemporaryStatus(
  context: CanvasRenderingContext2D,
  seed: number,
  player: PlayerState,
): void {
  context.fillStyle = 'rgba(4, 6, 5, 0.55)';
  context.fillRect(24, 24, 360, 58);
  context.fillStyle = PALETTE.texto;
  context.font = '16px monospace';
  context.textAlign = 'left';
  context.fillText(`Semilla ${seed} · fase 4`, 36, 48);
  context.fillStyle = PALETTE.textoTenue;
  context.fillText(
    `W/S avanzar · A/D girar · vida ${Math.round(player.health)}`,
    36,
    70,
  );
}

export function createGame(options: GameOptions = {}): Game {
  const seed = options.seed ?? Date.now() >>> 0;
  const arena = generateArena({ seed, ...ARENA_DEFAULTS });
  const player = createPlayer(arena.playerSpawn);
  const input = options.input ?? createInputState();
  const unbindInput =
    options.bindInput === false ? () => undefined : bindKeyboardInput(input);

  return {
    seed,
    arena,
    player,

    update: (stepSeconds) => {
      const snapshot = input.snapshot();
      updatePlayerMovement(
        player,
        { forward: snapshot.forward, turn: snapshot.turn },
        stepSeconds,
        arena.grid,
      );
    },

    render: (context) => {
      const camera = createPlayerCamera(player.position, player.yaw);
      renderWorld(context, { grid: arena.grid, camera });
      drawPeriscope(context);
      drawTemporaryStatus(context, seed, player);
    },

    dispose: () => {
      unbindInput();
      input.clear();
    },
  };
}
