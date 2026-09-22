import type { DeviceInfo, DiscoveredDevice, SimulatorOptions } from '../types';
import type { CgmTransport, RawReadingEvent, StatusEvent, Unsubscribe } from './CgmTransport';
import { GlucoseModel } from './glucoseModel';

const CATALOG: DiscoveredDevice[] = [
  { id: '08328c8145363b3c', name: 'CGM S1', rssi: -58 },
  { id: '1a7f3e9c02d4b6e8', name: 'CGM S2', rssi: -71 },
];

function gaussianNoise(sd: number): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sd;
}

/**
 * In-app virtual sensor. Produces a plausible glucose trace, drains the
 * battery slowly and lets the tester force scenarios or a link drop.
 */
export class SimulatedTransport implements CgmTransport {
  private readingListeners = new Set<(e: RawReadingEvent) => void>();
  private statusListeners = new Set<(e: StatusEvent) => void>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private connectedId: string | null = null;
  private readonly model = new GlucoseModel();
  private battery = 100;
  private tick = 0;
  private options: SimulatorOptions = { intervalSec: 10, scenario: 'normal', timeScale: 1, paused: false };

  /** @param now Clock used for reading timestamps (the simulated clock in this app). */
  constructor(private readonly now: () => number = Date.now) {}

  readonly simulator = {
    setOptions: (options: SimulatorOptions) => {
      this.options = { ...options };
      if (!this.connectedId) return;
      // Paused: keep the link up but stop emitting until resumed.
      if (options.paused) this.stopTicking();
      else this.startTicking();
    },
    dropConnection: () => {
      if (!this.connectedId) return;
      const id = this.connectedId;
      this.stopTicking();
      this.connectedId = null;
      this.emitStatus(id, 'disconnected');
    },
  };

  startScan(onFound: (device: DiscoveredDevice) => void): Unsubscribe {
    const handles = CATALOG.map((d, i) =>
      setTimeout(() => onFound({ ...d, rssi: d.rssi + Math.round(gaussianNoise(3)) }), 600 + i * 900),
    );
    return () => handles.forEach(clearTimeout);
  }

  async connect(deviceId: string): Promise<DeviceInfo> {
    const known = CATALOG.find((d) => d.id === deviceId);
    if (!known) throw new Error(`Unknown device ${deviceId}`);
    this.emitStatus(deviceId, 'connecting');
    await new Promise((r) => setTimeout(r, 1200));
    this.connectedId = deviceId;
    this.emitStatus(deviceId, 'connected');
    // Honour a paused simulator on (re)connect; setOptions restarts ticking on resume.
    if (!this.options.paused) this.startTicking();
    return {
      manufacturer: 'OHC',
      firmwareVersion: '0.8.0',
      ieeeAddress: deviceId,
      batteryLevel: this.battery,
    };
  }

  async disconnect(): Promise<void> {
    if (!this.connectedId) return;
    const id = this.connectedId;
    this.stopTicking();
    this.connectedId = null;
    this.emitStatus(id, 'disconnected');
  }

  onReading(listener: (event: RawReadingEvent) => void): Unsubscribe {
    this.readingListeners.add(listener);
    return () => this.readingListeners.delete(listener);
  }

  onStatus(listener: (event: StatusEvent) => void): Unsubscribe {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private startTicking() {
    this.stopTicking();
    this.emitReading();
    // Interval is expressed in simulated seconds; convert to real milliseconds.
    const realMs = Math.max(200, (this.options.intervalSec * 1000) / Math.max(1, this.options.timeScale));
    this.timer = setInterval(() => this.emitReading(), realMs);
  }

  private stopTicking() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private emitReading() {
    if (!this.connectedId) return;
    this.tick += 1;
    const glucose = this.model.next(this.options.scenario, this.options.intervalSec / 60);
    if (this.tick % 50 === 0 && this.battery > 0) {
      this.battery -= 1;
      this.emitStatus(this.connectedId, 'connected');
    }
    const event: RawReadingEvent = {
      deviceId: this.connectedId,
      timestamp: this.now(),
      raw: Math.round(glucose),
    };
    this.readingListeners.forEach((l) => l(event));
  }

  private emitStatus(deviceId: string, connection: StatusEvent['connection']) {
    const event: StatusEvent = { deviceId, connection, batteryLevel: this.battery };
    this.statusListeners.forEach((l) => l(event));
  }
}
