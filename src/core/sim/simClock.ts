/**
 * Simulated wall clock. At scale 1 it equals Date.now(); at scale N simulated
 * time advances N times faster than real time; at scale 0 it stands still
 * (pause). Readings, sensor lifetime and
 * time-window statistics use this clock so that a day of wear can be tested
 * in minutes.
 *
 * Every launch starts from the device clock. Time it gained while running fast
 * is not carried over, because a demo that opens showing next week's date reads
 * as a broken app rather than as a fast simulation.
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

  /**
   * How far a stored timestamp runs ahead of the device clock, in ms, or 0 when
   * it does not. A session at 100x writes readings hours or days into the
   * future; the store shifts its history back by this much on the next launch
   * so the dates on screen are the ones on the user's phone.
   */
  aheadOfRealTime(timestamp: number): number {
    return Math.max(0, timestamp - Date.now());
  }
}

export const simClock = new SimClock();
