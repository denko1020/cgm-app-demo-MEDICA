import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, radius, shadow, spacing } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled }: ButtonProps) {
  const bg = variant === 'primary' ? colors.primary : variant === 'destructive' ? colors.red : colors.card;
  const fg = variant === 'secondary' ? colors.primary : '#FFFFFF';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        variant === 'secondary' && styles.secondaryBorder,
        variant === 'primary' && shadow.card,
        { backgroundColor: bg, opacity: pressed || disabled ? 0.6 : 1 },
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.text, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: 13,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  secondaryBorder: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator },
  text: { ...fonts.body, fontWeight: '600' },
});
