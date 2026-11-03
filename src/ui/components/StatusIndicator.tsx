import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { createStyles, fonts, useColors } from '../theme';

interface StatusIndicatorProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  /** Colour used when active (defaults to red like the reference screen) */
  activeColor?: string;
}

/** Circular outlined icon with a caption, as on the reference Home screen. */
export function StatusIndicator({ icon, label, active, activeColor }: StatusIndicatorProps) {
  const c = useColors();
  const styles = useStyles();
  const color = active ? (activeColor ?? c.red) : c.textTertiary;
  return (
    <View style={styles.wrap}>
      <View style={[styles.circle, { borderColor: color }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.label, { color: active ? c.text : c.textTertiary }]}>{label}</Text>
    </View>
  );
}

const useStyles = createStyles((c) =>
  StyleSheet.create({
    wrap: { alignItems: 'center', width: 84 },
    circle: { width: 44, height: 44, borderRadius: 22, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
    label: { ...fonts.caption, marginTop: 6, textAlign: 'center' },
  }),
);
