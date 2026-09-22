import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStrings } from '@/core/i18n';
import { useAppStore } from '@/core/store/appStore';

import { colors, fonts, spacing } from '../theme';

/**
 * Global view-mode toggle pinned to the top-left corner, mirroring the speed
 * chip on the right. Switches the Home card/chart and the Readings list
 * between raw glucose and the derived health index (%).
 */
export function ViewModeControl() {
  const t = useStrings();
  const insets = useSafeAreaInsets();
  const viewMode = useAppStore((s) => s.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const health = viewMode === 'health';

  return (
    <View style={[styles.host, { top: insets.top + 6 }]} pointerEvents="box-none">
      <Pressable
        onPress={() => setViewMode(health ? 'glucose' : 'health')}
        style={[styles.chip, health && styles.chipActive]}
        accessibilityLabel={t.mode.label}
        testID="view-mode"
      >
        <Ionicons name={health ? 'heart-circle-outline' : 'water-outline'} size={13} color={health ? '#fff' : colors.textSecondary} />
        <Text style={[styles.chipText, health && styles.chipTextActive]}>{health ? t.mode.health : t.mode.glucose}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: spacing.sm, zIndex: 100 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 13,
    paddingHorizontal: 9,
    height: 26,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...fonts.caption, fontWeight: '700', color: colors.textSecondary, marginLeft: 4 },
  chipTextActive: { color: '#fff' },
});
