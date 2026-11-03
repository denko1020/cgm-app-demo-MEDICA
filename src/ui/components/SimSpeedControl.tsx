import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStrings } from '@/core/i18n';
import { simClock } from '@/core/sim/simClock';
import { useAppStore } from '@/core/store/appStore';
import { TIME_SCALES } from '@/core/types';
import { formatTime } from '@/core/util/format';

import { createStyles, fonts, spacing, useColors } from '../theme';

/**
 * Global simulator speed toggle pinned to the top-right corner of the app.
 * Tap the chip to reveal the 1x–100x options; the chip also shows the
 * simulated clock while running faster than real time. The ⏸/▶ chip next to
 * it freezes the simulated clock and the virtual sensor.
 */
export function SimSpeedControl() {
  const t = useStrings();
  const c = useColors();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const timeScale = useAppStore((s) => s.simulator.timeScale);
  const paused = useAppStore((s) => s.simulator.paused);
  const setSimulator = useAppStore((s) => s.setSimulator);
  const [open, setOpen] = useState(false);
  const [simNow, setSimNow] = useState(simClock.now());

  useEffect(() => {
    const id = setInterval(() => setSimNow(simClock.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const accelerated = timeScale > 1;

  return (
    <View style={[styles.host, { top: insets.top + 6 }]} pointerEvents="box-none">
      {open ? (
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>{t.settings.timeScale}</Text>
          <View style={styles.options}>
            {TIME_SCALES.map((scale) => {
              const active = scale === timeScale;
              return (
                <Pressable
                  key={scale}
                  onPress={() => {
                    setSimulator({ timeScale: scale });
                    setOpen(false);
                  }}
                  style={[styles.option, active && styles.optionActive]}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>{scale}x</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
      <Pressable
        onPress={() => setSimulator({ paused: !paused })}
        style={[styles.chip, styles.pauseChip, paused && styles.chipPaused]}
        accessibilityLabel={paused ? t.settings.resume : t.settings.pause}
        testID="sim-pause"
      >
        <Ionicons name={paused ? 'play' : 'pause'} size={13} color={paused ? c.onAccent : c.textSecondary} />
      </Pressable>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={[styles.chip, accelerated && styles.chipActive, paused && styles.chipPaused]}
        accessibilityLabel={t.settings.timeScale}
      >
        <Ionicons
          name={paused ? 'pause' : accelerated ? 'play-forward' : 'time-outline'}
          size={13}
          color={accelerated || paused ? c.onAccent : c.textSecondary}
        />
        <Text style={[styles.chipText, (accelerated || paused) && styles.chipTextActive]}>{timeScale}x</Text>
        {accelerated || paused ? <Text style={styles.chipClock}>{formatTime(simNow).slice(0, 5)}</Text> : null}
      </Pressable>
    </View>
  );
}

const useStyles = createStyles((c) =>
  StyleSheet.create({
    host: { position: 'absolute', right: spacing.sm, zIndex: 100, flexDirection: 'row', alignItems: 'flex-start' },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: 13,
      paddingHorizontal: 9,
      height: 26,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.separator,
    },
    chipActive: { backgroundColor: c.tint, borderColor: c.tint },
    chipPaused: { backgroundColor: c.red, borderColor: c.red },
    pauseChip: { paddingHorizontal: 7, marginRight: 4 },
    chipText: { ...fonts.caption, fontWeight: '700', color: c.textSecondary, marginLeft: 4 },
    chipTextActive: { color: c.onAccent },
    chipClock: { ...fonts.caption, color: '#CFE0FE', marginLeft: 6 },
    panel: {
      marginRight: spacing.sm,
      backgroundColor: c.card,
      borderRadius: 10,
      padding: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.separator,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    panelLabel: { ...fonts.caption, color: c.textSecondary, marginBottom: 4 },
    options: { flexDirection: 'row' },
    option: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 2 },
    optionActive: { backgroundColor: c.tint },
    optionText: { ...fonts.footnote, color: c.text },
    optionTextActive: { color: c.onAccent, fontWeight: '700' },
  }),
);
