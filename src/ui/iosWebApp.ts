import { Platform } from 'react-native';

/**
 * How far the iOS 26 Liquid Glass fade reaches past the status bar, in points.
 *
 * A home-screen web app keeps its view behind the status bar (see the
 * `black-translucent` tag in public/index.html), and iOS fades a glass effect
 * over that strip plus roughly this much of the page below it. Measured at
 * ~36pt on an iPhone 16 Pro; 40 leaves a little room. Anything drawn inside the
 * band comes out blurred and washed out, so the root layout pads the app down
 * past it and leaves the effect nothing but flat background colour to blur.
 */
export const IOS_WEB_APP_FOG = 40;

/**
 * True only for the app launched from the iOS home screen, where that fade
 * exists. Plain Safari keeps its own bars above the page, and no other platform
 * draws anything like it. Read once: the display mode cannot change at runtime.
 */
export const isIosWebApp = (() => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const ios = /iPad|iPhone|iPod/.test(nav.userAgent) || (/Macintosh/.test(nav.userAgent) && nav.maxTouchPoints > 1);
  const standalone =
    nav.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches;
  return ios && standalone;
})();
