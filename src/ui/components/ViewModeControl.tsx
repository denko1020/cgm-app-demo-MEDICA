import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStrings } from '@/core/i18n';
import { useAppStore } from '@/core/store/appStore';
import type { ViewMode } from '@/core/types';

import { colors, fonts, spacing } from '../theme';

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<ViewMode, IconName> = {
  glucose: 'water-outline',
  ketone: 'flame-outline',
  lactate: 'pulse-outline',
  hba1c: 'flask-outline',
};

/**
 * Global view-mode toggle pinned to the top-left corner, mirroring the speed
 * chip on the right. Switches the Home card/chart and the Readings list between
 * the three analytes the sensor measures and the estimated HbA1c derived from
 * them. Labelled with the lab abbreviations (GLU, KET, LAC) to stay readable at
 * chip size in every language.
 */
export function ViewModeControl() {
  const t = useStrings();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const viewMode = useAppStore((s) => s.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);

  // Home only: the mode it controls (Home's card/chart) isn't shown on the other tabs.
  if (pathname !== '/') return null;

  const options: { value: ViewMode; label: string }[] = [
    { value: 'glucose', label: t.mode.glucose },
    { value: 'ketone', label: t.mode.ketone },
    { value: 'lactate', label: t.mode.lactate },
    { value: 'hba1c', label: t.mode.hba1c },
  ];

  return (
    <View style={[styles.host, { top: insets.top + 6 }]} pointerEvents="box-none">
      <View style={styles.track} accessibilityLabel={t.mode.label} testID="view-mode">
        {options.map((o) => {
          const active = o.value === viewMode;
          return (
            <Pressable key={o.value} onPress={() => setViewMode(o.value)} style={[styles.chip, active && styles.chipActive]}>
              <Ionicons name={ICONS[o.value]} size={12} color={active ? '#fff' : colors.textSecondary} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: spacing.sm, zIndex: 100 },
  track: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 15,
    padding: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    paddingHorizontal: 6,
    height: 26,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...fonts.caption, fontWeight: '700', color: colors.textSecondary, marginLeft: 4 },
  chipTextActive: { color: '#fff' },
});
