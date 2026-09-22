import { Platform } from 'react-native';

export interface Coords {
  lat: number;
  lon: number;
}

/**
 * Best-effort device location. Only wired up on web (browser geolocation);
 * resolves to null anywhere else or if the user denies/it's unavailable.
 * Callers must handle the null case — there is no native fallback.
 */
export function getLocation(): Promise<Coords | null> {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: Coords | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    // Belt-and-suspenders timeout: a pending permission prompt can leave the
    // browser API's own `timeout` option unfired, and this must never hang
    // an emergency-alert flow.
    const timer = setTimeout(() => finish(null), 4000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        finish({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        clearTimeout(timer);
        finish(null);
      },
      { timeout: 4000 },
    );
  });
}

export function hospitalSearchUrl(coords: Coords | null): string {
  if (coords) return `https://www.google.com/maps/search/hospital+emergency+room/@${coords.lat},${coords.lon},14z`;
  return 'https://www.google.com/maps/search/?api=1&query=hospital+emergency+room';
}

export function formatCoords(coords: Coords): string {
  return `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`;
}
