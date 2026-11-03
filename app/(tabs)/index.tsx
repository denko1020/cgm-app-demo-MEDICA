import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { cgmController } from '@/core/cgm/cgmController';
import { useLocaleTag, useStrings } from '@/core/i18n';
import { simClock } from '@/core/sim/simClock';
import { selectActiveDevice, selectLatestCgm, selectPendingUploads, useAppStore } from '@/core/store/appStore';
import { USER_EVENT_KINDS, type UserEventKind } from '@/core/types';
import { analyteSpec, analyteStatus, analyteTrend, analyteValue, formatAnalyte } from '@/core/util/analyte';
import { formatDateLabel, formatTime } from '@/core/util/format';
import { formatHba1c } from '@/core/util/hba1c';
import { getLocation, hospitalSearchUrl } from '@/core/util/location';
import { AnalyteChart } from '@/ui/components/AnalyteChart';
import { Screen } from '@/ui/components/Screen';
import { StatusIndicator } from '@/ui/components/StatusIndicator';
import { TrendTile } from '@/ui/components/TrendTile';
import { EVENT_ICON } from '@/ui/eventStyle';
import { type Colors, createStyles, fonts, radius, shadow, spacing, useColors } from '@/ui/theme';

type IconName = keyof typeof Ionicons.glyphMap;

/** Low <20%: red, 20-50%: orange, >=50%: the healthy blue the other indicators use. */
function batteryColor(level: number, c: Colors): string {
  if (level < 20) return c.red;
  if (level < 50) return c.orange;
  return c.statusActive;
}

export default function HomeScreen() {
  const t = useStrings();
  const c = useColors();
  const styles = useStyles();
  const localeTag = useLocaleTag();
  const router = useRouter();
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
  const [notice, setNotice] = useState<string | null>(null);
  // Derived arrays must be memoised: a selector returning a fresh array re-renders forever.
  const cgm = useMemo(() => readings.filter((r) => r.source === 'cgm'), [readings]);

  const hba1c = viewMode === 'hba1c';
  const analyte = hba1c ? 'glucose' : viewMode;
  const spec = useMemo(() => analyteSpec(analyte, therapy, unit), [analyte, therapy, unit]);

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

  const value = latest ? analyteValue(latest, analyte) : undefined;
  const status = value === undefined ? null : analyteStatus(value, spec);
  const statusColor = status === 'inRange' ? c.green : status ? c.red : c.textSecondary;
  // "High" reads as hyperglycaemia in every dictionary; ketone and lactate only ever run elevated.
  const statusLabel =
    status === 'inRange' ? t.home.inRange : status === 'low' ? t.home.low : analyte === 'glucose' ? t.home.high : t.home.elevated;

  const genderLabel =
    profile.gender === 'male' ? t.settings.genderMale : profile.gender === 'female' ? t.settings.genderFemale : t.settings.genderOther;

  const avgCgm = cgm.length ? cgm.reduce((sum, r) => sum + r.value, 0) / cgm.length : null;
  // The trend stored on a reading is the glucose one, so the dial recomputes it for whichever analyte is on screen.
  const trend = useMemo(() => analyteTrend(cgm, analyte, spec), [cgm, analyte, spec]);

  const chartWidth = Math.min(width, 430) - spacing.lg * 2;

  const cardTitle = hba1c
    ? t.home.estimatedHba1c
    : analyte === 'ketone'
      ? t.home.currentKetone
      : analyte === 'lactate'
        ? t.home.currentLactate
        : t.home.currentGlucose;

  const onFindHospital = async () => {
    const loc = await getLocation();
    void Linking.openURL(hospitalSearchUrl(loc));
  };

  const onLogEvent = (kind: UserEventKind) => {
    cgmController.logEvent(kind);
    setNotice(t.events.logged.replace('{name}', t.events[kind]));
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <Screen>
      <View style={styles.indicators}>
        <StatusIndicator icon="heart" label={t.home.liveData} active={live} activeColor={c.statusActive} />
        <StatusIndicator
          icon={battery > 20 ? 'battery-full' : 'battery-dead'}
          label={device ? `${battery}%` : '--'}
          active={!!device}
          activeColor={batteryColor(battery, c)}
        />
        <StatusIndicator
          icon="link"
          label={connection === 'connecting' ? t.home.connecting : connected ? t.home.connected : t.home.disconnected}
          active={connected}
          activeColor={c.statusActive}
        />
        <StatusIndicator icon="cloud-upload" label={uploaded ? t.home.uploaded : `${t.home.pending} ${pendingCount}`} active={uploaded} activeColor={c.statusActive} />
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileMeta}>
            {profile.age} · {profile.weightKg}kg · {profile.heightCm}cm · {genderLabel}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push({ pathname: '/settings', params: { section: 'profile' } })}
          style={styles.profileButton}
          accessibilityLabel={t.settings.profileSection}
          testID="open-profile"
        >
          <Ionicons name="person" size={20} color={c.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{cardTitle}</Text>
        <View style={styles.cardBody}>
          <View style={styles.readout}>
            {hba1c ? (
              avgCgm !== null ? (
                <>
                  <View style={styles.valueBox}>
                    <View style={styles.valueRow}>
                      <Text style={[styles.value, { color: c.text }]}>{formatHba1c(avgCgm, hba1cUnit)}</Text>
                      <Text style={styles.unit}>{hba1cUnit}</Text>
                    </View>
                  </View>
                  <Text style={styles.meta}>{t.home.hba1cNote.replace('{n}', String(cgm.length))}</Text>
                </>
              ) : (
                <Text style={styles.empty}>{t.home.hba1cNoData}</Text>
              )
            ) : latest && value !== undefined ? (
              <>
                <View style={styles.valueBox}>
                  <Text style={[styles.status, { color: statusColor }]}>{statusLabel}</Text>
                  <View style={styles.valueRow}>
                    <Text style={[styles.value, { color: statusColor }]}>{formatAnalyte(value, analyte, unit)}</Text>
                    <Text style={styles.unit}>{spec.unit}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>
                  {t.home.lastReading} {formatTime(latest.timestamp)}
                </Text>
              </>
            ) : (
              <Text style={styles.empty}>{t.home.noData}</Text>
            )}
          </View>

          <View style={styles.trendSlot}>
            {!hba1c && latest ? <TrendTile trend={trend} size={66} /> : null}
          </View>

          <View style={styles.actions}>
            <View style={styles.eventGrid}>
              {USER_EVENT_KINDS.map((kind) => (
                <Pressable
                  key={kind}
                  onPress={() => onLogEvent(kind)}
                  style={styles.eventButton}
                  hitSlop={2}
                  accessibilityLabel={`${t.events.title}: ${t.events[kind]}`}
                  testID={`log-${kind}`}
                >
                  <MaterialCommunityIcons name={EVENT_ICON[kind]} size={20} color={c.textSecondary} />
                </Pressable>
              ))}
            </View>
            <WideAction icon="clipboard" label={t.home.reports} onPress={() => router.push('/stats')} />
            <WideAction icon="medkit" label={t.home.findHospital} onPress={() => void onFindHospital()} />
          </View>
        </View>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      </View>

      {!hba1c && cgm.length >= 2 ? (
        <View style={styles.card}>
          <View style={styles.liveHeader}>
            <Text style={styles.cardTitle}>{t.home.recent}</Text>
            <Text style={styles.liveDate}>{formatDateLabel(cgm[cgm.length - 1].timestamp, localeTag)}</Text>
          </View>
          <AnalyteChart width={chartWidth - spacing.lg * 2} readings={cgm} events={events} therapy={therapy} analyte={analyte} unit={unit} />
        </View>
      ) : null}
    </Screen>
  );
}

interface WideActionProps {
  icon: IconName;
  label: string;
  onPress: () => void;
}

/** Full-width button under the event grid: Reports, then Find ER. */
function WideAction({ icon, label, onPress }: WideActionProps) {
  const c = useColors();
  const styles = useStyles();
  return (
    <Pressable onPress={onPress} style={styles.wideAction} hitSlop={2}>
      <Ionicons name={icon} size={15} color={c.textSecondary} />
      <Text style={styles.wideActionLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const EVENT_BUTTON = 36;

const useStyles = createStyles((c) =>
  StyleSheet.create({
    indicators: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: 44,
    },
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.lg,
      marginHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      backgroundColor: c.card,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.separator,
    },
    profileInfo: { flex: 1 },
    profileName: { ...fonts.body, fontWeight: '700', color: c.text },
    profileMeta: { ...fonts.footnote, color: c.textSecondary, marginTop: 2 },
    profileButton: {
      width: 38,
      height: 38,
      borderRadius: radius.md,
      backgroundColor: c.elevated,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow.raised,
    },
    card: {
      marginTop: spacing.lg,
      marginHorizontal: spacing.lg,
      padding: spacing.lg,
      backgroundColor: c.card,
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.separator,
      ...shadow.card,
    },
    cardTitle: { ...fonts.footnote, color: c.textSecondary, textTransform: 'uppercase' },
    liveHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    liveDate: { ...fonts.footnote, color: c.textSecondary },
    // Readout, trend dial and action column sit side by side, as in the design.
    cardBody: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
    readout: { flexShrink: 1 },
    // Takes the leftover width between the readout and the action column, so the
    // trend dial centers in that gap instead of sitting flush against the buttons.
    trendSlot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    // The design frames the status and the value together, with the timestamp loose underneath.
    valueBox: {
      alignSelf: 'flex-start',
      minWidth: 112,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: c.elevated,
      borderRadius: radius.lg,
      ...shadow.raised,
    },
    valueRow: { flexDirection: 'row', alignItems: 'flex-end' },
    value: { fontSize: 38, fontWeight: '700', lineHeight: 42 },
    unit: { ...fonts.footnote, color: c.textSecondary, marginLeft: spacing.xs, marginBottom: 5 },
    status: { ...fonts.footnote, fontWeight: '700' },
    meta: { ...fonts.footnote, color: c.textSecondary, marginTop: spacing.sm },
    notice: { ...fonts.footnote, color: c.green, marginTop: spacing.sm, fontWeight: '600' },
    empty: { ...fonts.body, color: c.textSecondary },
    actions: { width: EVENT_BUTTON * 2 + spacing.xs, gap: spacing.xs },
    eventGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    eventButton: {
      width: EVENT_BUTTON,
      height: EVENT_BUTTON,
      backgroundColor: c.elevated,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow.raised,
    },
    wideAction: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      height: 30,
      backgroundColor: c.elevated,
      borderRadius: radius.md,
      ...shadow.raised,
    },
    wideActionLabel: { fontSize: 11, fontWeight: '700', color: c.textSecondary },
  }),
);
