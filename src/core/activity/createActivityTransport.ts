import { simClock } from '../sim/simClock';
import type { ActivityTransport } from './ActivityTransport';
import { SimulatedActivityTransport } from './SimulatedActivityTransport';

/**
 * Single place that decides where activity data comes from.
 *
 * Browsers expose no step counter, so web always uses the simulator. When a
 * native pedometer transport is added (expo-sensors Pedometer, HealthKit,
 * Health Connect), branch here on Platform.OS and return it for iOS/Android.
 */
export function createActivityTransport(): ActivityTransport {
  return new SimulatedActivityTransport(() => simClock.now());
}
