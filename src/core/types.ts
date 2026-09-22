// Platform-independent domain types shared by web, iOS and Android builds.

export type Language = 'en' | 'ko';
export type GlucoseUnit = 'mg/dL' | 'mmol/L';

export type ReadingSource = 'cgm' | 'bgm';

export type Trend = 'up' | 'upSlight' | 'flat' | 'downSlight' | 'down' | 'unknown';

export interface GlucoseReading {
  id: string;
  deviceId: string;
  source: ReadingSource;
  /** Epoch milliseconds */
  timestamp: number;
  /** Raw sensor value in mg/dL before calibration (equals value for BGM) */
  raw: number;
  /** Calibrated value in mg/dL */
  value: number;
  trend: Trend;
  uploaded: boolean;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

export interface DiscoveredDevice {
  id: string;
  name: string;
  rssi: number;
}

export interface DeviceInfo {
  manufacturer: string;
  firmwareVersion: string;
  ieeeAddress: string;
  batteryLevel: number;
}

export interface AlgorithmParameters {
  calibrationSlope: number;
  calibrationOffset: number;
  smoothingWindow: number;
}

export interface PairedDevice extends DiscoveredDevice {
  info: DeviceInfo;
  algorithm: AlgorithmParameters;
  /** Epoch ms when the sensor session started (first successful connection) */
  sensorStartedAt: number | null;
  /** Sensor wear lifetime in days */
  lifetimeDays: number;
  pairedAt: number;
}

/** What the Home card/chart and Readings list display: raw glucose or the derived health index */
export type ViewMode = 'glucose' | 'health';

export type SimulatorScenario = 'normal' | 'meal' | 'hypo' | 'hyper';

/** One aggregated activity window from the ActivityTransport (steps + duration). */
export interface ActivitySample {
  id: string;
  /** Epoch milliseconds (simulated clock) */
  timestamp: number;
  steps: number;
  durationSec: number;
}

/**
 * A scenario switch made in Settings, kept alongside readings so lists and
 * exports show what the simulator was doing. `kind` is carried for older
 * persisted events; scenario is the only kind.
 */
export interface ScenarioEvent {
  id: string;
  /** Epoch milliseconds (simulated clock) */
  timestamp: number;
  kind?: 'scenario';
  from: SimulatorScenario;
  to: SimulatorScenario;
}

export interface SimulatorOptions {
  /** Reading interval in simulated seconds */
  intervalSec: number;
  scenario: SimulatorScenario;
  /** Simulated time speed relative to real time (1 = real time, 100 = 100x) */
  timeScale: number;
  /** Freezes the simulated clock and stops the virtual sensor from emitting */
  paused: boolean;
}

export const TIME_SCALES = [1, 2, 5, 10, 50, 100] as const;

export interface TherapySettings {
  targetLow: number;
  targetHigh: number;
  alertsEnabled: boolean;
}
