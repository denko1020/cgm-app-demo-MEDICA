import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, spacing } from '../theme';

interface ScreenProps extends PropsWithChildren {
  title?: string;
  /** Rendered on the right side of the large title row */
  headerRight?: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}

export function Screen({ title, headerRight, scroll = true, contentStyle, children }: ScreenProps) {
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
      <ScrollView contentContainerStyle={[styles.content, contentStyle]} keyboardShouldPersistTaps="handled">
        {header}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xl, flexGrow: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 40,
    paddingBottom: spacing.md,
  },
  title: { ...fonts.largeTitle, color: colors.text },
});
