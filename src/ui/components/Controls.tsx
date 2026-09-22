import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Switch, Text, View, type SwitchProps } from 'react-native';

import { colors, fonts, radius, spacing } from '../theme';

interface AccentSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

/**
 * Switch with the accent blue as its "on" track/thumb colour. `activeThumbColor`
 * is supported by react-native-web at runtime but missing from RN's own type
 * defs, hence the cast.
 */
export function AccentSwitch({ value, onValueChange }: AccentSwitchProps) {
  const extra = { activeThumbColor: colors.background } as Partial<SwitchProps>;
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
      thumbColor={colors.background}
      {...extra}
    />
  );
}

interface SegmentedProps<T extends string | number> {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string | number>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={String(o.value)} onPress={() => onChange(o.value)} style={[styles.segment, active && styles.segmentActive]}>
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  format?: (v: number) => string;
}

export function Stepper({ value, onChange, step = 1, min = -Infinity, max = Infinity, format }: StepperProps) {
  const dec = () => onChange(Math.max(min, round(value - step)));
  const inc = () => onChange(Math.min(max, round(value + step)));
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperValue}>{format ? format(value) : String(value)}</Text>
      <Pressable onPress={dec} style={styles.stepBtn} disabled={value <= min}>
        <Ionicons name="remove-circle" size={22} color={value <= min ? colors.textTertiary : colors.primary} />
      </Pressable>
      <View style={styles.stepDivider} />
      <Pressable onPress={inc} style={styles.stepBtn} disabled={value >= max}>
        <Ionicons name="add-circle" size={22} color={value >= max ? colors.textTertiary : colors.primary} />
      </Pressable>
    </View>
  );
}

function round(v: number): number {
  return Math.round(v * 100) / 100;
}

const styles = StyleSheet.create({
  segmented: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, padding: 3 },
  segment: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.pill, minWidth: 48, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { ...fonts.footnote, color: colors.textSecondary },
  segmentTextActive: { color: '#FFFFFF', fontWeight: '700' },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepperValue: { ...fonts.body, color: colors.textSecondary, marginRight: spacing.md },
  stepBtn: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: colors.surfaceAlt, borderRadius: radius.pill },
  stepDivider: { width: 4 },
});
