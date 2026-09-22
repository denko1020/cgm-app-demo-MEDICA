import { simClock } from '../sim/simClock';
import type { CgmTransport } from './CgmTransport';
import { SimulatedTransport } from './SimulatedTransport';

/**
 * Single place that decides which link implementation the app uses.
 *
 * When a native BLE transport is added, branch here on Platform.OS (or on a
 * build-time flag) and return it for iOS/Android while web keeps the simulator.
 */
export function createTransport(): CgmTransport {
  return new SimulatedTransport(() => simClock.now());
}
