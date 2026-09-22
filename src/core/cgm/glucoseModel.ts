import type { SimulatorScenario } from '../types';

export const BASELINE = 105;
const MEAL_TICKS = 40;

export interface GlucoseModelOptions {
  /** Random source in [0, 1); inject a seeded one in tests for deterministic traces */
  random?: () => number;
  noiseSd?: number;
}

/**
 * Pure glucose generator shared by the virtual sensor and the tests. Call
 * `next(scenario, dtMin)` once per reading; `dtMin` is the simulated minutes
 * elapsed since the previous reading.
 */
export class GlucoseModel {
  glucose = BASELINE;
  private mealTick = 0;
  private lastScenario: SimulatorScenario = 'normal';
  private readonly random: () => number;
  private readonly noiseSd: number;

  constructor(opts: GlucoseModelOptions = {}) {
    this.random = opts.random ?? Math.random;
    this.noiseSd = opts.noiseSd ?? 2.5;
  }

  next(scenario: SimulatorScenario, dtMin: number): number {
    if (scenario !== this.lastScenario) {
      if (scenario === 'meal') this.mealTick = 0;
      this.lastScenario = scenario;
    }

    let target = BASELINE;
    if (scenario === 'hypo') target = 55;
    if (scenario === 'hyper') target = 260;
    if (scenario === 'meal') {
      // Bell-shaped post-prandial excursion peaking at about +90 mg/dL.
      const phase = Math.min(this.mealTick, MEAL_TICKS) / MEAL_TICKS;
      target = BASELINE + 90 * Math.sin(Math.PI * phase);
      this.mealTick += 1;
    }

    // dtMin is kept in the signature so a future model can use a real time step.
    void dtMin;
    const next = this.glucose + (target - this.glucose) * 0.12 + this.gaussianNoise(this.noiseSd);
    this.glucose = Math.max(39, Math.min(401, next));
    return this.glucose;
  }

  private gaussianNoise(sd: number): number {
    const u = 1 - this.random();
    const v = this.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sd;
  }
}
