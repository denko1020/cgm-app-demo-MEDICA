// Platform-independent domain types shared by web, iOS and Android builds.

export type Language = 'en' | 'ko' | 'es';
export type GlucoseUnit = 'mg/dL' | 'mmol/L';
export type Hba1cUnit = 'mmol/mol' | '%';

export type ReadingSource = 'cgm' | 'bgm';

/**
 * Direction and rate of change, as the seven states the trend dial draws:
 * three rates each way around a steady middle, plus "not enough history yet".
 */
export type Trend = 'up' | 'upModerate' | 'upSlight' | 'flat' | 'downSlight' | 'downModerate' | 'down' | 'unknown';

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
  /** Blood ketone (beta-hydroxybutyrate) in mmol/L; absent on readings stored before multi-analyte support */
  ketone?: number;
  /** Blood lactate in mmol/L; absent on readings stored before multi-analyte support */
  lactate?: number;
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

/** A value the sensor measures directly and that the chart can plot over time. */
export type Analyte = 'glucose' | 'ketone' | 'lactate';

/** What the Home card/chart and Readings list display: one measured analyte, or estimated HbA1c */
export type ViewMode = Analyte | 'hba1c';

export type Gender = 'male' | 'female' | 'other';

export interface UserProfile {
  name: string;
  age: number;
  weightKg: number;
  heightCm: number;
  gender: Gender;
}

export interface EmergencyContact {
  name: string;
  phone: string;
}

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
 * exports show what the simulator was doing. `kind` is optional because events
 * persisted before user events existed carry no discriminator.
 */
export interface ScenarioEvent {
  id: string;
  /** Epoch milliseconds (simulated clock) */
  timestamp: number;
  kind?: 'scenario';
  from: SimulatorScenario;
  to: SimulatorScenario;
}

/** Something the wearer logs from the Home card; each one perturbs the measured analytes. */
export type UserEventKind = 'meal' | 'exercise' | 'sleep' | 'medication';

/** Grid order on the Home card: runner and fork on top, moon and capsule below. */
export const USER_EVENT_KINDS = ['exercise', 'meal', 'sleep', 'medication'] as const;

/**
 * A meal, workout, sleep or medication the wearer logged. Stored in the same
 * timeline as scenario switches so the chart, the Readings list and the CSV
 * export all line the event up against the curve it moved.
 */
export interface UserEvent {
  id: string;
  /** Epoch milliseconds (simulated clock) */
  timestamp: number;
  kind: UserEventKind;
}

/** Anything on the event timeline shown next to the readings. */
export type AppEvent = ScenarioEvent | UserEvent;

/** Narrows the timeline; events persisted without a `kind` are scenario switches. */
export function isScenarioEvent(e: AppEvent): e is ScenarioEvent {
  return (e.kind ?? 'scenario') === 'scenario';
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
