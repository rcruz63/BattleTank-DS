import { describe, expect, it } from 'vitest';
import { createFrameStepper } from '../../src/core/loop';

interface Harness {
  updates: number[];
  renders: Array<{ alpha: number; frameSeconds: number }>;
}

function createHarness(fixedStepSeconds = 0.1, maxFrameSeconds = 0.5): {
  stepper: ReturnType<typeof createFrameStepper>;
  harness: Harness;
} {
  const harness: Harness = { updates: [], renders: [] };
  const stepper = createFrameStepper({
    fixedStepSeconds,
    maxFrameSeconds,
    onUpdate: (step) => harness.updates.push(step),
    onRender: (alpha, frameSeconds) => harness.renders.push({ alpha, frameSeconds }),
  });
  return { stepper, harness };
}

describe('bucle de paso fijo', () => {
  it('ejecuta el número de pasos que cabe en el tiempo transcurrido', () => {
    const { stepper, harness } = createHarness();
    stepper.reset(0);
    expect(stepper.advance(50)).toBe(0);
    expect(harness.renders.at(-1)?.alpha).toBeCloseTo(0.5, 12);
    expect(stepper.advance(260)).toBe(2);
    expect(harness.updates).toEqual([0.1, 0.1]);
  });

  it('llama a render una vez por avance aunque no haya pasos', () => {
    const { stepper, harness } = createHarness();
    stepper.reset(0);
    stepper.advance(10);
    stepper.advance(20);
    expect(harness.renders).toHaveLength(2);
    expect(harness.updates).toHaveLength(0);
  });

  it('limita el tiempo real acumulado para no espiralizar', () => {
    const { stepper, harness } = createHarness(0.1, 0.3);
    stepper.reset(0);
    const steps = stepper.advance(10_000);
    expect(steps).toBe(3);
    expect(harness.updates).toHaveLength(3);
  });

  it('reset descarta el tiempo acumulado', () => {
    const { stepper, harness } = createHarness();
    stepper.reset(0);
    stepper.advance(50);
    stepper.reset(1_000);
    expect(stepper.advance(1_050)).toBe(0);
    expect(harness.updates).toHaveLength(0);
  });

  it('ignora retrocesos del reloj', () => {
    const { stepper, harness } = createHarness();
    stepper.reset(100);
    expect(stepper.advance(50)).toBe(0);
    expect(harness.updates).toHaveLength(0);
  });
});
