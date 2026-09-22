import type { SimulatorOptions } from '../types';

export type Unsubscribe = () => void;

/** One aggregated activity window (the simulator emits one per simulated minute). */
export interface ActivitySampleEvent {
  /** Epoch milliseconds at the end of the window (simulated clock) */
  timestamp: number;
  /** Steps counted inside the window */
  steps: number;
  /** Window length in simulated seconds */
  durationSec: number;
}

/**
 * Abstraction over the phone's activity source (pedometer / motion sensors),
 * mirroring CgmTransport for the sensor link.
 *
 * Web and development builds use SimulatedActivityTransport. A native
 * implementation (expo-sensors Pedometer, HealthKit, Health Connect) must
 * satisfy this interface so the store and screens stay unchanged.
 */
export interface ActivityTransport {
  start(): void;
  stop(): void;
  onSample(listener: (event: ActivitySampleEvent) => void): Unsubscribe;
  /** Optional hooks that only a simulator can honour. */
  simulator?: {
    setOptions(options: SimulatorOptions): void;
  };
}
