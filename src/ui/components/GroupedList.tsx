import { Ionicons } from '@expo/vector-icons';
import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, shadow, spacing } from '../theme';

interface SectionProps extends PropsWithChildren {
  title?: string;
  footer?: string;
}

/** iOS-style grouped list section: uppercase header, white card, hairline separators. */
export function Section({ title, footer, children }: SectionProps) {
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text> : null}
      <View style={styles.card}>{children}</View>
      {footer ? <Text style={styles.sectionFooter}>{footer}</Text> : null}
    </View>
  );
}

interface RowProps {
  label: string;
  value?: string | number;
  valueColor?: string;
  right?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  last?: boolean;
  subtitle?: string;
}

export function Row({ label, value, valueColor, right, onPress, chevron, destructive, last, subtitle }: RowProps) {
  const body = (
    <View style={[styles.row, last && styles.rowLast]}>
      <View style={styles.rowLabelWrap}>
        <Text style={[styles.rowLabel, destructive && { color: colors.red }, onPress && !destructive && !chevron && { color: colors.primary }]}>
          {label}
        </Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {value !== undefined ? <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>{String(value)}</Text> : null}
      {right}
      {chevron ? <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} style={{ marginLeft: spacing.sm }} /> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {body}
    </Pressable>
  );
}

export function EmptyRow({ text }: { text: string }) {
  return (
    <View style={[styles.row, styles.rowLast]}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xl },
  sectionTitle: {
    ...fonts.footnote,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionFooter: {
    ...fonts.footnote,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    marginLeft: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabelWrap: { flex: 1 },
  rowLabel: { ...fonts.body, color: colors.text },
  rowSubtitle: { ...fonts.footnote, color: colors.textSecondary, marginTop: 2 },
  rowValue: { ...fonts.body, color: colors.textSecondary, marginLeft: spacing.md },
  pressed: { opacity: 0.6 },
  emptyText: { ...fonts.body, color: colors.textTertiary },
});
