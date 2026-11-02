import type { ConnectionState, DeviceInfo, DiscoveredDevice, SimulatorOptions, UserEventKind } from '../types';

export type Unsubscribe = () => void;

export interface RawReadingEvent {
  deviceId: string;
  timestamp: number;
  /** Uncalibrated glucose, mg/dL */
  raw: number;
  /** Blood ketone (beta-hydroxybutyrate), mmol/L */
  ketone: number;
  /** Blood lactate, mmol/L */
  lactate: number;
}

export interface StatusEvent {
  deviceId: string;
  connection: ConnectionState;
  batteryLevel: number;
}

/**
 * Abstraction over the physical link to a CGM sensor.
 *
 * Web / development builds use SimulatedTransport.
 * A native BLE implementation (e.g. react-native-ble-plx) must satisfy this
 * same interface so that screens and the store stay unchanged.
 */
export interface CgmTransport {
  startScan(onFound: (device: DiscoveredDevice) => void): Unsubscribe;
  connect(deviceId: string): Promise<DeviceInfo>;
  disconnect(): Promise<void>;
  onReading(listener: (event: RawReadingEvent) => void): Unsubscribe;
  onStatus(listener: (event: StatusEvent) => void): Unsubscribe;
  /** Optional hooks that only a simulator can honour. */
  simulator?: {
    setOptions(options: SimulatorOptions): void;
    dropConnection(): void;
    /** Feeds a logged meal/workout/sleep/dose into the virtual metabolism. */
    logEvent(kind: UserEventKind): void;
  };
}
