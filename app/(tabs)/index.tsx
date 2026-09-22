import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { useStrings } from '@/core/i18n';
import { simClock } from '@/core/sim/simClock';
import { selectActiveDevice, selectLatestCgm, selectPendingUploads, useAppStore } from '@/core/store/appStore';
import type { Trend } from '@/core/types';
import { formatTime, healthIndex, toDisplayUnit } from '@/core/util/format';
import { formatHba1c } from '@/core/util/hba1c';
import { GlucoseChart } from '@/ui/components/GlucoseChart';
import { Screen } from '@/ui/components/Screen';
import { StatusIndicator } from '@/ui/components/StatusIndicator';
import { colors, fonts, radius, shadow, spacing } from '@/ui/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const TREND_ICON: Record<Trend, IconName> = {
  up: 'arrow-up',
  upSlight: 'trending-up',
  flat: 'arrow-forward',
  downSlight: 'trending-down',
  down: 'arrow-down',
  unknown: 'remove',
};

/** Low <20%: red, 20–50%: orange, ≥50%: green — matches common device battery conventions. */
function batteryColor(level: number): string {
  if (level < 20) return colors.red;
  if (level < 50) return colors.orange;
  return colors.green;
}

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
  const hba1cUnit = useAppStore((s) => s.hba1cUnit);
  const viewMode = useAppStore((s) => s.viewMode);
  const profile = useAppStore((s) => s.profile);
  const therapy = useAppStore((s) => s.therapy);
  const readings = useAppStore((s) => s.readings);
  const events = useAppStore((s) => s.events);
  // Derived arrays must be memoised: a selector returning a fresh array re-renders forever.
  const cgm = useMemo(() => readings.filter((r) => r.source === 'cgm'), [readings]);

  const health = viewMode === 'health';
  const hba1c = viewMode === 'hba1c';

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

  const genderLabel =
    profile.gender === 'male' ? t.settings.genderMale : profile.gender === 'female' ? t.settings.genderFemale : t.settings.genderOther;

  const avgCgm = cgm.length ? cgm.reduce((sum, r) => sum + r.value, 0) / cgm.length : null;

  const chartWidth = Math.min(width, 430) - spacing.lg * 2;

  return (
    <Screen>
      <View style={styles.indicators}>
        <StatusIndicator icon="heart" label={t.home.liveData} active={live} activeColor={colors.green} />
        <StatusIndicator
          icon={battery > 20 ? 'battery-full' : 'battery-dead'}
          label={device ? `${battery}%` : '--'}
          active={!!device}
          activeColor={batteryColor(battery)}
        />
        <StatusIndicator
          icon="link"
          label={connection === 'connecting' ? t.home.connecting : connected ? t.home.connected : t.home.disconnected}
          active={connected}
          activeColor={colors.green}
        />
        <StatusIndicator icon="cloud-upload" label={uploaded ? t.home.uploaded : `${t.home.pending} ${pendingCount}`} active={uploaded} activeColor={colors.green} />
      </View>

      <View style={styles.profileCard}>
        <Text style={styles.profileName}>{profile.name}</Text>
        <Text style={styles.profileMeta}>
          {profile.age} · {profile.weightKg}kg · {profile.heightCm}cm · {genderLabel}
        </Text>
      </View>

      {hba1c ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.home.estimatedHba1c}</Text>
          {avgCgm !== null ? (
            <>
              <View style={styles.valueRow}>
                <Text style={[styles.value, { color: colors.text }]}>{formatHba1c(avgCgm, hba1cUnit)}</Text>
                <Text style={styles.unit}>{hba1cUnit}</Text>
              </View>
              <Text style={styles.meta}>{t.home.hba1cNote.replace('{n}', String(cgm.length))}</Text>
            </>
          ) : (
            <Text style={styles.empty}>{t.home.hba1cNoData}</Text>
          )}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{health ? t.home.currentHealth : t.home.currentGlucose}</Text>
          {latest ? (
            <>
              <View style={styles.valueRow}>
                <Text style={[styles.value, { color: statusColor }]}>{health ? healthIndex(latest.value) : toDisplayUnit(latest.value, unit)}</Text>
                <Text style={styles.unit}>{health ? '%' : unit}</Text>
                <Ionicons name={TREND_ICON[latest.trend]} size={40} color={statusColor} style={styles.trendIcon} />
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
      )}

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
  profileCard: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
  },
  profileName: { ...fonts.body, fontWeight: '700', color: colors.text },
  profileMeta: { ...fonts.footnote, color: colors.textSecondary, marginTop: 2 },
  card: {
    marginTop: spacing.lg,
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
  trendIcon: { marginLeft: spacing.md, marginBottom: 8 },
  status: { ...fonts.body, fontWeight: '600', marginTop: spacing.xs },
  meta: { ...fonts.footnote, color: colors.textSecondary, marginTop: spacing.xs },
  empty: { ...fonts.body, color: colors.textSecondary, marginTop: spacing.sm },
});
