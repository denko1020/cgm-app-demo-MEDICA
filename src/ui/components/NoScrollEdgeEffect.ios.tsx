import type { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { ScrollViewMarker } from 'react-native-screens/experimental';

/**
 * Hides the iOS 26 scroll edge effect on the top edge of the wrapped scroll view.
 *
 * UIKit blurs and fades the first few points of a scroll view so content slides
 * under the navigation bar legibly. Our screens hide the native header and pin
 * their own chips (view mode, sim speed) over the top of the scroll view, so the
 * effect reads as fog behind those chips instead. Android has no equivalent,
 * which is why the haze only ever showed up on iOS.
 *
 * `scrollEdgeEffects` on the Stack's screenOptions is silently dropped once a
 * scroll view sits inside nested navigators, so react-native-screens exposes
 * ScrollViewMarker as the supported way to configure a specific scroll view.
 * It must wrap exactly one child and that child must be the scroll view.
 */
export function NoScrollEdgeEffect({ children }: { children: ReactElement }) {
  return (
    <ScrollViewMarker style={styles.marker} scrollEdgeEffects={{ top: 'hidden' }}>
      {children}
    </ScrollViewMarker>
  );
}

const styles = StyleSheet.create({ marker: { flex: 1 } });
