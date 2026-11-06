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
import { IOS_WEB_APP_FOG, isIosWebApp } from '@/ui/iosWebApp';
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

  // The document sits behind our tree on the web: the browser paints it around
  // the app (overscroll, the status bar strip of a home-screen install) and iOS
  // samples it for system chrome. React Native Web only ever colours the app
  // itself, so keep the page in step with the dark switch by hand.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const background = dark ? darkColors.background : lightColors.background;
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    document.body.style.backgroundColor = background;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background);
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
      // Holds the whole app - the floating chips included - below the iOS 26
      // glass fade. The strip it leaves above is this view's own background,
      // which is all the effect then has to blur.
      paddingTop: isIosWebApp ? IOS_WEB_APP_FOG : 0,
      ...(Platform.OS === 'web' ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: c.webFrameBorder } : null),
    },
  }),
);
