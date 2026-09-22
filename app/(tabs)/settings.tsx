import Constants from 'expo-constants';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { cgmController } from '@/core/cgm/cgmController';
import { useStrings } from '@/core/i18n';
import { simClock } from '@/core/sim/simClock';
import { useAppStore } from '@/core/store/appStore';
import type { SimulatorScenario } from '@/core/types';
import { Button } from '@/ui/components/Button';
import { useConfirm } from '@/ui/components/Confirm';
import { Segmented, Stepper } from '@/ui/components/Controls';
import { Row, Section } from '@/ui/components/GroupedList';
import { Screen } from '@/ui/components/Screen';
import { colors, fonts, spacing } from '@/ui/theme';

const INTERVALS = [5, 10, 30, 60, 300];

export default function SettingsScreen() {
  const t = useStrings();
  const confirm = useConfirm();
  const s = useAppStore();

  const scenarios: { label: string; value: SimulatorScenario }[] = [
    { label: t.settings.scenarioNormal, value: 'normal' },
    { label: t.settings.scenarioMeal, value: 'meal' },
    { label: t.settings.scenarioHypo, value: 'hypo' },
    { label: t.settings.scenarioHyper, value: 'hyper' },
  ];

  // Wipe: drop the sensor link first, then every persisted slice, then the
  // virtual clock, so nothing restores the old session on the next render.
  const onReset = async () => {
    if (!(await confirm(t.settings.reset, t.settings.resetConfirm, true))) return;
    await cgmController.disconnect();
    useAppStore.getState().resetAll();
    simClock.reset();
  };

  return (
    <Screen>
      <Text style={styles.title}>{t.settings.title}</Text>

      <Section title={t.settings.homeScreen}>
        <Row
          label={t.settings.language}
          right={
            <Segmented
              options={[
                { label: 'English', value: 'en' as const },
                { label: '한국어', value: 'ko' as const },
              ]}
              value={s.language}
              onChange={s.setLanguage}
            />
          }
        />
        <Row
          label={t.settings.unit}
          last
          right={
            <Segmented
              options={[
                { label: 'mg/dL', value: 'mg/dL' as const },
                { label: 'mmol/L', value: 'mmol/L' as const },
              ]}
              value={s.unit}
              onChange={s.setUnit}
            />
          }
        />
      </Section>

      <Section title={t.settings.therapy}>
        <Row
          label={t.settings.targetLow}
          right={<Stepper value={s.therapy.targetLow} step={5} min={40} max={s.therapy.targetHigh - 10} onChange={(v) => s.setTherapy({ targetLow: v })} />}
        />
        <Row
          label={t.settings.targetHigh}
          right={<Stepper value={s.therapy.targetHigh} step={5} min={s.therapy.targetLow + 10} max={400} onChange={(v) => s.setTherapy({ targetHigh: v })} />}
        />
        <Row label={t.settings.alerts} last right={<Switch value={s.therapy.alertsEnabled} onValueChange={(v) => s.setTherapy({ alertsEnabled: v })} />} />
      </Section>

      <Section title={t.settings.app}>
        <Row label={t.settings.autoUpload} right={<Switch value={s.autoUpload} onValueChange={s.setAutoUpload} />} />
        <Row
          label={t.settings.simInterval}
          right={
            <Segmented
              options={INTERVALS.map((v) => ({ label: `${v}${t.settings.seconds}`, value: v }))}
              value={s.simulator.intervalSec}
              onChange={(v) => s.setSimulator({ intervalSec: v })}
            />
          }
        />
        <Row label={t.settings.simScenario} last right={<Segmented options={scenarios} value={s.simulator.scenario} onChange={(v) => s.setSimulator({ scenario: v })} />} />
      </Section>

      <View style={styles.resetBlock}>
        <Button title={t.settings.reset} variant="destructive" onPress={() => void onReset()} />
        <Text style={styles.resetNote}>{t.settings.resetNote}</Text>
      </View>

      <Section title={t.settings.about}>
        <Row label={t.settings.appName} value={Constants.expoConfig?.name ?? 'CGM Test Logger'} />
        <Row label={t.settings.version} value={Constants.expoConfig?.version ?? '0.1.0'} last />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...fonts.title, color: colors.tint, textAlign: 'center', paddingTop: 40 },
  resetBlock: { marginTop: spacing.lg },
  resetNote: { ...fonts.caption, color: colors.textTertiary, paddingHorizontal: spacing.lg, marginTop: spacing.xs },
});
