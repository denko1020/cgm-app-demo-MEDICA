import { useState } from 'react';
import { Switch, View } from 'react-native';

import { cgmController } from '@/core/cgm/cgmController';
import { summarize } from '@/core/util/glucoseSummary';
import { useStrings } from '@/core/i18n';
import { simClock } from '@/core/sim/simClock';
import { useAppStore } from '@/core/store/appStore';
import { csvFilename, readingsToCsv } from '@/core/util/csv';
import { exportTextFile } from '@/core/util/exportFile';
import { formatDateTime, toDisplayUnit } from '@/core/util/format';
import { activeMinutesGoal, collectHealthMaterials, healthScore } from '@/core/util/healthIndex';
import { Button } from '@/ui/components/Button';
import { useConfirm } from '@/ui/components/Confirm';
import { Row, Section } from '@/ui/components/GroupedList';
import { Screen } from '@/ui/components/Screen';
import { colors, spacing } from '@/ui/theme';

export default function StatsScreen() {
  const t = useStrings();
  const confirm = useConfirm();
  const readings = useAppStore((s) => s.readings);
  const events = useAppStore((s) => s.events);
  const activity = useAppStore((s) => s.activity);
  const uploading = useAppStore((s) => s.uploading);
  const lastUploadAt = useAppStore((s) => s.lastUploadAt);
  const lastUploadError = useAppStore((s) => s.lastUploadError);
  const clearReadings = useAppStore((s) => s.clearReadings);
  const therapy = useAppStore((s) => s.therapy);
  const unit = useAppStore((s) => s.unit);
  const profile = useAppStore((s) => s.profile);
  const [failNext, setFailNext] = useState(cgmController.uploader.failNext);

  const cgm = readings.filter((r) => r.source === 'cgm');
  const bgm = readings.filter((r) => r.source === 'bgm');
  const pending = readings.filter((r) => !r.uploaded).length;
  const summary = summarize(readings, therapy, simClock.now() - 86_400_000);
  const materials = collectHealthMaterials(readings, events, activity, therapy, simClock.now());
  const score = healthScore(materials, activeMinutesGoal(profile));

  const toggleFail = (v: boolean) => {
    cgmController.uploader.failNext = v;
    setFailNext(v);
  };

  const onExport = () => exportTextFile(csvFilename(simClock.now()), readingsToCsv(readings, events, unit));

  const onClear = async () => {
    if (await confirm(t.stats.clear, t.stats.clearConfirm, true)) clearReadings();
  };

  return (
    <Screen title={t.stats.title}>
      <Section title={t.stats.cgm}>
        <Row label={t.stats.readings} value={cgm.length} />
        <Row label={t.stats.notUploaded} value={cgm.filter((r) => !r.uploaded).length} last />
      </Section>

      <Section title={t.stats.bgm}>
        <Row label={t.stats.readings} value={bgm.length} />
        <Row label={t.stats.notUploaded} value={bgm.filter((r) => !r.uploaded).length} last />
      </Section>

      <Section title={t.stats.summary}>
        <Row label={t.stats.mean} value={summary ? `${toDisplayUnit(summary.mean, unit)} ${unit}` : '-'} />
        <Row label={t.stats.timeInRange} value={summary ? `${Math.round(summary.timeInRange * 100)}%` : '-'} />
        <Row label={t.stats.min} value={summary ? `${toDisplayUnit(summary.min, unit)} ${unit}` : '-'} />
        <Row label={t.stats.max} value={summary ? `${toDisplayUnit(summary.max, unit)} ${unit}` : '-'} last />
      </Section>

      <Section title={t.stats.health}>
        <Row label={t.stats.activeMinutes} value={`${materials.activeMinutes} ${t.stats.minutes}`} />
        <Row label={t.stats.steps} value={materials.steps.toLocaleString()} />
        <Row label={t.stats.postMealRise} value={materials.postMealRise === null ? '-' : `+${toDisplayUnit(materials.postMealRise, unit)} ${unit}`} />
        <Row label={t.stats.timeInRange} value={materials.timeInRange === null ? '-' : `${Math.round(materials.timeInRange * 100)}%`} />
        <Row label={t.stats.healthIndex} value={score === null ? '-' : `${score} / 100`} valueColor={colors.green} last />
      </Section>

      <Section>
        <Row label={t.stats.lastUpload} value={lastUploadAt ? formatDateTime(lastUploadAt) : '-'} />
        <Row label={t.stats.lastError} value={lastUploadError ?? '-'} valueColor={lastUploadError ? colors.red : undefined} />
        <Row label={t.stats.failNext} last right={<Switch value={failNext} onValueChange={toggleFail} />} />
      </Section>

      <View style={{ marginTop: spacing.md }}>
        <Button
          title={uploading ? t.stats.uploading : `${t.stats.uploadNow} (${pending})`}
          loading={uploading}
          disabled={pending === 0}
          onPress={() => void cgmController.uploadPending()}
        />
        <Button title={t.stats.exportCsv} variant="secondary" disabled={readings.length === 0} onPress={() => void onExport()} />
        <Button title={t.stats.clear} variant="destructive" disabled={readings.length === 0} onPress={() => void onClear()} />
      </View>
    </Screen>
  );
}
