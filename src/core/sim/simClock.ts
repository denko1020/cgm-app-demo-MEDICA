/**
 * Simulated wall clock. At scale 1 it equals Date.now(); at scale N simulated
 * time advances N times faster than real time; at scale 0 it stands still
 * (pause). Readings, sensor lifetime and
 * time-window statistics use this clock so that a day of wear can be tested
 * in minutes.
 */
class SimClock {
  private anchorReal = Date.now();
  private anchorSim = Date.now();
  private currentScale = 1;

  get scale(): number {
    return this.currentScale;
  }

  now(): number {
    return this.anchorSim + (Date.now() - this.anchorReal) * this.currentScale;
  }

  setScale(scale: number) {
    const sim = this.now();
    this.anchorReal = Date.now();
    this.anchorSim = sim;
    this.currentScale = Math.max(0, scale);
  }

  /** Back to real time at 1x, used when the app data is wiped. */
  reset() {
    this.anchorReal = Date.now();
    this.anchorSim = Date.now();
    this.currentScale = 1;
  }

  /** Never let simulated time run behind an already recorded timestamp (e.g. after a reload). */
  ensureAtLeast(timestamp: number) {
    if (timestamp > this.now()) {
      this.anchorReal = Date.now();
      this.anchorSim = timestamp;
    }
  }
}

export const simClock = new SimClock();
