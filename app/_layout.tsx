import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { activityController } from '@/core/activity/activityController';
import { cgmController } from '@/core/cgm/cgmController';
import { useStrings } from '@/core/i18n';
import { useAppStore } from '@/core/store/appStore';
import { ConfirmProvider } from '@/ui/components/Confirm';
import { createStyles, darkColors, lightColors, useColors } from '@/ui/theme';

export default function RootLayout() {
  const t = useStrings();
  const c = useColors();
  const styles = useStyles();
  const dark = useAppStore((s) => s.darkMode);

  useEffect(() => {
    cgmController.bootstrap();
    activityController.bootstrap();
  }, []);

  // A home-screen install on iOS gets an opaque status bar above the web view,
  // coloured from `theme-color` (see public/index.html). Keep that tag in step
  // with the in-app dark switch so the strip never reads as a white band.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const tag = document.querySelector('meta[name="theme-color"]');
    tag?.setAttribute('content', dark ? darkColors.background : lightColors.background);
  }, [dark]);

  return (
    <SafeAreaProvider>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <View style={styles.host}>
        <View style={styles.frame}>
          <ConfirmProvider>
            <Stack
              screenOptions={{
                headerTintColor: c.primary,
                headerTitleStyle: { color: c.text },
                headerStyle: { backgroundColor: c.background },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: c.background },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="device/[id]" options={{ title: t.devices.profile }} />
            </Stack>
          </ConfirmProvider>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

// On the web the app renders inside a phone-sized frame so the layout matches
// what iOS/Android builds will show; native platforms fill the screen.
const useStyles = createStyles((c) =>
  StyleSheet.create({
    host: {
      flex: 1,
      backgroundColor: Platform.OS === 'web' ? c.webBackdrop : c.background,
      alignItems: 'center',
    },
    frame: {
      flex: 1,
      width: '100%',
      maxWidth: Platform.OS === 'web' ? 430 : undefined,
      backgroundColor: c.background,
      ...(Platform.OS === 'web' ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: c.webFrameBorder } : null),
    },
  }),
);
