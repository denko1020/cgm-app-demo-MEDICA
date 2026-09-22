import type { SimulatorOptions } from '../types';
import type { ActivitySampleEvent, ActivityTransport, Unsubscribe } from './ActivityTransport';

/** Steps per simulated minute of ordinary day-to-day movement: [min, max]. */
const STEP_RATE: [number, number] = [0, 8];

const WINDOW_SEC = 60;

/**
 * Virtual pedometer. Emits one sample per simulated minute so that, at 100x,
 * a day of activity arrives in about fifteen real minutes. Honors the same
 * simulator options as the virtual CGM: pause stops the stream and timeScale
 * shortens the real interval.
 */
export class SimulatedActivityTransport implements ActivityTransport {
  private listeners = new Set<(e: ActivitySampleEvent) => void>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private options: SimulatorOptions = { intervalSec: 10, scenario: 'normal', timeScale: 1, paused: false };

  constructor(
    private readonly now: () => number = Date.now,
    private readonly random: () => number = Math.random,
  ) {}

  readonly simulator = {
    setOptions: (options: SimulatorOptions) => {
      const cadenceChanged = options.timeScale !== this.options.timeScale || options.paused !== this.options.paused;
      this.options = { ...options };
      if (this.running && cadenceChanged) this.schedule();
    },
  };

  start() {
    this.running = true;
    this.schedule();
  }

  stop() {
    this.running = false;
    this.clear();
  }

  onSample(listener: (event: ActivitySampleEvent) => void): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Produce one window's worth of steps; exposed for tests and for the timer. */
  sample(): ActivitySampleEvent {
    const [lo, hi] = STEP_RATE;
    const steps = Math.round(lo + (hi - lo) * this.random());
    return { timestamp: this.now(), steps, durationSec: WINDOW_SEC };
  }

  private schedule() {
    this.clear();
    if (this.options.paused) return;
    const realMs = Math.max(100, (WINDOW_SEC * 1000) / Math.max(1, this.options.timeScale));
    this.timer = setInterval(() => {
      const e = this.sample();
      this.listeners.forEach((l) => l(e));
    }, realMs);
  }

  private clear() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
