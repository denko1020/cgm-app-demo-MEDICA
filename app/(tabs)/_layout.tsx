import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { useStrings } from '@/core/i18n';
import { colors } from '@/ui/theme';

type IconName = keyof typeof Ionicons.glyphMap;

function icon(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} color={color} size={size} />;
}

export default function TabsLayout() {
  const t = useStrings();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.separator },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t.tabs.home, tabBarIcon: icon('pulse-outline') }} />
      <Tabs.Screen name="readings" options={{ title: t.tabs.readings, tabBarIcon: icon('list-outline') }} />
      <Tabs.Screen name="devices" options={{ title: t.tabs.devices, tabBarIcon: icon('radio-outline') }} />
      <Tabs.Screen name="stats" options={{ title: t.tabs.stats, tabBarIcon: icon('information-circle-outline') }} />
      <Tabs.Screen name="settings" options={{ title: t.tabs.settings, tabBarIcon: icon('options-outline') }} />
    </Tabs>
  );
}
