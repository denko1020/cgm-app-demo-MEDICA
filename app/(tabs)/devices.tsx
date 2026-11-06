import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { cgmController } from '@/core/cgm/cgmController';
import { useStrings } from '@/core/i18n';
import { useAppStore } from '@/core/store/appStore';
import { EmptyRow, Row, Section } from '@/ui/components/GroupedList';
import { Screen } from '@/ui/components/Screen';
import { createStyles, fonts, radius, spacing, stroke, useColors } from '@/ui/theme';

export default function DevicesScreen() {
  const t = useStrings();
  const c = useColors();
  const styles = useStyles();
  const router = useRouter();
  const devices = useAppStore((s) => s.devices);
  const discovered = useAppStore((s) => s.discovered);
  const scanning = useAppStore((s) => s.scanning);
  const activeDeviceId = useAppStore((s) => s.activeDeviceId);
  const connection = useAppStore((s) => s.connection);

  const unpaired = discovered.filter((d) => !devices.some((p) => p.id === d.id));

  const scanButton = scanning ? (
    <ActivityIndicator color={c.primary} />
  ) : (
    <Pressable onPress={() => cgmController.startScan()} hitSlop={8} accessibilityLabel="scan">
      <Ionicons name="add" size={28} color={c.primary} />
    </Pressable>
  );

  return (
    <Screen title={t.devices.title} headerRight={scanButton}>
      <Section title={t.devices.paired} footer={devices.length === 0 ? t.devices.scanHint : undefined}>
        {devices.length === 0 ? <EmptyRow text={t.common.none} /> : null}
        {devices.map((d, i) => {
          const isActive = d.id === activeDeviceId;
          const connected = isActive && connection === 'connected';
          const connecting = isActive && connection === 'connecting';
          return (
            <Row
              key={d.id}
              label={d.name}
              subtitle={d.id}
              last={i === devices.length - 1}
              chevron
              onPress={() => router.push(`/device/${d.id}`)}
              right={
                <View style={styles.status}>
                  {connecting ? (
                    <ActivityIndicator size="small" color={c.primary} />
                  ) : (
                    <Ionicons
                      name={connected ? 'checkmark-circle' : 'ban'}
                      size={20}
                      color={connected ? c.green : c.red}
                    />
                  )}
                  <Ionicons
                    name={d.info.batteryLevel > 20 ? 'battery-full' : 'battery-dead'}
                    size={20}
                    color={d.info.batteryLevel > 20 ? c.green : c.red}
                    style={{ marginLeft: spacing.sm }}
                  />
                </View>
              }
            />
          );
        })}
      </Section>

      {scanning || unpaired.length > 0 ? (
        <Section title={scanning ? t.devices.scanning : t.devices.discovered}>
          {unpaired.length === 0 ? <EmptyRow text={t.devices.noneFound} /> : null}
          {unpaired.map((d, i) => (
            <Row
              key={d.id}
              label={d.name}
              subtitle={`${d.id}, ${t.devices.signal} ${d.rssi} dBm`}
              last={i === unpaired.length - 1}
              right={
                <Pressable onPress={() => void cgmController.connect(d.id)} style={styles.connectBtn}>
                  <Text style={styles.connectText}>{t.devices.connect}</Text>
                </Pressable>
              }
            />
          ))}
        </Section>
      ) : null}
    </Screen>
  );
}

const useStyles = createStyles((c) =>
  StyleSheet.create({
    status: { flexDirection: 'row', alignItems: 'center', marginLeft: spacing.md },
    connectBtn: {
      minHeight: 36,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      borderWidth: stroke.control,
      borderColor: c.primary,
      borderRadius: radius.control,
    },
    connectText: { ...fonts.footnote, color: c.primary, fontWeight: '600' },
  }),
);
