import { simClock } from '../sim/simClock';
import { useAppStore, selectPendingUploads } from '../store/appStore';
import type { SimulatorOptions } from '../types';
import { MockUploadService } from '../upload/UploadService';
import type { CgmTransport } from './CgmTransport';
import { createTransport } from './createTransport';

/**
 * Glue between the transport (device link), the upload service and the store.
 * Screens call these functions; they never touch the transport directly.
 */
class CgmController {
  readonly transport: CgmTransport = createTransport();
  readonly uploader = new MockUploadService();
  private stopScan: (() => void) | null = null;
  private autoUploadTimer: ReturnType<typeof setTimeout> | null = null;
  private booted = false;

  bootstrap() {
    if (this.booted) return;
    this.booted = true;
    const store = useAppStore;

    this.transport.onReading((e) => {
      store.getState().addCgmReading(e.deviceId, e.raw, e.timestamp);
      this.scheduleAutoUpload();
    });
    this.transport.onStatus((e) => {
      const s = store.getState();
      s.setConnection(e.connection);
      const device = s.devices.find((d) => d.id === e.deviceId);
      if (device && device.info.batteryLevel !== e.batteryLevel) {
        s.updateDevice(e.deviceId, { info: { ...device.info, batteryLevel: e.batteryLevel } });
      }
    });

    const applySimulator = (options: SimulatorOptions) => {
      simClock.setScale(options.paused ? 0 : options.timeScale);
      this.transport.simulator?.setOptions(options);
    };
    store.subscribe((s, prev) => {
      if (s.simulator !== prev.simulator) applySimulator(s.simulator);
    });

    // Persisted state arrives asynchronously from AsyncStorage; restore the
    // last session only once it has been loaded.
    const restore = () => {
      const { activeDeviceId, devices, simulator, lastReadingAt } = store.getState();
      if (lastReadingAt) simClock.ensureAtLeast(lastReadingAt);
      applySimulator(simulator);
      if (activeDeviceId && devices.some((d) => d.id === activeDeviceId)) {
        void this.connect(activeDeviceId);
      }
    };
    if (store.persist.hasHydrated()) restore();
    else store.persist.onFinishHydration(restore);
  }

  startScan() {
    const s = useAppStore.getState();
    if (s.scanning) return;
    s.clearDiscovered();
    s.setScanning(true);
    this.stopScan = this.transport.startScan((d) => useAppStore.getState().addDiscovered(d));
    setTimeout(() => this.stopScanning(), 6000);
  }

  stopScanning() {
    this.stopScan?.();
    this.stopScan = null;
    useAppStore.getState().setScanning(false);
  }

  async connect(deviceId: string) {
    const s = useAppStore.getState();
    if (s.activeDeviceId && s.activeDeviceId !== deviceId && s.connection !== 'disconnected') {
      await this.transport.disconnect();
    }
    s.setActiveDevice(deviceId);
    try {
      const info = await this.transport.connect(deviceId);
      const found = s.discovered.find((d) => d.id === deviceId) ?? s.devices.find((d) => d.id === deviceId);
      useAppStore.getState().pairDevice(found ?? { id: deviceId, name: deviceId, rssi: 0 }, info);
      useAppStore.getState().updateDevice(deviceId, { info });
    } catch (err) {
      useAppStore.getState().setConnection('disconnected');
      throw err;
    }
  }

  async disconnect() {
    await this.transport.disconnect();
  }

  async forget(deviceId: string) {
    const s = useAppStore.getState();
    if (s.activeDeviceId === deviceId) await this.transport.disconnect();
    useAppStore.getState().forgetDevice(deviceId);
  }

  async uploadPending() {
    const s = useAppStore.getState();
    const pending = selectPendingUploads(s);
    if (s.uploading || pending.length === 0) return;
    s.setUploading(true);
    try {
      const { uploadedIds } = await this.uploader.upload(pending);
      useAppStore.getState().markUploaded(uploadedIds);
      useAppStore.getState().setUploading(false);
    } catch (err) {
      useAppStore.getState().setUploading(false, err instanceof Error ? err.message : String(err));
    }
  }

  private scheduleAutoUpload() {
    if (!useAppStore.getState().autoUpload) return;
    // Batch readings that arrive within the window without resetting the timer,
    // otherwise a fast simulator (100x) would postpone the upload indefinitely.
    if (this.autoUploadTimer) return;
    this.autoUploadTimer = setTimeout(() => {
      this.autoUploadTimer = null;
      void this.uploadPending();
    }, 1500);
  }
}

export const cgmController = new CgmController();
