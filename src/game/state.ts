/** Estado mutable de la partida y efectos visuales transitorios. */

import { PALETTE } from '../config/palette';
import { createRng } from '../core/rng';
import type { AudioBus } from '../audio/audio';
import type { Rng } from '../core/rng';
import type { InputState } from '../systems/input';
import type { Progression } from '../systems/progression';
import type { MissionSession } from './session';

export interface EffectsState {
  recoil: number;
  hitMarker: number;
  damageFlash: number;
  pickupFlash: number;
  pickupNotice: string;
  pickupColor: string;
}

export interface GameState {
  readonly baseSeed: number;
  session: MissionSession;
  readonly input: InputState;
  aiRng: Rng;
  effects: EffectsState;
  progression: Progression;
  campaignScore: number;
  paused: boolean;
  readonly audio: AudioBus;
  audioMuted: boolean;
  audioVolume: number;
}

const EFFECT_RATE = {
  recoil: 4.5,
  hitMarker: 5,
  damageFlash: 2.5,
  pickupFlash: 0.8,
} as const;

export function createEffects(): EffectsState {
  return {
    recoil: 0,
    hitMarker: 0,
    damageFlash: 0,
    pickupFlash: 0,
    pickupNotice: '',
    pickupColor: PALETTE.texto,
  };
}

export function createAiRng(session: MissionSession): Rng {
  return createRng((session.seed ^ 0x9e3779b9) >>> 0);
}

export function decayEffects(effects: EffectsState, stepSeconds: number): void {
  effects.recoil = Math.max(0, effects.recoil - stepSeconds * EFFECT_RATE.recoil);
  effects.hitMarker = Math.max(0, effects.hitMarker - stepSeconds * EFFECT_RATE.hitMarker);
  effects.damageFlash = Math.max(0, effects.damageFlash - stepSeconds * EFFECT_RATE.damageFlash);
  effects.pickupFlash = Math.max(0, effects.pickupFlash - stepSeconds * EFFECT_RATE.pickupFlash);
}
