import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { useStrings } from '@/core/i18n';
import { simClock } from '@/core/sim/simClock';
import { selectActiveDevice, selectLatestCgm, selectPendingUploads, useAppStore } from '@/core/store/appStore';
import { formatTime, healthIndex, toDisplayUnit, trendArrow } from '@/core/util/format';
import { GlucoseChart } from '@/ui/components/GlucoseChart';
import { Screen } from '@/ui/components/Screen';
import { StatusIndicator } from '@/ui/components/StatusIndicator';
import { colors, fonts, radius, shadow, spacing } from '@/ui/theme';

export default function HomeScreen() {
  const t = useStrings();
  const { width } = useWindowDimensions();
  const connection = useAppStore((s) => s.connection);
  const lastReadingAt = useAppStore((s) => s.lastReadingAt);
  const intervalSec = useAppStore((s) => s.simulator.intervalSec);
  const device = useAppStore(selectActiveDevice);
  const latest = useAppStore(selectLatestCgm);
  const pendingCount = useAppStore((s) => selectPendingUploads(s).length);
  const unit = useAppStore((s) => s.unit);
  const health = useAppStore((s) => s.viewMode) === 'health';
  const therapy = useAppStore((s) => s.therapy);
  const readings = useAppStore((s) => s.readings);
  const events = useAppStore((s) => s.events);
  // Derived arrays must be memoised: a selector returning a fresh array re-renders forever.
  const cgm = useMemo(() => readings.filter((r) => r.source === 'cgm'), [readings]);

  // Re-render every second so "live data" fades out when readings stop (simulated clock).
  const [now, setNow] = useState(simClock.now());
  useEffect(() => {
    const id = setInterval(() => setNow(simClock.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const live = lastReadingAt !== null && now - lastReadingAt < intervalSec * 2000 && connection === 'connected';
  const battery = device?.info.batteryLevel ?? 0;
  const connected = connection === 'connected';
  const uploaded = pendingCount === 0;

  const status =
    latest === undefined ? null : latest.value < therapy.targetLow ? 'low' : latest.value > therapy.targetHigh ? 'high' : 'inRange';
  const statusColor = status === 'inRange' ? colors.green : status ? colors.red : colors.textSecondary;

  const chartWidth = Math.min(width, 430) - spacing.lg * 2;

  return (
    <Screen>
      <View style={styles.indicators}>
        <StatusIndicator icon="heart" label={t.home.liveData} active={live} />
        <StatusIndicator
          icon={battery > 20 ? 'battery-full' : 'battery-dead'}
          label={device ? `${battery}%` : '--'}
          active={!!device && battery > 20}
          activeColor={colors.green}
        />
        <StatusIndicator
          icon="link"
          label={connection === 'connecting' ? t.home.connecting : connected ? t.home.connected : t.home.disconnected}
          active={connected}
        />
        <StatusIndicator icon="cloud-upload" label={uploaded ? t.home.uploaded : `${t.home.pending} ${pendingCount}`} active={uploaded} activeColor={colors.green} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{health ? t.home.currentHealth : t.home.currentGlucose}</Text>
        {latest ? (
          <>
            <View style={styles.valueRow}>
              <Text style={[styles.value, { color: statusColor }]}>{health ? healthIndex(latest.value) : toDisplayUnit(latest.value, unit)}</Text>
              <Text style={styles.unit}>{health ? '%' : unit}</Text>
              <Text style={[styles.trend, { color: statusColor }]}>{trendArrow(latest.trend)}</Text>
            </View>
            <Text style={[styles.status, { color: statusColor }]}>
              {status === 'inRange' ? t.home.inRange : status === 'low' ? t.home.low : t.home.high}
            </Text>
            <Text style={styles.meta}>
              {t.home.lastReading} {formatTime(latest.timestamp)}
            </Text>
          </>
        ) : (
          <Text style={styles.empty}>{t.home.noData}</Text>
        )}
      </View>

      {cgm.length >= 2 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.home.recent}</Text>
          <GlucoseChart width={chartWidth - spacing.lg * 2} readings={cgm} events={events} therapy={therapy} health={health} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  indicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: 44,
  },
  card: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
    ...shadow.card,
  },
  cardTitle: { ...fonts.footnote, color: colors.textSecondary, textTransform: 'uppercase' },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.sm },
  value: { fontSize: 56, fontWeight: '700', lineHeight: 60 },
  unit: { ...fonts.body, color: colors.textSecondary, marginLeft: spacing.sm, marginBottom: 8 },
  trend: { fontSize: 36, marginLeft: spacing.md, marginBottom: 4 },
  status: { ...fonts.body, fontWeight: '600', marginTop: spacing.xs },
  meta: { ...fonts.footnote, color: colors.textSecondary, marginTop: spacing.xs },
  empty: { ...fonts.body, color: colors.textSecondary, marginTop: spacing.sm },
});
