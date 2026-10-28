/**
 * Bus de audio del juego. WebAudio sintetizado, sin assets, con degradación silenciosa.
 *
 * El contexto se desbloquea en el primer gesto del usuario (política del navegador). El volumen
 * maestro y el mute viven aquí; el HUD solo refleja su estado.
 */

import { createAmbientVoice, createCuePlayer, createEngineVoice } from './synth';
import type { SynthCue } from './synth';

export type AudioCue = SynthCue;

export interface AudioBus {
  play(cue: AudioCue): void;
  /** 0 = parado, 1 = velocidad máxima. */
  setEngine(speed: number): void;
  setMuted(muted: boolean): void;
  setVolume(volume: number): void;
  dispose(): void;
}

export const DEFAULT_VOLUME = 0.7;

export function clampVolume(volume: number): number {
  return Math.max(0, Math.min(1, volume));
}

/** Bus mudo para tests y para entornos sin WebAudio. */
export function createSilentAudioBus(): AudioBus {
  return {
    play: () => undefined,
    setEngine: () => undefined,
    setMuted: () => undefined,
    setVolume: () => undefined,
    dispose: () => undefined,
  };
}

interface WebAudioWindow extends Window {
  readonly webkitAudioContext?: typeof AudioContext;
}

function audioContextClass(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  const constructor = window.AudioContext ?? (window as WebAudioWindow).webkitAudioContext;
  return constructor ?? null;
}

/** Crea el bus WebAudio; si el navegador no lo soporta devuelve uno silencioso. */
export function createAudioBus(): AudioBus {
  const AudioContextCtor = audioContextClass();
  if (!AudioContextCtor) return createSilentAudioBus();

  let context: AudioContext;
  try {
    context = new AudioContextCtor();
  } catch {
    return createSilentAudioBus();
  }

  const master = context.createGain();
  master.connect(context.destination);
  const cues = createCuePlayer(context, master);
  const engine = createEngineVoice(context, master);
  const ambient = createAmbientVoice(context, master);
  let muted = false;
  let volume = DEFAULT_VOLUME;

  const applyVolume = (): void => {
    master.gain.setTargetAtTime(muted ? 0 : clampVolume(volume), context.currentTime, 0.03);
  };
  applyVolume();

  const unlock = (): void => {
    void context.resume();
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });

  return {
    play: (cue) => {
      void context.resume();
      cues.play(cue);
    },
    setEngine: (speed) => engine.setSpeed(speed),
    setMuted: (nextMuted) => {
      muted = nextMuted;
      applyVolume();
    },
    setVolume: (nextVolume) => {
      volume = clampVolume(nextVolume);
      applyVolume();
    },
    dispose: () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      engine.dispose();
      ambient.dispose();
      void context.close();
    },
  };
}
