import { Ionicons } from '@expo/vector-icons';
import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TOUCH, createStyles, fonts, radius, spacing, tabular, useColors } from '../theme';

interface SectionProps extends PropsWithChildren {
  title?: string;
  footer?: string;
}

/**
 * A section of the guide's quiet panel: a sentence-case heading, one surface
 * with a 1px border, rows split by dividers. No shadow and no nesting — the
 * guide separates by plane and rule instead.
 */
export function Section({ title, footer, children }: SectionProps) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
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
  const c = useColors();
  const styles = useStyles();
  const body = (
    <View style={[styles.row, last && styles.rowLast]}>
      <View style={styles.rowLabelWrap}>
        <Text style={[styles.rowLabel, destructive && { color: c.red }, onPress && !destructive && !chevron && { color: c.primary }]}>
          {label}
        </Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {value !== undefined ? <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>{String(value)}</Text> : null}
      {right}
      {chevron ? <Ionicons name="chevron-forward" size={18} color={c.textTertiary} style={{ marginLeft: spacing.sm }} /> : null}
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
  const styles = useStyles();
  return (
    <View style={[styles.row, styles.rowLast]}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const useStyles = createStyles((c) =>
  StyleSheet.create({
    section: { marginTop: spacing.xl },
    sectionTitle: {
      ...fonts.footnote,
      fontWeight: '600',
      color: c.heading,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    sectionFooter: {
      ...fonts.caption,
      color: c.textTertiary,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    card: {
      marginHorizontal: spacing.lg,
      backgroundColor: c.background,
      borderRadius: radius.card,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: TOUCH,
      paddingVertical: spacing.md,
      paddingLeft: spacing.lg,
      paddingRight: spacing.lg,
      marginLeft: 0,
      borderBottomWidth: 1,
      borderColor: c.separator,
    },
    rowLast: { borderBottomWidth: 0 },
    rowLabelWrap: { flex: 1 },
    rowLabel: { ...fonts.body, color: c.text },
    rowSubtitle: { ...fonts.caption, color: c.textTertiary, marginTop: 2 },
    rowValue: { ...fonts.body, ...tabular, color: c.textSecondary, marginLeft: spacing.md },
    pressed: { backgroundColor: c.surfaceAlt },
    emptyText: { ...fonts.body, color: c.textTertiary },
  }),
);
