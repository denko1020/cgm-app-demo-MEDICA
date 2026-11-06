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
import { TOUCH, type Colors, createStyles, fonts, radius, spacing, tabular, topChips, useColors } from '@/ui/theme';

type IconName = keyof typeof Ionicons.glyphMap;

/** Width of the trend dial, and of the column reserved for it. */
const DIAL = 72;

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
  // The guide fixes the status language: a tinted ground, the darker ink on it
  // and an icon, so the state never rests on colour alone.
  const statusInk = status === 'inRange' ? c.green : status ? c.red : c.textSecondary;
  const statusGround = status === 'inRange' ? c.greenSoft : status ? c.redSoft : c.card;
  const statusIcon: IconName = status === 'inRange' ? 'checkmark-circle' : status === 'low' ? 'arrow-down-circle' : 'alert-circle';
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
        <StatusIndicator icon="heart-outline" label={t.home.liveData} active={live} activeColor={c.statusActive} />
        <StatusIndicator
          icon={battery > 20 ? 'battery-full-outline' : 'battery-dead-outline'}
          label={device ? `${battery}%` : '--'}
          active={!!device}
          activeColor={batteryColor(battery, c)}
        />
        <StatusIndicator
          icon="link-outline"
          label={connection === 'connecting' ? t.home.connecting : connected ? t.home.connected : t.home.disconnected}
          active={connected}
          activeColor={c.statusActive}
        />
        <StatusIndicator icon="cloud-upload-outline" label={uploaded ? t.home.uploaded : `${t.home.pending} ${pendingCount}`} active={uploaded} activeColor={c.statusActive} />
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileMeta}>
            {profile.age}, {profile.weightKg}kg, {profile.heightCm}cm, {genderLabel}
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
                  <View style={styles.valueRow}>
                    <Text style={styles.value}>{formatHba1c(avgCgm, hba1cUnit)}</Text>
                    <Text style={styles.unit}>{hba1cUnit}</Text>
                  </View>
                  <Text style={styles.meta}>{t.home.hba1cNote.replace('{n}', String(cgm.length))}</Text>
                </>
              ) : (
                <Text style={styles.empty}>{t.home.hba1cNoData}</Text>
              )
            ) : latest && value !== undefined ? (
              <>
                <View style={[styles.badge, { backgroundColor: statusGround }]}>
                  <Ionicons name={statusIcon} size={14} color={statusInk} />
                  <Text style={[styles.badgeText, { color: statusInk }]}>{statusLabel}</Text>
                </View>
                <View style={styles.valueRow}>
                  <Text style={styles.value}>{formatAnalyte(value, analyte, unit)}</Text>
                  <Text style={styles.unit}>{spec.unit}</Text>
                </View>
                <Text style={styles.meta}>
                  {t.home.lastReading} {formatTime(latest.timestamp)}
                </Text>
              </>
            ) : (
              <Text style={styles.empty}>{t.home.noData}</Text>
            )}
          </View>

          <View style={styles.trendSlot}>{!hba1c && latest ? <TrendTile trend={trend} size={DIAL} /> : null}</View>
        </View>

        <View style={styles.divider} />

        <View style={styles.eventRow}>
          {USER_EVENT_KINDS.map((kind) => (
            <Pressable
              key={kind}
              onPress={() => onLogEvent(kind)}
              style={({ pressed }) => [styles.control, pressed && styles.controlPressed]}
              accessibilityLabel={`${t.events.title}: ${t.events[kind]}`}
              testID={`log-${kind}`}
            >
              <MaterialCommunityIcons name={EVENT_ICON[kind]} size={20} color={c.textSecondary} />
            </Pressable>
          ))}
        </View>
        <View style={styles.actionRow}>
          <WideAction icon="clipboard-outline" label={t.home.reports} onPress={() => router.push('/stats')} />
          <WideAction icon="medkit-outline" label={t.home.findHospital} onPress={() => void onFindHospital()} />
        </View>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      </View>

      {!hba1c && cgm.length >= 2 ? (
        <View style={[styles.card, styles.chartCard]}>
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

/** One of the two labelled actions under the event row: Reports, then Find ER. */
function WideAction({ icon, label, onPress }: WideActionProps) {
  const c = useColors();
  const styles = useStyles();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.control, styles.wideAction, pressed && styles.controlPressed]}>
      <Ionicons name={icon} size={16} color={c.textSecondary} />
      <Text style={styles.wideActionLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const useStyles = createStyles((c) =>
  StyleSheet.create({
    indicators: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      // Clears the floating chips above, plus a step of air, so the two rows
      // read as separate things rather than one crowded strip.
      paddingTop: topChips.offset + topChips.height + spacing.xl,
    },
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.lg,
      marginHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: c.card,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: c.separator,
    },
    profileInfo: { flex: 1 },
    profileName: { ...fonts.heading, color: c.heading },
    profileMeta: { ...fonts.caption, color: c.textTertiary, marginTop: 2 },
    profileButton: {
      width: TOUCH,
      height: TOUCH,
      borderRadius: radius.control,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // One quiet panel per subject, split by a rule rather than by nested boxes.
    card: {
      marginTop: spacing.lg,
      marginHorizontal: spacing.lg,
      padding: spacing.lg,
      backgroundColor: c.background,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardTitle: { ...fonts.footnote, fontWeight: '600', color: c.heading },
    // The guide gives charts their own tinted ground, so a plot reads as data
    // rather than as another white panel.
    chartCard: { backgroundColor: c.chartSurface, borderColor: c.separator },
    liveHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    liveDate: { ...fonts.caption, ...tabular, color: c.textTertiary },
    // The reading and the dial that qualifies it sit side by side; everything
    // else in the panel is below the rule.
    cardBody: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm },
    // The readout takes the leftover width and the dial keeps a column of its
    // own, so a two digit reading and a three digit one put the dial in exactly
    // the same place.
    readout: { flex: 1 },
    trendSlot: { width: DIAL, alignItems: 'center', justifyContent: 'center' },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: spacing.xs,
      paddingVertical: 3,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.pill,
    },
    badgeText: { ...fonts.caption, fontWeight: '700' },
    valueRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.sm },
    value: { ...fonts.readout, ...tabular, color: c.heading },
    unit: { ...fonts.footnote, color: c.textTertiary, marginLeft: spacing.xs, marginBottom: 7 },
    meta: { ...fonts.caption, ...tabular, color: c.textTertiary, marginTop: spacing.xs },
    notice: { ...fonts.caption, color: c.green, marginTop: spacing.md, fontWeight: '600' },
    empty: { ...fonts.body, color: c.textTertiary },
    divider: { height: 1, backgroundColor: c.separator, marginTop: spacing.lg },
    eventRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
    actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    // Every control on the panel is the same stroked rectangle at the guide's
    // minimum touch size, so the row reads as one set.
    control: {
      flex: 1,
      height: TOUCH,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.control,
      backgroundColor: c.background,
    },
    controlPressed: { backgroundColor: c.card },
    wideAction: { flexDirection: 'row', gap: spacing.xs },
    wideActionLabel: { ...fonts.footnote, fontWeight: '600', color: c.textSecondary },
  }),
);
