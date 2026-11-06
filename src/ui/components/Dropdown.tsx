import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TOUCH, createStyles, fonts, radius, spacing, stroke, useColors } from '../theme';

interface DropdownProps<T extends string | number> {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  /** Names the control for assistive tech, and titles the open list. */
  label: string;
}

/** Past this many rows the list scrolls instead of growing. */
const VISIBLE_ROWS = 6;

/**
 * The guide's dropdown: a 44pt field with a blue chevron that opens a list
 * where the current choice is a filled blue row. The list is a modal rather
 * than an absolutely positioned panel, because a settings row clips its own
 * overflow and the list has to be able to stand outside it.
 */
export function Dropdown<T extends string | number>({ options, value, onChange, label }: DropdownProps<T>) {
  const c = useColors();
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  const pick = (next: T) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: current?.label }}
        accessibilityState={{ expanded: open }}
        style={[styles.field, open && { borderColor: c.primary }]}
      >
        <Text style={styles.fieldText} numberOfLines={1}>
          {current?.label ?? ''}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={c.primary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* Swallows taps on the list itself, which would otherwise close it. */}
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView style={{ maxHeight: VISIBLE_ROWS * TOUCH }} bounces={false}>
              {options.map((o) => {
                const selected = o.value === value;
                return (
                  <Pressable
                    key={String(o.value)}
                    onPress={() => pick(o.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [
                      styles.option,
                      pressed && !selected && { backgroundColor: c.selected },
                      selected && { backgroundColor: c.primary },
                    ]}
                  >
                    <Text style={[styles.optionText, selected && { color: c.onAccent, fontWeight: '600' }]}>{o.label}</Text>
                    {selected ? <Ionicons name="checkmark" size={18} color={c.onAccent} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const useStyles = createStyles((c) =>
  StyleSheet.create({
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      minWidth: 150,
      height: TOUCH - 8,
      paddingHorizontal: spacing.md,
      borderWidth: stroke.field,
      borderColor: c.border,
      borderRadius: radius.control,
      backgroundColor: c.background,
    },
    fieldText: { ...fonts.footnote, color: c.text, flexShrink: 1 },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
    sheet: {
      width: 320,
      maxWidth: '100%',
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.popup,
      paddingVertical: spacing.md,
      overflow: 'hidden',
    },
    sheetTitle: {
      ...fonts.footnote,
      fontWeight: '600',
      color: c.heading,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: TOUCH,
      paddingHorizontal: spacing.lg,
    },
    optionText: { ...fonts.body, color: c.text },
  }),
);
