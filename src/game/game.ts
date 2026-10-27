/** Composición del juego: estado, entrada, puntería, IA, combate y render del periscopio. */

import {
  ARENA_DEFAULTS,
  COMBAT,
  TANK_TARGET_HEIGHT,
  VIEWPORT,
} from '../config/balance';
import { PALETTE } from '../config/palette';
import { createRng } from '../core/rng';
import type { Rng } from '../core/rng';
import type { Bullet } from '../entities/bullet';
import { createEnemy } from '../entities/enemy';
import type { EnemyState, EnemyType } from '../entities/enemy';
import { createPlayer, playerForward } from '../entities/player';
import type { PlayerState } from '../entities/player';
import { drawPeriscope } from '../render/periscope';
import type { PeriscopeState } from '../render/periscope';
import { createPlayerCamera } from '../render/playerCamera';
import { renderWorld } from '../render/renderer';
import { overlayTint } from '../render/canvas';
import type { PerspectiveCamera } from '../render/types';
import { resolveAim } from '../systems/aim';
import type { ResolvedAim } from '../systems/aim';
import { alertEnemiesNear, updateEnemies } from '../systems/ai';
import {
  isWeaponReady,
  reloadProgress,
  updatePlayerWeapon,
  updateProjectiles,
} from '../systems/combat';
import type { ProjectileEvent, ProjectileTarget } from '../systems/combat';
import { createInputState } from '../systems/input';
import type { InputState } from '../systems/input';
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
  readonly bullets: readonly Bullet[];
  update(stepSeconds: number): void;
  render(context: CanvasRenderingContext2D): void;
  dispose(): void;
}

interface EffectsState {
  recoil: number;
  muzzleFlash: number;
  hitMarker: number;
  damageFlash: number;
}

interface GameState {
  readonly seed: number;
  readonly arena: GeneratedArena;
  readonly player: PlayerState;
  readonly enemies: EnemyState[];
  readonly input: InputState;
  readonly bullets: Bullet[];
  readonly aiRng: Rng;
  readonly effects: EffectsState;
  aim: ResolvedAim;
}

const FIRE_ALERT_RADIUS = 60;

function createEffects(): EffectsState {
  return { recoil: 0, muzzleFlash: 0, hitMarker: 0, damageFlash: 0 };
}

function decayEffects(effects: EffectsState, stepSeconds: number): void {
  effects.recoil = Math.max(0, effects.recoil - stepSeconds * 4.5);
  effects.muzzleFlash = Math.max(0, effects.muzzleFlash - stepSeconds * 7);
  effects.hitMarker = Math.max(0, effects.hitMarker - stepSeconds * 5);
  effects.damageFlash = Math.max(0, effects.damageFlash - stepSeconds * 2.5);
}

/** Reparto provisional de tipos; las misiones (fase 9) darán el reparto exacto. */
function buildEnemyRoster(spawns: readonly SpawnPoint[]): EnemyState[] {
  const heavyCount = Math.max(0, spawns.length - 3);
  return spawns.map((spawn, index) => {
    const type: EnemyType = index >= spawns.length - heavyCount ? 'heavy' : 'light';
    return createEnemy(`enemigo-${index + 1}`, type, spawn);
  });
}

function buildTargets(
  player: PlayerState,
  enemies: readonly EnemyState[],
): ProjectileTarget[] {
  const targets: ProjectileTarget[] = [];
  if (player.alive) {
    targets.push({
      id: 'player',
      position: player.position,
      radius: player.radius,
      height: TANK_TARGET_HEIGHT,
      faction: 'player',
    });
  }
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    targets.push({
      id: enemy.id,
      position: enemy.position,
      radius: enemy.radius,
      height: TANK_TARGET_HEIGHT,
      faction: 'enemy',
    });
  }
  return targets;
}

/** Aplica el daño de un impacto a un tanque. Devuelve true si el jugador recibió daño. */
function applyTargetHit(
  event: ProjectileEvent,
  player: PlayerState,
  enemies: readonly EnemyState[],
): boolean {
  if (!event.targetId) return false;

  if (event.targetId === 'player') {
    if (!player.alive) return false;
    player.health = Math.max(0, player.health - event.damage * (1 - player.armor));
    if (player.health <= 0) player.alive = false;
    return true;
  }

  const enemy = enemies.find((item) => item.id === event.targetId);
  if (!enemy || !enemy.alive) return false;
  enemy.health = Math.max(0, enemy.health - event.damage * (1 - enemy.armor));
  if (enemy.health <= 0) enemy.alive = false;
  return false;
}

function stepCombat(state: GameState, stepSeconds: number): void {
  const { player, enemies, arena, bullets, effects, input, aiRng } = state;
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
    });
    if (fired) {
      effects.recoil = 1;
      effects.muzzleFlash = 1;
      alertEnemiesNear(enemies, player.position, FIRE_ALERT_RADIUS);
    }
  }

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
    targets: buildTargets(player, enemies),
  });

  let playerHit = false;
  for (const impact of impacts) {
    if (applyTargetHit(impact, player, enemies)) playerHit = true;
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

interface StatusInput {
  readonly seed: number;
  readonly player: PlayerState;
  readonly enemies: readonly EnemyState[];
  readonly bulletCount: number;
}

function drawTemporaryStatus(
  context: CanvasRenderingContext2D,
  status: StatusInput,
): void {
  const { seed, player, enemies, bulletCount } = status;
  const alive = enemies.filter((enemy) => enemy.alive).length;
  context.fillStyle = 'rgba(4, 6, 5, 0.55)';
  context.fillRect(24, 24, 470, 58);
  context.fillStyle = PALETTE.texto;
  context.font = '16px monospace';
  context.textAlign = 'left';
  context.fillText(
    `Semilla ${seed} · fase 6.6 · enemigos ${alive}/${enemies.length} · proyectiles ${bulletCount}`,
    36,
    48,
  );
  context.fillStyle = PALETTE.textoTenue;
  const reload =
    player.reloadRemaining > 0 ? `recargando ${player.reloadRemaining.toFixed(1)} s` : 'lista';
  context.fillText(
    `W/S · A/D girar · ratón apuntar · clic/ESPACIO disparar · vida ${Math.round(player.health)} · ${reload}`,
    36,
    70,
  );
}

function drawDestroyedOverlay(context: CanvasRenderingContext2D): void {
  context.fillStyle = 'rgba(22, 4, 3, 0.55)';
  context.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);
  context.fillStyle = PALETTE.texto;
  context.font = '600 42px Georgia, serif';
  context.textAlign = 'center';
  context.fillText('TANQUE DESTRUIDO', VIEWPORT.width / 2, VIEWPORT.height / 2 - 8);
  context.fillStyle = PALETTE.textoTenue;
  context.font = '18px monospace';
  context.fillText(
    'La pantalla de resultados llega en la fase 9',
    VIEWPORT.width / 2,
    VIEWPORT.height / 2 + 28,
  );
}

function renderGame(state: GameState, context: CanvasRenderingContext2D): void {
  const { player, arena, bullets, enemies, effects, seed, aim } = state;
  const baseCamera = createPlayerCamera(player.position, player.yaw);
  const camera = cameraWithRecoil(baseCamera, player, effects.recoil);
  renderWorld(context, { grid: arena.grid, camera, bullets, enemies });

  const periscopeState: PeriscopeState = {
    reloadProgress: reloadProgress(player),
    reloadRemaining: player.reloadRemaining,
    ready: isWeaponReady(player),
    muzzleFlash: effects.muzzleFlash,
    hitMarker: effects.hitMarker,
    aimScreenX: aim.screenX,
    aimScreenY: aim.screenY,
  };
  drawPeriscope(context, VIEWPORT, periscopeState);

  if (effects.damageFlash > 0) {
    overlayTint(context, PALETTE.destelloDano, 0.28 * effects.damageFlash);
  }
  if (!player.alive) drawDestroyedOverlay(context);

  drawTemporaryStatus(context, { seed, player, enemies, bulletCount: bullets.length });
}

function createGameState(options: GameOptions): GameState {
  const seed = options.seed ?? Date.now() >>> 0;
  const arena = generateArena({ seed, ...ARENA_DEFAULTS });

  return {
    seed,
    arena,
    player: createPlayer(arena.playerSpawn),
    enemies: buildEnemyRoster(arena.enemySpawns),
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
    bullets: state.bullets,

    update: (stepSeconds) => stepCombat(state, stepSeconds),
    render: (context) => renderGame(state, context),

    dispose: () => {
      state.input.clear();
    },
  };
}
