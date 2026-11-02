import type { SimulatorScenario, UserEventKind } from '../types';

export const BASELINE = 105;
const MEAL_TICKS = 40;

/** One pass of the virtual sensor: every analyte it reports for the same instant. */
export interface SensorSample {
  /** mg/dL */
  glucose: number;
  /** beta-hydroxybutyrate, mmol/L */
  ketone: number;
  /** mmol/L */
  lactate: number;
}

/**
 * How far a logged event moves glucose and how long it takes, as a bell-shaped
 * excursion. Peaks are mg/dL at the top of the curve; ticks are readings.
 */
const EVENT_SHAPE: Record<UserEventKind, { peak: number; ticks: number }> = {
  meal: { peak: 90, ticks: MEAL_TICKS },
  exercise: { peak: -35, ticks: 30 },
  sleep: { peak: -10, ticks: 60 },
  medication: { peak: -45, ticks: 50 },
};

interface Impulse {
  kind: UserEventKind;
  tick: number;
  ticks: number;
}

export interface GlucoseModelOptions {
  /** Random source in [0, 1); inject a seeded one in tests for deterministic traces */
  random?: () => number;
  noiseSd?: number;
}

/**
 * Pure metabolic generator shared by the virtual sensor and the tests. Call
 * `next(scenario, dtMin)` once per reading; `dtMin` is the simulated minutes
 * elapsed since the previous reading.
 *
 * Glucose is the driven signal; ketone and lactate are derived from the same
 * state, so the three move together the way they do in a wearer: ketones climb
 * when glucose runs low or stays very high, lactate spikes while exercising.
 */
export class GlucoseModel {
  glucose = BASELINE;
  ketone = 0.2;
  lactate = 1.0;
  private mealTick = 0;
  private lastScenario: SimulatorScenario = 'normal';
  private impulses: Impulse[] = [];
  private readonly random: () => number;
  private readonly noiseSd: number;

  constructor(opts: GlucoseModelOptions = {}) {
    this.random = opts.random ?? Math.random;
    this.noiseSd = opts.noiseSd ?? 2.5;
  }

  /** Everything the sensor reports for the latest tick. */
  get sample(): SensorSample {
    return { glucose: this.glucose, ketone: this.ketone, lactate: this.lactate };
  }

  /**
   * Starts a one-off excursion for an event the wearer logged. Unlike the
   * Settings scenario this is not a mode: it decays on its own, and several
   * events can overlap.
   */
  logEvent(kind: UserEventKind): void {
    this.impulses.push({ kind, tick: 0, ticks: EVENT_SHAPE[kind].ticks });
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

    const { offset, intensity } = this.advanceImpulses();
    target += offset;

    // dtMin is kept in the signature so a future model can use a real time step.
    void dtMin;
    const next = this.glucose + (target - this.glucose) * 0.12 + this.gaussianNoise(this.noiseSd);
    this.glucose = Math.max(39, Math.min(401, next));
    this.advanceKetone(intensity);
    this.advanceLactate(intensity);
    return this.glucose;
  }

  /**
   * Steps every live impulse one tick, dropping the ones that have run their
   * course. Returns the summed glucose offset and the per-kind curve height,
   * which the ketone and lactate models read as "how hard is this happening".
   */
  private advanceImpulses(): { offset: number; intensity: Record<UserEventKind, number> } {
    const intensity: Record<UserEventKind, number> = { meal: 0, exercise: 0, sleep: 0, medication: 0 };
    let offset = 0;
    for (const impulse of this.impulses) {
      const phase = Math.sin(Math.PI * (impulse.tick / impulse.ticks));
      offset += EVENT_SHAPE[impulse.kind].peak * phase;
      intensity[impulse.kind] = Math.max(intensity[impulse.kind], phase);
      impulse.tick += 1;
    }
    this.impulses = this.impulses.filter((i) => i.tick <= i.ticks);
    return { offset, intensity };
  }

  /**
   * Ketogenesis: climbs as glucose falls towards fasting levels, climbs again
   * when glucose stays very high (too little insulin to suppress it), is pushed
   * down by a meal and nudged up by the fat oxidation of a long workout.
   */
  private advanceKetone(intensity: Record<UserEventKind, number>): void {
    const fasting = Math.max(0, (90 - this.glucose) / 90) * 1.6;
    const unchecked = Math.max(0, (this.glucose - 250) / 100) * 1.2;
    const target = Math.max(0.05, 0.15 + fasting + unchecked + intensity.exercise * 0.35 - intensity.meal * 0.12);
    const next = this.ketone + (target - this.ketone) * 0.08 + this.gaussianNoise(0.02);
    this.ketone = Math.max(0.05, Math.min(6, next));
  }

  /** Lactate: mostly flat at rest, spikes with exercise, drifts up when glucose is very high. */
  private advanceLactate(intensity: Record<UserEventKind, number>): void {
    const target = 0.9 + intensity.exercise * 6 + Math.max(0, (this.glucose - 200) / 100) * 0.8;
    const next = this.lactate + (target - this.lactate) * 0.25 + this.gaussianNoise(0.05);
    this.lactate = Math.max(0.3, Math.min(14, next));
  }

  private gaussianNoise(sd: number): number {
    const u = 1 - this.random();
    const v = this.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sd;
  }
}
