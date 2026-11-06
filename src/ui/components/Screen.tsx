import type { PropsWithChildren, RefObject } from 'react';
import { ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createStyles, fonts, spacing } from '../theme';
import { NoScrollEdgeEffect } from './NoScrollEdgeEffect';

interface ScreenProps extends PropsWithChildren {
  title?: string;
  /** Rendered on the right side of the large title row */
  headerRight?: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  /** Handle on the scroll view, so a screen can jump to one of its sections. */
  scrollRef?: RefObject<ScrollView | null>;
}

export function Screen({ title, headerRight, scroll = true, contentStyle, scrollRef, children }: ScreenProps) {
  const styles = useStyles();
  const header = title ? (
    <View style={styles.titleRow}>
      <Text style={styles.title}>{title}</Text>
      {headerRight ? <View>{headerRight}</View> : null}
    </View>
  ) : null;

  if (!scroll) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        {header}
        <View style={[styles.content, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <NoScrollEdgeEffect>
        <ScrollView ref={scrollRef} contentContainerStyle={[styles.content, contentStyle]} keyboardShouldPersistTaps="handled">
          {header}
          {children}
        </ScrollView>
      </NoScrollEdgeEffect>
    </SafeAreaView>
  );
}

const useStyles = createStyles((c) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    content: { paddingBottom: spacing.xl, flexGrow: 1 },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.md,
    },
    title: { ...fonts.largeTitle, color: c.heading },
  }),
);
