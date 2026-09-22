import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { activityController } from '@/core/activity/activityController';
import { cgmController } from '@/core/cgm/cgmController';
import { useStrings } from '@/core/i18n';
import { ConfirmProvider } from '@/ui/components/Confirm';
import { SimSpeedControl } from '@/ui/components/SimSpeedControl';
import { ViewModeControl } from '@/ui/components/ViewModeControl';
import { colors } from '@/ui/theme';

export default function RootLayout() {
  const t = useStrings();

  useEffect(() => {
    cgmController.bootstrap();
    activityController.bootstrap();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={styles.host}>
        <View style={styles.frame}>
          <ConfirmProvider>
            <Stack
              screenOptions={{
                headerTintColor: colors.primary,
                headerTitleStyle: { color: colors.text },
                headerStyle: { backgroundColor: colors.background },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="device/[id]" options={{ title: t.devices.profile }} />
            </Stack>
            <ViewModeControl />
            <SimSpeedControl />
          </ConfirmProvider>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

// On the web the app renders inside a phone-sized frame so the layout matches
// what iOS/Android builds will show; native platforms fill the screen.
const styles = StyleSheet.create({
  host: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? '#ECE7DE' : colors.background,
    alignItems: 'center',
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 430 : undefined,
    backgroundColor: colors.background,
    ...(Platform.OS === 'web' ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#DAD3C6' } : null),
  },
});
