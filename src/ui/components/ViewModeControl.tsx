import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStrings } from '@/core/i18n';
import { useAppStore } from '@/core/store/appStore';
import type { ViewMode } from '@/core/types';

import { colors, fonts, spacing } from '../theme';

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<ViewMode, IconName> = {
  glucose: 'water-outline',
  health: 'heart-circle-outline',
  hba1c: 'flask-outline',
};

/**
 * Global view-mode toggle pinned to the top-left corner, mirroring the speed
 * chip on the right. Cycles the Home card/chart and the Readings list
 * between raw glucose, the derived health index (%) and estimated HbA1c.
 */
export function ViewModeControl() {
  const t = useStrings();
  const insets = useSafeAreaInsets();
  const viewMode = useAppStore((s) => s.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);

  const options: { value: ViewMode; label: string }[] = [
    { value: 'glucose', label: t.mode.glucose },
    { value: 'health', label: t.mode.health },
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
    paddingHorizontal: 8,
    height: 26,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...fonts.caption, fontWeight: '700', color: colors.textSecondary, marginLeft: 4 },
  chipTextActive: { color: '#fff' },
});
