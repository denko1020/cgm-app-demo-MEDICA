import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { TOUCH, createStyles, fonts, radius, spacing, stroke, useColors } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  loading?: boolean;
  disabled?: boolean;
}

/**
 * The guide's button: a 2px stroke that fills on press, 4px corners, 44 high.
 *
 * `primary` is the one filled blue the guide allows per screen; `secondary` is
 * the default outline state; `destructive` is the same shape in the fail ink,
 * since the guide keeps red for meaning rather than for emphasis. Disabled is a
 * flat grey fill, which the guide exempts from the contrast floor because the
 * control is also marked disabled to assistive tech.
 */
export function Button({ title, onPress, variant = 'primary', loading, disabled }: ButtonProps) {
  const c = useColors();
  const styles = useStyles();
  const accent = variant === 'destructive' ? c.red : c.primary;
  const filled = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading) }}
      style={({ pressed }) => [
        styles.btn,
        { borderColor: accent, backgroundColor: filled || pressed ? accent : c.background },
        disabled && { backgroundColor: c.disabled, borderColor: c.disabled },
      ]}
    >
      {({ pressed }) => {
        const label = disabled ? c.onAccent : filled || pressed ? c.onAccent : accent;
        return loading ? <ActivityIndicator color={label} /> : <Text style={[styles.text, { color: label }]}>{title}</Text>;
      }}
    </Pressable>
  );
}

const useStyles = createStyles(() =>
  StyleSheet.create({
    btn: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      minHeight: TOUCH,
      paddingHorizontal: spacing.xl,
      borderWidth: stroke.control,
      borderRadius: radius.control,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: { ...fonts.body, fontWeight: '600' },
  }),
);
