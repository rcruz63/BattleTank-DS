/** Composición del juego: campaña, estado, entrada, simulación y render. */

import { DEFAULT_VOLUME, createSilentAudioBus } from '../audio/audio';
import type { AudioBus } from '../audio/audio';
import { MISSIONS } from '../config/missions';
import type { MissionPhase } from '../config/missions';
import type { Bullet } from '../entities/bullet';
import type { EnemyState } from '../entities/enemy';
import type { PickupState } from '../entities/pickup';
import type { PlayerState } from '../entities/player';
import type { DamagePopup } from '../render/combatFeedback';
import type { HudData } from '../ui/hudView';
import { createInputState } from '../systems/input';
import type { InputState } from '../systems/input';
import type { LootState } from '../systems/loot';
import { loadProgression } from '../systems/progression';
import type { GeneratedArena } from '../world/types';
import { getHudData } from './hudData';
import { renderGame } from './render';
import { createMissionSession } from './session';
import { stepCombat } from './simulation';
import { createAiRng, createEffects } from './state';
import type { GameState } from './state';

export interface GameOptions {
  readonly seed?: number;
  /** Entrada inyectada para tests/mandos. */
  readonly input?: InputState;
  /** true: empieza a jugar la misión 1 directamente (tests). false: briefing del HUD. */
  readonly autoStart?: boolean;
  /** Bus de audio inyectable; por defecto, uno silencioso (tests). */
  readonly audio?: AudioBus;
}

export interface Game {
  readonly seed: number;
  readonly arena: GeneratedArena;
  readonly player: PlayerState;
  readonly enemies: readonly EnemyState[];
  readonly pickups: readonly PickupState[];
  readonly loot: LootState;
  readonly bullets: readonly Bullet[];
  readonly damagePopups: readonly DamagePopup[];
  readonly missionIndex: number;
  readonly phase: MissionPhase;
  getHudData(): HudData;
  update(stepSeconds: number): void;
  render(context: CanvasRenderingContext2D): void;
  dispose(): void;
}

function createGameState(options: GameOptions): GameState {
  const baseSeed = options.seed ?? Date.now() >>> 0;
  const autoStart = options.autoStart ?? true;
  const progression = loadProgression();
  const startIndex = autoStart
    ? 0
    : Math.min(progression.unlockedMission, MISSIONS.length - 1);
  const session = createMissionSession(startIndex, baseSeed);
  session.phase = autoStart ? 'playing' : 'briefing';
  const audio = options.audio ?? createSilentAudioBus();
  audio.setMuted(false);
  audio.setVolume(DEFAULT_VOLUME);

  return {
    baseSeed,
    session,
    input: options.input ?? createInputState(),
    aiRng: createAiRng(session),
    effects: createEffects(),
    progression,
    campaignScore: 0,
    paused: false,
    audio,
    audioMuted: false,
    audioVolume: DEFAULT_VOLUME,
  };
}

export function createGame(options: GameOptions = {}): Game {
  const state = createGameState(options);

  return {
    seed: state.baseSeed,

    get arena() {
      return state.session.arena;
    },
    get player() {
      return state.session.player;
    },
    get enemies() {
      return state.session.enemies;
    },
    get pickups() {
      return state.session.pickups;
    },
    get loot() {
      return state.session.loot;
    },
    get bullets() {
      return state.session.bullets;
    },
    get damagePopups() {
      return state.session.damagePopups;
    },
    get missionIndex() {
      return state.session.missionIndex;
    },
    get phase() {
      return state.session.phase;
    },

    getHudData: () => getHudData(state),
    update: (stepSeconds) => stepCombat(state, stepSeconds),
    render: (context) => renderGame(state, context),

    dispose: () => {
      state.audio.setEngine(0);
      state.input.clear();
    },
  };
}
