/** Síntesis procedural de efectos con WebAudio (sin assets). */

export type SynthCue =
  'fire' | 'enemy-fire' | 'impact' | 'explosion' | 'damage' | 'reload' | 'pickup' | 'ui';

interface ToneSpec {
  readonly type: OscillatorType;
  readonly frequency: number;
  readonly endFrequency?: number;
  readonly duration: number;
  readonly gain: number;
  readonly delay?: number;
}

interface NoiseSpec {
  readonly duration: number;
  readonly gain: number;
  readonly filterFrequency: number;
  readonly delay?: number;
}

let noiseBuffer: AudioBuffer | null = null;

/** Ruido determinista (LCG) para no depender de Math.random en el audio. */
function createNoiseBuffer(context: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const length = context.sampleRate;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let state = 0x9e3779b9;
  for (let index = 0; index < data.length; index += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    data[index] = (state / 0xffffffff) * 2 - 1;
  }
  noiseBuffer = buffer;
  return buffer;
}

function playTone(context: AudioContext, output: AudioNode, spec: ToneSpec): void {
  const start = context.currentTime + (spec.delay ?? 0);
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = spec.type;
  oscillator.frequency.setValueAtTime(spec.frequency, start);
  if (spec.endFrequency !== undefined) {
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(1, spec.endFrequency),
      start + spec.duration,
    );
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(spec.gain, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + spec.duration);
  oscillator.connect(gain);
  gain.connect(output);
  oscillator.start(start);
  oscillator.stop(start + spec.duration + 0.02);
}

function playNoise(context: AudioContext, output: AudioNode, spec: NoiseSpec): void {
  const start = context.currentTime + (spec.delay ?? 0);
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = createNoiseBuffer(context);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(spec.filterFrequency, start);
  gain.gain.setValueAtTime(spec.gain, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + spec.duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(output);
  source.start(start);
  source.stop(start + spec.duration + 0.02);
}

function playExplosion(context: AudioContext, output: AudioNode): void {
  playNoise(context, output, { duration: 0.5, gain: 0.35, filterFrequency: 420 });
  playTone(context, output, {
    type: 'sine',
    frequency: 55,
    endFrequency: 28,
    duration: 0.45,
    gain: 0.3,
  });
}

function playFire(context: AudioContext, output: AudioNode): void {
  playNoise(context, output, { duration: 0.16, gain: 0.22, filterFrequency: 900 });
  playTone(context, output, {
    type: 'sine',
    frequency: 120,
    endFrequency: 45,
    duration: 0.28,
    gain: 0.4,
  });
}

/** Cañonazo enemigo: más apagado y distante que el del jugador, para localizarlo de oído. */
function playEnemyFire(context: AudioContext, output: AudioNode): void {
  playNoise(context, output, { duration: 0.14, gain: 0.12, filterFrequency: 520 });
  playTone(context, output, {
    type: 'sine',
    frequency: 88,
    endFrequency: 40,
    duration: 0.24,
    gain: 0.18,
  });
}

function playImpact(context: AudioContext, output: AudioNode): void {
  playNoise(context, output, { duration: 0.12, gain: 0.18, filterFrequency: 700 });
  playTone(context, output, {
    type: 'triangle',
    frequency: 80,
    endFrequency: 50,
    duration: 0.16,
    gain: 0.2,
  });
}

function playDamage(context: AudioContext, output: AudioNode): void {
  playTone(context, output, {
    type: 'sawtooth',
    frequency: 70,
    endFrequency: 42,
    duration: 0.28,
    gain: 0.18,
  });
  playNoise(context, output, { duration: 0.1, gain: 0.12, filterFrequency: 500 });
}

function playReload(context: AudioContext, output: AudioNode): void {
  playTone(context, output, { type: 'square', frequency: 620, duration: 0.05, gain: 0.1 });
  playTone(context, output, {
    type: 'square',
    frequency: 930,
    duration: 0.06,
    gain: 0.1,
    delay: 0.08,
  });
}

function playPickup(context: AudioContext, output: AudioNode): void {
  playTone(context, output, {
    type: 'sine',
    frequency: 620,
    endFrequency: 780,
    duration: 0.14,
    gain: 0.14,
  });
  playTone(context, output, {
    type: 'sine',
    frequency: 930,
    duration: 0.14,
    gain: 0.12,
    delay: 0.1,
  });
}

function playUi(context: AudioContext, output: AudioNode): void {
  playTone(context, output, { type: 'sine', frequency: 440, duration: 0.045, gain: 0.08 });
}

const CUE_PLAYERS: Record<SynthCue, (context: AudioContext, output: AudioNode) => void> = {
  fire: playFire,
  'enemy-fire': playEnemyFire,
  impact: playImpact,
  explosion: playExplosion,
  damage: playDamage,
  reload: playReload,
  pickup: playPickup,
  ui: playUi,
};

/** Reproductor de efectos cortos de juego. */
export function createCuePlayer(
  context: AudioContext,
  output: AudioNode,
): { play(cue: SynthCue): void } {
  return {
    play: (cue) => CUE_PLAYERS[cue](context, output),
  };
}

/** Viento filtrado de fondo, muy tenue y en bucle. */
export function createAmbientVoice(context: AudioContext, output: AudioNode): { dispose(): void } {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = createNoiseBuffer(context);
  source.loop = true;
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(520, context.currentTime);
  gain.gain.setValueAtTime(0.008, context.currentTime);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(output);
  source.start();

  return {
    dispose: () => {
      source.stop();
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    },
  };
}

/** Voz continua del motor: el pitch y el volumen dependen de la velocidad (0..1). */
export function createEngineVoice(
  context: AudioContext,
  output: AudioNode,
): { setSpeed(speed: number): void; dispose(): void } {
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(48, context.currentTime);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(420, context.currentTime);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(output);
  oscillator.start();

  return {
    setSpeed: (speed) => {
      const ratio = Math.max(0, Math.min(1, speed));
      oscillator.frequency.setTargetAtTime(46 + ratio * 54, context.currentTime, 0.08);
      gain.gain.setTargetAtTime(0.012 + ratio * 0.05, context.currentTime, 0.1);
    },
    dispose: () => {
      gain.gain.setTargetAtTime(0.0001, context.currentTime, 0.05);
      oscillator.stop(context.currentTime + 0.2);
      oscillator.disconnect();
      filter.disconnect();
      gain.disconnect();
    },
  };
}
