/** Composición del juego: estado, entrada, puntería, IA, combate, pickups y render del periscopio. */

import { ARENA_DEFAULTS, COMBAT, VIEWPORT } from '../config/balance';
import { PALETTE } from '../config/palette';
import { PICKUP_COLORS } from '../config/pickups';
import { createRng } from '../core/rng';
import type { Rng } from '../core/rng';
import type { Bullet } from '../entities/bullet';
import { createEnemy } from '../entities/enemy';
import type { EnemyState, EnemyType } from '../entities/enemy';
import { createPickups } from '../entities/pickup';
import type { PickupState } from '../entities/pickup';
import { createPlayer, playerForward } from '../entities/player';
import type { PlayerState } from '../entities/player';
import { overlayTint } from '../render/canvas';
import { drawPeriscope } from '../render/periscope';
import type { PeriscopeState } from '../render/periscope';
import { createPlayerCamera } from '../render/playerCamera';
import { renderWorld } from '../render/renderer';
import {
  drawDestroyedOverlay,
  drawPickupNotice,
  drawTemporaryStatus,
} from '../render/statusOverlay';
import type { PerspectiveCamera } from '../render/types';
import { resolveAim } from '../systems/aim';
import type { ResolvedAim } from '../systems/aim';
import { alertEnemiesNear, updateEnemies } from '../systems/ai';
import {
  buildProjectileTargets,
  isWeaponReady,
  reloadProgress,
  updatePlayerWeapon,
  updateProjectiles,
} from '../systems/combat';
import { applyProjectileHit } from '../systems/damage';
import { createInputState } from '../systems/input';
import type { InputState } from '../systems/input';
import {
  collectPickups,
  createLootState,
  damageMultiplier,
  pickupEffectText,
  reloadMultiplier,
  updateLoot,
} from '../systems/loot';
import type { LootState } from '../systems/loot';
import { updatePlayerMovement } from '../systems/movement';
import { generateArena } from '../world/generate';
import type { GeneratedArena, SpawnPoint } from '../world/types';

export interface GameOptions {
  readonly seed?: number;
  /** Permite inyectar entrada en tests o en una futura pantalla de mandos. */
  readonly input?: InputState;
}

export interface Game {
  readonly seed: number;
  readonly arena: GeneratedArena;
  readonly player: PlayerState;
  readonly enemies: readonly EnemyState[];
  readonly pickups: readonly PickupState[];
  readonly loot: LootState;
  readonly bullets: readonly Bullet[];
  update(stepSeconds: number): void;
  render(context: CanvasRenderingContext2D): void;
  dispose(): void;
}

interface EffectsState {
  recoil: number;
  hitMarker: number;
  damageFlash: number;
  pickupFlash: number;
  pickupNotice: string;
  pickupColor: string;
}

interface GameState {
  readonly seed: number;
  readonly arena: GeneratedArena;
  readonly player: PlayerState;
  readonly enemies: EnemyState[];
  readonly pickups: PickupState[];
  readonly loot: LootState;
  readonly input: InputState;
  readonly bullets: Bullet[];
  readonly aiRng: Rng;
  readonly effects: EffectsState;
  aim: ResolvedAim;
}

const FIRE_ALERT_RADIUS = 60;

function createEffects(): EffectsState {
  return {
    recoil: 0,
    hitMarker: 0,
    damageFlash: 0,
    pickupFlash: 0,
    pickupNotice: '',
    pickupColor: PALETTE.texto,
  };
}

function decayEffects(effects: EffectsState, stepSeconds: number): void {
  effects.recoil = Math.max(0, effects.recoil - stepSeconds * 4.5);
  effects.hitMarker = Math.max(0, effects.hitMarker - stepSeconds * 5);
  effects.damageFlash = Math.max(0, effects.damageFlash - stepSeconds * 2.5);
  effects.pickupFlash = Math.max(0, effects.pickupFlash - stepSeconds * 0.8);
}

/** Reparto provisional de tipos; las misiones (fase 9) darán el reparto exacto. */
function buildEnemyRoster(spawns: readonly SpawnPoint[]): EnemyState[] {
  const heavyCount = Math.max(0, spawns.length - 3);
  return spawns.map((spawn, index) => {
    const type: EnemyType = index >= spawns.length - heavyCount ? 'heavy' : 'light';
    return createEnemy(`enemigo-${index + 1}`, type, spawn);
  });
}

/** Recoge los pickups al alcance y prepara el aviso flotante del último recogido. */
function collectLoot(state: GameState): void {
  const collected = collectPickups(state.player, state.loot, state.pickups);
  const last = collected[collected.length - 1];
  if (!last) return;

  state.effects.pickupNotice = pickupEffectText(last.kind, state.loot);
  state.effects.pickupColor = PICKUP_COLORS[last.kind];
  state.effects.pickupFlash = 1;
}

function stepCombat(state: GameState, stepSeconds: number): void {
  const { player, enemies, arena, bullets, effects, input, aiRng, loot } = state;
  const snapshot = input.snapshot();

  if (player.alive) {
    updatePlayerMovement({
      player,
      command: { forward: snapshot.forward, turn: snapshot.turn },
      stepSeconds,
      grid: arena.grid,
      enemies,
    });

    state.aim = resolveAim(player.yaw, VIEWPORT, {
      x: snapshot.aimX,
      y: snapshot.aimY,
    });

    const fired = updatePlayerWeapon({
      player,
      fireRequested: snapshot.fire,
      stepSeconds,
      bullets,
      direction: state.aim.direction,
      damageMultiplier: damageMultiplier(loot),
      reloadMultiplier: reloadMultiplier(loot),
    });
    if (fired) {
      effects.recoil = 1;
      alertEnemiesNear(enemies, player.position, FIRE_ALERT_RADIUS);
    }
  }

  updateLoot(loot, stepSeconds);
  collectLoot(state);

  updateEnemies(enemies, {
    grid: arena.grid,
    player,
    stepSeconds,
    rng: aiRng,
    bullets,
  });

  const impacts = updateProjectiles({
    bullets,
    stepSeconds,
    grid: arena.grid,
    targets: buildProjectileTargets(player, enemies),
  });

  let playerHit = false;
  for (const impact of impacts) {
    if (applyProjectileHit(impact, { player, enemies, loot })) playerHit = true;
  }
  if (impacts.some((impact) => impact.kind !== 'ground')) effects.hitMarker = 1;
  if (playerHit) effects.damageFlash = 1;

  decayEffects(effects, stepSeconds);
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

function renderGame(state: GameState, context: CanvasRenderingContext2D): void {
  const { player, arena, bullets, enemies, pickups, loot, effects, seed, aim } = state;
  const baseCamera = createPlayerCamera(player.position, player.yaw);
  const camera = cameraWithRecoil(baseCamera, player, effects.recoil);
  renderWorld(context, { grid: arena.grid, camera, bullets, enemies, pickups });

  const periscopeState: PeriscopeState = {
    reloadProgress: reloadProgress(player),
    reloadRemaining: player.reloadRemaining,
    ready: isWeaponReady(player),
    hitMarker: effects.hitMarker,
    aimScreenX: aim.screenX,
    aimScreenY: aim.screenY,
  };
  drawPeriscope(context, VIEWPORT, periscopeState);

  if (effects.damageFlash > 0) {
    overlayTint(context, PALETTE.destelloDano, 0.28 * effects.damageFlash);
  }
  drawPickupNotice(context, {
    text: effects.pickupNotice,
    color: effects.pickupColor,
    alpha: effects.pickupFlash,
  });
  if (!player.alive) drawDestroyedOverlay(context);

  drawTemporaryStatus(context, {
    seed,
    player,
    enemies,
    bulletCount: bullets.length,
    loot,
  });
}

function createGameState(options: GameOptions): GameState {
  const seed = options.seed ?? Date.now() >>> 0;
  const arena = generateArena({ seed, ...ARENA_DEFAULTS });

  return {
    seed,
    arena,
    player: createPlayer(arena.playerSpawn),
    enemies: buildEnemyRoster(arena.enemySpawns),
    pickups: createPickups(arena.pickupSpawns),
    loot: createLootState(),
    input: options.input ?? createInputState(),
    bullets: [],
    aiRng: createRng((seed ^ 0x9e3779b9) >>> 0),
    effects: createEffects(),
    aim: resolveAim(arena.playerSpawn.yaw, VIEWPORT, { x: 0, y: 0 }),
  };
}

export function createGame(options: GameOptions = {}): Game {
  const state = createGameState(options);

  return {
    seed: state.seed,
    arena: state.arena,
    player: state.player,
    enemies: state.enemies,
    pickups: state.pickups,
    loot: state.loot,
    bullets: state.bullets,

    update: (stepSeconds) => stepCombat(state, stepSeconds),
    render: (context) => renderGame(state, context),

    dispose: () => {
      state.input.clear();
    },
  };
}
