import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Switch, Text, View, type SwitchProps } from 'react-native';

import { TOUCH, createStyles, fonts, radius, spacing, tabular, useColors } from '../theme';

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
  const c = useColors();
  // The thumb stays white in both themes: it has to read against the grey of
  // the off track and the accent blue of the on track alike.
  const extra = { activeThumbColor: '#FFFFFF' } as Partial<SwitchProps>;
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: c.disabled, true: c.primary }}
      thumbColor="#FFFFFF"
      {...extra}
    />
  );
}

interface SegmentedProps<T extends string | number> {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * The guide's segmented control: a quiet track holding one white pill. The
 * selection reads as a raised plane with blue text, not as a blue fill, which
 * keeps the filled blue free for the screen's one primary action.
 */
export function Segmented<T extends string | number>({ options, value, onChange }: SegmentedProps<T>) {
  const styles = useStyles();
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]} numberOfLines={1}>
              {o.label}
            </Text>
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
  const c = useColors();
  const styles = useStyles();
  const dec = () => onChange(Math.max(min, round(value - step)));
  const inc = () => onChange(Math.min(max, round(value + step)));
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperValue}>{format ? format(value) : String(value)}</Text>
      <Pressable onPress={dec} style={styles.stepBtn} disabled={value <= min}>
        <Ionicons name="remove" size={20} color={value <= min ? c.gray : c.primary} />
      </Pressable>
      <View style={styles.stepDivider} />
      <Pressable onPress={inc} style={styles.stepBtn} disabled={value >= max}>
        <Ionicons name="add" size={20} color={value >= max ? c.gray : c.primary} />
      </Pressable>
    </View>
  );
}

function round(v: number): number {
  return Math.round(v * 100) / 100;
}

const useStyles = createStyles((c) =>
  StyleSheet.create({
    segmented: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.separator,
      borderRadius: radius.pill,
      padding: 3,
      gap: 3,
      maxWidth: 230,
    },
    segment: { flexShrink: 0, paddingVertical: 7, paddingHorizontal: 12, borderRadius: radius.pill, minWidth: 48, alignItems: 'center' },
    segmentActive: { backgroundColor: c.background, borderWidth: 1, borderColor: c.border, paddingVertical: 6 },
    segmentText: { ...fonts.caption, color: c.textTertiary },
    segmentTextActive: { color: c.primary, fontWeight: '700' },
    stepper: { flexDirection: 'row', alignItems: 'center' },
    stepperValue: { ...fonts.body, ...tabular, color: c.text, marginRight: spacing.md },
    stepBtn: {
      width: TOUCH - 8,
      height: TOUCH - 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.separator,
      borderRadius: radius.control,
    },
    stepDivider: { width: spacing.xs },
  }),
);
