import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { cgmController } from '@/core/cgm/cgmController';
import { useStrings } from '@/core/i18n';
import { simClock } from '@/core/sim/simClock';
import { useAppStore } from '@/core/store/appStore';
import type { AlgorithmParameters } from '@/core/types';
import { daysBetween, formatDateTime } from '@/core/util/format';
import { Button } from '@/ui/components/Button';
import { useConfirm } from '@/ui/components/Confirm';
import { Row, Section } from '@/ui/components/GroupedList';
import { Screen } from '@/ui/components/Screen';
import { colors, fonts, spacing } from '@/ui/theme';

export default function DeviceProfileScreen() {
  const t = useStrings();
  const router = useRouter();
  const confirm = useConfirm();
  const { id } = useLocalSearchParams<{ id: string }>();
  const device = useAppStore((s) => s.devices.find((d) => d.id === id));
  const activeDeviceId = useAppStore((s) => s.activeDeviceId);
  const connection = useAppStore((s) => s.connection);
  const setAlgorithm = useAppStore((s) => s.setAlgorithm);
  const renameDevice = useAppStore((s) => s.renameDevice);
  const [now, setNow] = useState(simClock.now());
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setInterval(() => setNow(simClock.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // A bolder, easier-to-tap back arrow than the system default.
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color={colors.primary} />
        </Pressable>
      ),
    });
  }, [navigation, router]);

  if (!device) {
    return (
      <Screen>
        <Text style={styles.missing}>{t.common.none}</Text>
      </Screen>
    );
  }

  const isActive = device.id === activeDeviceId;
  const connected = isActive && connection === 'connected';
  const connecting = isActive && connection === 'connecting';
  const connectionLabel = connecting ? t.home.connecting : connected ? t.home.connected : t.home.disconnected;
  const elapsed = device.sensorStartedAt ? daysBetween(device.sensorStartedAt, now) : 0;
  const remaining = Math.max(0, device.lifetimeDays - elapsed);

  const onForget = async () => {
    if (await confirm(t.devices.forget, t.devices.forgetConfirm, true)) {
      await cgmController.forget(device.id);
      router.back();
    }
  };

  return (
    <Screen>
      <Image source={require('../../assets/device-sensor.png')} style={styles.deviceImage} resizeMode="contain" />
      <Section title={t.devices.general}>
        <DeviceNameRow label={t.devices.name} value={device.name} onCommit={(name) => renameDevice(device.id, name)} />
        <Row label={t.devices.connection} value={connectionLabel} valueColor={connected ? colors.green : colors.red} />
        <Row label={t.devices.signal} value={`${device.rssi} dBm`} last />
      </Section>

      <Section title={t.devices.algorithm}>
        <ParamRow label={t.devices.calibrationSlope} field="calibrationSlope" device={device} onChange={setAlgorithm} />
        <ParamRow label={t.devices.calibrationOffset} field="calibrationOffset" device={device} onChange={setAlgorithm} />
        <ParamRow label={t.devices.smoothingWindow} field="smoothingWindow" device={device} onChange={setAlgorithm} last />
      </Section>

      <Section title={t.devices.about}>
        <Row label={t.devices.manufacturer} value={device.info.manufacturer} />
        <Row label={t.devices.fwVersion} value={device.info.firmwareVersion} />
        <Row label={t.devices.deviceIeee} value={device.info.ieeeAddress} />
        <Row label={t.devices.batteryLevel} value={`${device.info.batteryLevel}%`} />
        <Row label={t.devices.sensorStarted} value={device.sensorStartedAt ? formatDateTime(device.sensorStartedAt) : '-'} />
        <Row label={t.devices.lifetime} value={`${elapsed.toFixed(2)} ${t.common.days}`} />
        <Row label={t.devices.remainingLifetime} value={`${remaining.toFixed(2)} ${t.common.days}`} last />
      </Section>

      <View style={{ marginTop: spacing.xl }}>
        {connected || connecting ? (
          <Button title={t.devices.disconnect} variant="secondary" loading={connecting} onPress={() => void cgmController.disconnect()} />
        ) : (
          <Button title={t.devices.connect} onPress={() => void cgmController.connect(device.id)} />
        )}
        {connected && cgmController.transport.simulator ? (
          <Button title={t.devices.dropLink} variant="secondary" onPress={() => cgmController.transport.simulator?.dropConnection()} />
        ) : null}
        <Button title={t.devices.forget} variant="destructive" onPress={() => void onForget()} />
      </View>
    </Screen>
  );
}

interface DeviceNameRowProps {
  label: string;
  value: string;
  onCommit: (name: string) => void;
}

function DeviceNameRow({ label, value, onCommit }: DeviceNameRowProps) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const commit = () => {
    const trimmed = text.trim();
    if (trimmed) onCommit(trimmed);
    else setText(value);
  };
  return <Row label={label} right={<TextInput value={text} onChangeText={setText} onBlur={commit} onSubmitEditing={commit} style={styles.input} />} />;
}

interface ParamRowProps {
  label: string;
  field: keyof AlgorithmParameters;
  device: { id: string; algorithm: AlgorithmParameters };
  onChange: (deviceId: string, patch: Partial<AlgorithmParameters>) => void;
  last?: boolean;
}

function ParamRow({ label, field, device, onChange, last }: ParamRowProps) {
  const [text, setText] = useState(String(device.algorithm[field]));
  useEffect(() => setText(String(device.algorithm[field])), [device.algorithm, field]);

  const commit = () => {
    const n = Number(text);
    if (Number.isFinite(n)) onChange(device.id, { [field]: field === 'smoothingWindow' ? Math.max(1, Math.round(n)) : n });
    else setText(String(device.algorithm[field]));
  };

  return (
    <Row
      label={label}
      last={last}
      right={
        <TextInput value={text} onChangeText={setText} onBlur={commit} onSubmitEditing={commit} keyboardType="decimal-pad" style={styles.input} />
      }
    />
  );
}

const styles = StyleSheet.create({
  missing: { ...fonts.body, color: colors.textSecondary, padding: spacing.lg },
  deviceImage: { width: '100%', height: 160, marginTop: spacing.lg },
  backButton: { paddingHorizontal: 4, paddingVertical: 4 },
  input: {
    minWidth: 80,
    textAlign: 'right',
    ...fonts.body,
    color: colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: colors.background,
    borderRadius: 6,
  },
});
