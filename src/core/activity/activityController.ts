import { useAppStore } from '../store/appStore';
import type { ActivityTransport } from './ActivityTransport';
import { createActivityTransport } from './createActivityTransport';

/**
 * Glue between the activity transport and the store, mirroring cgmController.
 * The stream runs whenever the app is open (a pedometer does not need a
 * paired CGM); simulator options reach the transport through the same
 * subscription the CGM link uses.
 */
class ActivityController {
  readonly transport: ActivityTransport = createActivityTransport();
  private booted = false;

  bootstrap() {
    if (this.booted) return;
    this.booted = true;
    const store = useAppStore;

    this.transport.onSample((e) => store.getState().addActivitySample(e));
    store.subscribe((s, prev) => {
      if (s.simulator !== prev.simulator) this.transport.simulator?.setOptions(s.simulator);
    });

    const restore = () => {
      this.transport.simulator?.setOptions(store.getState().simulator);
      this.transport.start();
    };
    if (store.persist.hasHydrated()) restore();
    else store.persist.onFinishHydration(restore);
  }
}

export const activityController = new ActivityController();
