/** Composición del juego: estado, entrada, simulación de combate y render del periscopio. */

import { ARENA_DEFAULTS, COMBAT, VIEWPORT } from '../config/balance';
import { PALETTE } from '../config/palette';
import type { Bullet } from '../entities/bullet';
import { createPlayer, playerForward } from '../entities/player';
import type { PlayerState } from '../entities/player';
import type { PerspectiveCamera } from '../render/types';
import { drawPeriscope } from '../render/periscope';
import type { PeriscopeState } from '../render/periscope';
import { createPlayerCamera } from '../render/playerCamera';
import { renderWorld } from '../render/renderer';
import {
  isWeaponReady,
  reloadProgress,
  updatePlayerWeapon,
  updateProjectiles,
} from '../systems/combat';
import type { ProjectileTarget } from '../systems/combat';
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
  readonly bullets: readonly Bullet[];
  update(stepSeconds: number): void;
  render(context: CanvasRenderingContext2D): void;
  dispose(): void;
}

interface EffectsState {
  recoil: number;
  muzzleFlash: number;
  hitMarker: number;
}

function createEffects(): EffectsState {
  return { recoil: 0, muzzleFlash: 0, hitMarker: 0 };
}

function decayEffects(effects: EffectsState, stepSeconds: number): void {
  effects.recoil = Math.max(0, effects.recoil - stepSeconds * 4.5);
  effects.muzzleFlash = Math.max(0, effects.muzzleFlash - stepSeconds * 7);
  effects.hitMarker = Math.max(0, effects.hitMarker - stepSeconds * 5);
}

/** Retroceso de cámara al disparar: sube el pitch y empuja la vista hacia atrás. */
function cameraWithRecoil(
  camera: PerspectiveCamera,
  player: PlayerState,
  recoil: number,
): PerspectiveCamera {
  if (recoil <= 0) return camera;
  const forward = playerForward(player);
  return {
    ...camera,
    pitch: camera.pitch + COMBAT.recoilKickRadians * recoil,
    position: {
      x: camera.position.x - forward.x * 0.1 * recoil,
      y: camera.position.y,
      z: camera.position.z - forward.z * 0.1 * recoil,
    },
  };
}

function drawTemporaryStatus(
  context: CanvasRenderingContext2D,
  seed: number,
  player: PlayerState,
  bulletCount: number,
): void {
  context.fillStyle = 'rgba(4, 6, 5, 0.55)';
  context.fillRect(24, 24, 390, 58);
  context.fillStyle = PALETTE.texto;
  context.font = '16px monospace';
  context.textAlign = 'left';
  context.fillText(`Semilla ${seed} · fase 5 · proyectiles ${bulletCount}`, 36, 48);
  context.fillStyle = PALETTE.textoTenue;
  const reload =
    player.reloadRemaining > 0 ? `recargando ${player.reloadRemaining.toFixed(1)} s` : 'lista';
  context.fillText(`W/S · A/D · ESPACIO · recarga ${reload}`, 36, 70);
}

export function createGame(options: GameOptions = {}): Game {
  const seed = options.seed ?? Date.now() >>> 0;
  const arena = generateArena({ seed, ...ARENA_DEFAULTS });
  const player = createPlayer(arena.playerSpawn);
  const input = options.input ?? createInputState();
  const bullets: Bullet[] = [];
  // La IA (fase 6) rellenará esta lista con los tanques enemigos.
  const targets: readonly ProjectileTarget[] = [];
  const effects = createEffects();
  const unbindInput =
    options.bindInput === false ? () => undefined : bindKeyboardInput(input);

  return {
    seed,
    arena,
    player,
    bullets,

    update: (stepSeconds) => {
      const snapshot = input.snapshot();
      updatePlayerMovement(
        player,
        { forward: snapshot.forward, turn: snapshot.turn },
        stepSeconds,
        arena.grid,
      );

      if (updatePlayerWeapon(player, snapshot.fire, stepSeconds, bullets)) {
        effects.recoil = 1;
        effects.muzzleFlash = 1;
      }

      const impacts = updateProjectiles({
        bullets,
        stepSeconds,
        grid: arena.grid,
        targets,
      });
      if (impacts.length > 0) effects.hitMarker = 1;

      decayEffects(effects, stepSeconds);
    },

    render: (context) => {
      const baseCamera = createPlayerCamera(player.position, player.yaw);
      const camera = cameraWithRecoil(baseCamera, player, effects.recoil);
      renderWorld(context, { grid: arena.grid, camera, bullets });

      const periscopeState: PeriscopeState = {
        reloadProgress: reloadProgress(player),
        reloadRemaining: player.reloadRemaining,
        ready: isWeaponReady(player),
        muzzleFlash: effects.muzzleFlash,
        hitMarker: effects.hitMarker,
      };
      drawPeriscope(context, VIEWPORT, periscopeState);
      drawTemporaryStatus(context, seed, player, bullets.length);
    },

    dispose: () => {
      unbindInput();
      input.clear();
    },
  };
}
