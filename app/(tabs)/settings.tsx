import Constants from 'expo-constants';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type ScrollView } from 'react-native';

import { cgmController } from '@/core/cgm/cgmController';
import { useStrings } from '@/core/i18n';
import { simClock } from '@/core/sim/simClock';
import { useAppStore } from '@/core/store/appStore';
import type { Gender, SimulatorScenario } from '@/core/types';
import { Button } from '@/ui/components/Button';
import { useConfirm } from '@/ui/components/Confirm';
import { AccentSwitch, Segmented, Stepper } from '@/ui/components/Controls';
import { Dropdown } from '@/ui/components/Dropdown';
import { Row, Section } from '@/ui/components/GroupedList';
import { Screen } from '@/ui/components/Screen';
import { createStyles, fonts, spacing } from '@/ui/theme';

const INTERVALS = [5, 10, 30, 60, 300];

export default function SettingsScreen() {
  const t = useStrings();
  const confirm = useConfirm();
  const styles = useStyles();
  const s = useAppStore();
  // The profile button on Home links straight here with ?section=profile.
  const { section } = useLocalSearchParams<{ section?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  // State, not a ref: on a first visit the request arrives before the layout,
  // so the effect has to re-run once the offset is known.
  const [profileY, setProfileY] = useState<number | null>(null);

  // Runs on focus, and again once the layout reports the offset. A scroll
  // issued while the tab is still mounting is dropped, so nudge it a couple of
  // times, unanimated, and only then release the one-shot parameter — clearing
  // it re-renders the screen, which would cancel a scroll still in flight.
  useFocusEffect(
    useCallback(() => {
      if (section !== 'profile' || profileY === null) return;
      const y = Math.max(0, profileY - spacing.lg);
      const timers = [0, 150, 350].map((delay) => setTimeout(() => scrollRef.current?.scrollTo({ y, animated: false }), delay));
      timers.push(setTimeout(() => router.setParams({ section: undefined }), 500));
      return () => timers.forEach(clearTimeout);
    }, [section, profileY]),
  );

  const scenarios: { label: string; value: SimulatorScenario }[] = [
    { label: t.settings.scenarioNormal, value: 'normal' },
    { label: t.settings.scenarioMeal, value: 'meal' },
    { label: t.settings.scenarioHypo, value: 'hypo' },
    { label: t.settings.scenarioHyper, value: 'hyper' },
  ];

  const genderOptions: { label: string; value: Gender }[] = [
    { label: t.settings.genderMale, value: 'male' },
    { label: t.settings.genderFemale, value: 'female' },
    { label: t.settings.genderOther, value: 'other' },
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
    <Screen title={t.settings.title} scrollRef={scrollRef}>
      <View onLayout={(e) => setProfileY((prev) => (prev === e.nativeEvent.layout.y ? prev : e.nativeEvent.layout.y))}>
        <Section title={t.settings.profileSection}>
          <TextRow value={s.profile.name} onCommit={(name) => s.setProfile({ name })} label={t.settings.profileName} />
          <Row
            label={t.settings.profileAge}
            right={<Stepper value={s.profile.age} step={1} min={1} max={120} onChange={(v) => s.setProfile({ age: v })} />}
          />
          <Row
            label={t.settings.profileWeight}
            right={<Stepper value={s.profile.weightKg} step={1} min={20} max={250} onChange={(v) => s.setProfile({ weightKg: v })} />}
          />
          <Row
            label={t.settings.profileHeight}
            right={<Stepper value={s.profile.heightCm} step={1} min={100} max={230} onChange={(v) => s.setProfile({ heightCm: v })} />}
          />
          <Row
            label={t.settings.profileGender}
            last
            right={<Segmented options={genderOptions} value={s.profile.gender} onChange={(gender) => s.setProfile({ gender })} />}
          />
        </Section>
      </View>

      <Section title={t.settings.general}>
        <Row
          label={t.settings.darkMode}
          right={<AccentSwitch value={s.darkMode} onValueChange={s.setDarkMode} />}
        />
        <Row
          label={t.settings.language}
          right={
            <Segmented
              options={[
                { label: 'English', value: 'en' as const },
                { label: '한국어', value: 'ko' as const },
                { label: 'Español', value: 'es' as const },
              ]}
              value={s.language}
              onChange={s.setLanguage}
            />
          }
        />
        <Row
          label={t.settings.unit}
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
        <Row
          label={t.settings.hba1cUnit}
          last
          right={
            <Segmented
              options={[
                { label: 'mmol/mol', value: 'mmol/mol' as const },
                { label: '%HbA1c', value: '%' as const },
              ]}
              value={s.hba1cUnit}
              onChange={s.setHba1cUnit}
            />
          }
        />
      </Section>

      <Section title={t.settings.emergencyContacts}>
        {s.emergencyContacts.map((c, i) => (
          <View key={i}>
            <TextRow label={`${t.settings.contact} ${i + 1} ${t.settings.contactName.toLowerCase()}`} value={c.name} onCommit={(name) => s.setEmergencyContact(i, { name })} />
            <TextRow
              label={`${t.settings.contact} ${i + 1} ${t.settings.contactPhone.toLowerCase()}`}
              value={c.phone}
              onCommit={(phone) => s.setEmergencyContact(i, { phone })}
              keyboardType="phone-pad"
              last={i === s.emergencyContacts.length - 1}
            />
          </View>
        ))}
      </Section>

      <Section title={t.settings.dataSection}>
        <Row
          label={t.settings.targetLow}
          right={<Stepper value={s.therapy.targetLow} step={5} min={40} max={s.therapy.targetHigh - 10} onChange={(v) => s.setTherapy({ targetLow: v })} />}
        />
        <Row
          label={t.settings.targetHigh}
          right={<Stepper value={s.therapy.targetHigh} step={5} min={s.therapy.targetLow + 10} max={400} onChange={(v) => s.setTherapy({ targetHigh: v })} />}
        />
        <Row
          label={t.settings.alerts}
          last
          right={<AccentSwitch value={s.therapy.alertsEnabled} onValueChange={(v) => s.setTherapy({ alertsEnabled: v })} />}
        />
      </Section>

      <Section title={t.settings.app}>
        <Row
          label={t.settings.autoUpload}
          right={<AccentSwitch value={s.autoUpload} onValueChange={s.setAutoUpload} />}
        />
        <Row
          label={t.settings.simInterval}
          right={
            <Dropdown
              label={t.settings.simInterval}
              options={INTERVALS.map((v) => ({ label: `${v}${t.settings.seconds}`, value: v }))}
              value={s.simulator.intervalSec}
              onChange={(v) => s.setSimulator({ intervalSec: v })}
            />
          }
        />
        <Row
          label={t.settings.simScenario}
          last
          right={
            <Dropdown
              label={t.settings.simScenario}
              options={scenarios}
              value={s.simulator.scenario}
              onChange={(v) => s.setSimulator({ scenario: v })}
            />
          }
        />
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

interface TextRowProps {
  label: string;
  value: string;
  onCommit: (value: string) => void;
  keyboardType?: 'default' | 'phone-pad';
  last?: boolean;
}

function TextRow({ label, value, onCommit, keyboardType = 'default', last }: TextRowProps) {
  const styles = useStyles();
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const commit = () => onCommit(text.trim());
  return (
    <Row
      label={label}
      last={last}
      right={
        <TextInput
          value={text}
          onChangeText={setText}
          onBlur={commit}
          onSubmitEditing={commit}
          keyboardType={keyboardType}
          style={styles.nameInput}
        />
      }
    />
  );
}

const useStyles = createStyles((c) =>
  StyleSheet.create({
    resetBlock: { marginTop: spacing.lg },
    resetNote: { ...fonts.caption, color: c.textTertiary, paddingHorizontal: spacing.lg, marginTop: spacing.xs },
    nameInput: { minWidth: 140, textAlign: 'right', ...fonts.body, color: c.primary },
  }),
);
