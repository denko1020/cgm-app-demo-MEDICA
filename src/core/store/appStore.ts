import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  ActivitySample,
  AlgorithmParameters,
  ConnectionState,
  DeviceInfo,
  DiscoveredDevice,
  GlucoseReading,
  GlucoseUnit,
  Language,
  PairedDevice,
  ScenarioEvent,
  SimulatorOptions,
  TherapySettings,
  Trend,
  ViewMode,
} from '../types';
import { simClock } from '../sim/simClock';
import { newId } from '../util/format';

const MAX_READINGS = 2000;
/** One sample per simulated minute → two days */
const MAX_ACTIVITY = 2880;
const DEFAULT_LIFETIME_DAYS = 15;

const DEFAULT_ALGORITHM: AlgorithmParameters = {
  calibrationSlope: 1.0,
  calibrationOffset: 0,
  smoothingWindow: 3,
};

export interface AppState {
  language: Language;
  unit: GlucoseUnit;
  viewMode: ViewMode;
  therapy: TherapySettings;
  simulator: SimulatorOptions;
  autoUpload: boolean;

  devices: PairedDevice[];
  activeDeviceId: string | null;
  connection: ConnectionState;
  discovered: DiscoveredDevice[];
  scanning: boolean;

  readings: GlucoseReading[];
  /** Scenario switches, oldest first; shown between readings and exported with them */
  events: ScenarioEvent[];
  /** Activity windows from the ActivityTransport, oldest first */
  activity: ActivitySample[];
  lastReadingAt: number | null;
  uploading: boolean;
  lastUploadAt: number | null;
  lastUploadError: string | null;

  setLanguage(language: Language): void;
  setUnit(unit: GlucoseUnit): void;
  setViewMode(mode: ViewMode): void;
  setTherapy(patch: Partial<TherapySettings>): void;
  setSimulator(patch: Partial<SimulatorOptions>): void;
  setAutoUpload(enabled: boolean): void;

  setScanning(scanning: boolean): void;
  addDiscovered(device: DiscoveredDevice): void;
  clearDiscovered(): void;
  pairDevice(device: DiscoveredDevice, info: DeviceInfo): void;
  forgetDevice(deviceId: string): void;
  setActiveDevice(deviceId: string | null): void;
  setConnection(state: ConnectionState): void;
  updateDevice(deviceId: string, patch: Partial<PairedDevice>): void;
  setAlgorithm(deviceId: string, patch: Partial<AlgorithmParameters>): void;

  addCgmReading(deviceId: string, raw: number, timestamp: number): void;
  addBgmReading(value: number, timestamp?: number): void;
  addActivitySample(sample: Omit<ActivitySample, 'id'>): void;
  markUploaded(ids: string[]): void;
  setUploading(uploading: boolean, error?: string | null): void;
  clearReadings(): void;
  /** Wipes every stored slice back to the first-run state (settings included). */
  resetAll(): void;
}

/** First-run values, kept in one place so resetAll and the initial store agree. */
const INITIAL = {
  language: 'en' as Language,
  unit: 'mg/dL' as GlucoseUnit,
  viewMode: 'glucose' as ViewMode,
  therapy: { targetLow: 70, targetHigh: 180, alertsEnabled: true } as TherapySettings,
  simulator: { intervalSec: 10, scenario: 'normal', timeScale: 1, paused: false } as SimulatorOptions,
  autoUpload: true,

  devices: [] as PairedDevice[],
  activeDeviceId: null as string | null,
  connection: 'disconnected' as ConnectionState,
  discovered: [] as DiscoveredDevice[],
  scanning: false,

  readings: [] as GlucoseReading[],
  events: [] as ScenarioEvent[],
  activity: [] as ActivitySample[],
  lastReadingAt: null as number | null,
  uploading: false,
  lastUploadAt: null as number | null,
  lastUploadError: null as string | null,
};

function computeTrend(history: GlucoseReading[], next: number): Trend {
  const ref = history[history.length - 3] ?? history[history.length - 1];
  if (!ref) return 'unknown';
  const perReading = (next - ref.value) / Math.max(1, Math.min(3, history.length));
  if (perReading > 3) return 'up';
  if (perReading > 1) return 'upSlight';
  if (perReading < -3) return 'down';
  if (perReading < -1) return 'downSlight';
  return 'flat';
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      therapy: { ...INITIAL.therapy },
      simulator: { ...INITIAL.simulator },

      setLanguage: (language) => set({ language }),
      setUnit: (unit) => set({ unit }),
      setTherapy: (patch) => set({ therapy: { ...get().therapy, ...patch } }),
      setSimulator: (patch) =>
        set((s) => {
          const simulator = { ...s.simulator, ...patch };
          if (patch.scenario === undefined || patch.scenario === s.simulator.scenario) return { simulator };
          const event: ScenarioEvent = { id: newId(), timestamp: simClock.now(), kind: 'scenario', from: s.simulator.scenario, to: patch.scenario };
          return { simulator, events: [...s.events, event].slice(-MAX_READINGS) };
        }),
      setAutoUpload: (autoUpload) => set({ autoUpload }),
      setViewMode: (viewMode) => set({ viewMode }),

      setScanning: (scanning) => set({ scanning }),
      addDiscovered: (device) =>
        set((s) => (s.discovered.some((d) => d.id === device.id) ? s : { discovered: [...s.discovered, device] })),
      clearDiscovered: () => set({ discovered: [] }),
      pairDevice: (device, info) =>
        set((s) => {
          if (s.devices.some((d) => d.id === device.id)) return s;
          const paired: PairedDevice = {
            ...device,
            info,
            algorithm: { ...DEFAULT_ALGORITHM },
            sensorStartedAt: simClock.now(),
            lifetimeDays: DEFAULT_LIFETIME_DAYS,
            pairedAt: simClock.now(),
          };
          return { devices: [...s.devices, paired] };
        }),
      forgetDevice: (deviceId) =>
        set((s) => ({
          devices: s.devices.filter((d) => d.id !== deviceId),
          activeDeviceId: s.activeDeviceId === deviceId ? null : s.activeDeviceId,
          connection: s.activeDeviceId === deviceId ? 'disconnected' : s.connection,
        })),
      setActiveDevice: (activeDeviceId) => set({ activeDeviceId }),
      setConnection: (connection) => set({ connection }),
      updateDevice: (deviceId, patch) =>
        set((s) => ({ devices: s.devices.map((d) => (d.id === deviceId ? { ...d, ...patch } : d)) })),
      setAlgorithm: (deviceId, patch) =>
        set((s) => ({
          devices: s.devices.map((d) => (d.id === deviceId ? { ...d, algorithm: { ...d.algorithm, ...patch } } : d)),
        })),

      addCgmReading: (deviceId, raw, timestamp) =>
        set((s) => {
          const device = s.devices.find((d) => d.id === deviceId);
          const algo = device?.algorithm ?? DEFAULT_ALGORITHM;
          const cgmHistory = s.readings.filter((r) => r.source === 'cgm' && r.deviceId === deviceId);
          const window = Math.max(1, algo.smoothingWindow);
          const recentRaw = [...cgmHistory.slice(-(window - 1)).map((r) => r.raw), raw];
          const smoothed = recentRaw.reduce((a, b) => a + b, 0) / recentRaw.length;
          const value = Math.round(smoothed * algo.calibrationSlope + algo.calibrationOffset);
          const reading: GlucoseReading = {
            id: newId(),
            deviceId,
            source: 'cgm',
            timestamp,
            raw,
            value,
            trend: computeTrend(cgmHistory, value),
            uploaded: false,
          };
          return { readings: [...s.readings, reading].slice(-MAX_READINGS), lastReadingAt: timestamp };
        }),
      addBgmReading: (value, timestamp = simClock.now()) =>
        set((s) => {
          const reading: GlucoseReading = {
            id: newId(),
            deviceId: 'manual',
            source: 'bgm',
            timestamp,
            raw: value,
            value,
            trend: 'unknown',
            uploaded: false,
          };
          return { readings: [...s.readings, reading].slice(-MAX_READINGS) };
        }),
      addActivitySample: (sample) =>
        set((s) => ({ activity: [...s.activity, { ...sample, id: newId() }].slice(-MAX_ACTIVITY) })),
      markUploaded: (ids) => {
        const idSet = new Set(ids);
        set((s) => ({
          readings: s.readings.map((r) => (idSet.has(r.id) ? { ...r, uploaded: true } : r)),
          lastUploadAt: Date.now(),
          lastUploadError: null,
        }));
      },
      setUploading: (uploading, error = null) => set({ uploading, lastUploadError: error }),
      clearReadings: () => set({ readings: [], events: [], activity: [], lastReadingAt: null }),
      resetAll: () => set({ ...INITIAL, therapy: { ...INITIAL.therapy }, simulator: { ...INITIAL.simulator } }),
    }),
    {
      name: 'cgm-demo-basic-atari',
      storage: createJSONStorage(() => AsyncStorage),
      // Deep-merge nested option objects so that fields added in newer builds keep their defaults.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        return { ...current, ...p, simulator: { ...current.simulator, ...p.simulator }, therapy: { ...current.therapy, ...p.therapy } };
      },
      partialize: (s) => ({
        language: s.language,
        unit: s.unit,
        viewMode: s.viewMode,
        therapy: s.therapy,
        simulator: s.simulator,
        autoUpload: s.autoUpload,
        devices: s.devices,
        activeDeviceId: s.activeDeviceId,
        readings: s.readings,
        events: s.events,
        activity: s.activity,
        lastReadingAt: s.lastReadingAt,
        lastUploadAt: s.lastUploadAt,
      }),
    },
  ),
);

// Derived selectors -------------------------------------------------------

export function selectActiveDevice(s: AppState): PairedDevice | undefined {
  return s.devices.find((d) => d.id === s.activeDeviceId);
}

export function selectLatestCgm(s: AppState): GlucoseReading | undefined {
  for (let i = s.readings.length - 1; i >= 0; i -= 1) {
    if (s.readings[i].source === 'cgm') return s.readings[i];
  }
  return undefined;
}

export function selectPendingUploads(s: AppState): GlucoseReading[] {
  return s.readings.filter((r) => !r.uploaded);
}
