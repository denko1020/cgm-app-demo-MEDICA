import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useStrings } from '@/core/i18n';
import { simClock } from '@/core/sim/simClock';
import { useAppStore } from '@/core/store/appStore';
import type { AppEvent, GlucoseReading, ScenarioEvent, SimulatorScenario, UserEvent } from '@/core/types';
import { isScenarioEvent } from '@/core/types';
import { analyteSpec, analyteValue, formatAnalyte } from '@/core/util/analyte';
import { csvFilename, readingsToCsv } from '@/core/util/csv';
import { exportTextFile } from '@/core/util/exportFile';
import { formatDateTime, trendArrow } from '@/core/util/format';
import { Button } from '@/ui/components/Button';
import { EVENT_ICON, eventColors } from '@/ui/eventStyle';
import { createStyles, fonts, radius, shadow, spacing, useColors } from '@/ui/theme';

type Entry = { kind: 'reading'; ts: number; item: GlucoseReading } | { kind: 'event'; ts: number; item: AppEvent };

export default function ReadingsScreen() {
  const t = useStrings();
  const c = useColors();
  const styles = useStyles();
  const readings = useAppStore((s) => s.readings);
  const events = useAppStore((s) => s.events);
  const unit = useAppStore((s) => s.unit);
  const therapy = useAppStore((s) => s.therapy);
  const viewMode = useAppStore((s) => s.viewMode);
  // HbA1c has no per-reading value, so the list falls back to glucose for it.
  const analyte = viewMode === 'hba1c' ? 'glucose' : viewMode;
  const spec = analyteSpec(analyte, therapy, unit);
  const addBgm = useAppStore((s) => s.addBgmReading);
  const [showAdd, setShowAdd] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Readings and scenario switches share one newest-first timeline.
  const ordered = useMemo<Entry[]>(
    () =>
      [...readings.map((r): Entry => ({ kind: 'reading', ts: r.timestamp, item: r })), ...events.map((e): Entry => ({ kind: 'event', ts: e.timestamp, item: e }))].sort(
        (a, b) => b.ts - a.ts,
      ),
    [readings, events],
  );

  const scenarioLabel = (s: SimulatorScenario) =>
    s === 'meal' ? t.settings.scenarioMeal : s === 'hypo' ? t.settings.scenarioHypo : s === 'hyper' ? t.settings.scenarioHyper : t.settings.scenarioNormal;
  const scenarioText = (e: ScenarioEvent) => `${t.readings.scenarioChange}: ${scenarioLabel(e.from)} → ${scenarioLabel(e.to)}`;

  const exportCsv = () => exportTextFile(csvFilename(simClock.now()), readingsToCsv(readings, events, unit));

  const submit = () => {
    const value = Number(input);
    if (!Number.isFinite(value) || value < 20 || value > 600) {
      setError(t.readings.invalidValue);
      return;
    }
    addBgm(Math.round(value));
    setInput('');
    setError(null);
    setShowAdd(false);
  };

  const renderEvent = (e: AppEvent) => {
    const scenario = isScenarioEvent(e);
    const kind = scenario ? null : (e as UserEvent).kind;
    const color = kind ? eventColors(c)[kind] : c.textSecondary;
    return (
      <View style={styles.eventRow}>
        {kind ? (
          <MaterialCommunityIcons name={EVENT_ICON[kind]} size={16} color={color} />
        ) : (
          <Ionicons name="swap-horizontal" size={16} color={color} />
        )}
        <Text style={[styles.eventText, kind ? { color, fontWeight: '600' } : null]}>
          {scenario ? scenarioText(e as ScenarioEvent) : t.events[kind as NonNullable<typeof kind>]}
        </Text>
        <Text style={styles.eventTime}>{formatDateTime(e.timestamp)}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Entry }) => (item.kind === 'event' ? renderEvent(item.item) : renderReading(item.item));

  const renderReading = (item: GlucoseReading) => {
    const value = analyteValue(item, analyte);
    return (
    <View style={styles.row}>
      <View style={[styles.badge, item.source === 'bgm' && styles.badgeBgm]}>
        <Text style={styles.badgeText}>{item.source === 'cgm' ? t.readings.cgm : t.readings.bgm}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.time}>{formatDateTime(item.timestamp)}</Text>
        {item.source === 'cgm' && item.raw !== item.value ? (
          <Text style={styles.raw}>
            {t.readings.raw} {item.raw}
          </Text>
        ) : null}
      </View>
      <Text style={styles.value}>
        {value === undefined ? '-' : formatAnalyte(value, analyte, unit)} <Text style={styles.unit}>{spec.unit}</Text>
      </Text>
      <Text style={styles.trend}>{analyte === 'glucose' ? trendArrow(item.trend) : ''}</Text>
      <Ionicons
        name={item.uploaded ? 'cloud-done' : 'cloud-outline'}
        size={18}
        color={item.uploaded ? c.green : c.textTertiary}
        style={{ marginLeft: spacing.sm }}
      />
    </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{t.readings.title}</Text>
        <View style={styles.actions}>
          <Pressable onPress={exportCsv} hitSlop={8} disabled={readings.length === 0} accessibilityLabel={t.readings.exportCsv} testID="export-csv">
            <Ionicons name="download-outline" size={26} color={readings.length ? c.primary : c.textTertiary} />
          </Pressable>
          <Pressable onPress={() => setShowAdd(true)} hitSlop={8} accessibilityLabel={t.readings.addBgm}>
            <Ionicons name="add" size={28} color={c.primary} />
          </Pressable>
        </View>
      </View>
      <FlatList
        data={ordered}
        keyExtractor={(e) => e.item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={styles.empty}>{t.readings.empty}</Text>}
        contentContainerStyle={ordered.length ? styles.list : styles.listEmpty}
      />

      <Modal visible={showAdd} transparent animationType="fade" onRequestClose={() => setShowAdd(false)}>
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{t.readings.addBgm}</Text>
            <Text style={styles.dialogHint}>{t.readings.bgmPrompt}</Text>
            <TextInput
              value={input}
              onChangeText={setInput}
              keyboardType="numeric"
              placeholder="110"
              style={styles.input}
              autoFocus
              onSubmitEditing={submit}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title={t.common.add} onPress={submit} />
            <Button title={t.common.cancel} variant="secondary" onPress={() => setShowAdd(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const useStyles = createStyles((c) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: 40,
      paddingBottom: spacing.md,
    },
    title: { ...fonts.largeTitle, color: c.text },
    actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    list: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      backgroundColor: c.card,
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.separator,
      ...shadow.card,
    },
    listEmpty: { flexGrow: 1 },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 12, backgroundColor: c.card },
    separator: { height: StyleSheet.hairlineWidth, backgroundColor: c.separator, marginLeft: spacing.lg },
    badge: { backgroundColor: c.primarySoft, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2, marginRight: spacing.md, minWidth: 44, alignItems: 'center' },
    badgeBgm: { backgroundColor: c.greenSoft },
    badgeText: { ...fonts.caption, fontWeight: '600', color: c.text },
    time: { ...fonts.footnote, color: c.text },
    raw: { ...fonts.caption, color: c.textTertiary },
    eventRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 8, backgroundColor: c.background },
    eventText: { ...fonts.footnote, color: c.textSecondary, flex: 1 },
    eventTime: { ...fonts.caption, color: c.textTertiary },
    value: { ...fonts.body, fontWeight: '600', color: c.text },
    unit: { ...fonts.caption, color: c.textSecondary, fontWeight: '400' },
    trend: { ...fonts.body, color: c.textSecondary, marginLeft: spacing.sm, width: 20, textAlign: 'center' },
    empty: { ...fonts.body, color: c.textTertiary, textAlign: 'center', marginTop: spacing.xl },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
    dialog: { width: 300, backgroundColor: c.background, borderRadius: radius.xl, paddingVertical: spacing.lg, ...shadow.card },
    dialogTitle: { ...fonts.body, fontWeight: '600', textAlign: 'center' },
    dialogHint: { ...fonts.footnote, color: c.textSecondary, textAlign: 'center', marginTop: spacing.xs, paddingHorizontal: spacing.lg },
    input: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: c.separator,
      borderRadius: 8,
      padding: 10,
      fontSize: 20,
      textAlign: 'center',
    },
    error: { ...fonts.footnote, color: c.red, textAlign: 'center', marginTop: spacing.sm },
  }),
);
