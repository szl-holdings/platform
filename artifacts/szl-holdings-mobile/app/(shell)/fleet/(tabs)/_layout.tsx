import { Feather } from '@expo/vector-icons';
import { useEcosystemTabBarScreenOptions } from '@szl-holdings/mobile-shared';
import {
  type SpotlightCommand,
  SpotlightFab,
  SpotlightModal,
} from '@szl-holdings/mobile-shared/components';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { router, Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { WorkspaceTrigger } from '@/components/WorkspaceSwitcher';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useColors } from '@/hooks/useColors';

const ACCENT = '#0ea5e9';

const fleetCommands: SpotlightCommand[] = [
  {
    id: 'nav-map',
    label: 'Fleet Map',
    description: 'Live vessel positions',
    icon: '🗺',
    group: 'Navigate',
    action: () => router.push('/(shell)/fleet/(tabs)'),
  },
  {
    id: 'nav-fleet',
    label: 'Fleet List',
    description: 'All vessels',
    icon: '⚓',
    group: 'Navigate',
    action: () => router.push('/(shell)/fleet/(tabs)/fleet'),
  },
  {
    id: 'nav-alerts',
    label: 'Alerts',
    description: 'Fleet alerts & exceptions',
    icon: '🔔',
    group: 'Navigate',
    action: () => router.push('/(shell)/fleet/(tabs)/alerts'),
  },
  {
    id: 'nav-ai',
    label: 'Helmsman AI',
    description: 'Maritime intelligence assistant',
    icon: '🤖',
    group: 'Navigate',
    action: () => router.push('/(shell)/fleet/(tabs)/agent-chat'),
  },
];

function NativeTabLayout() {
  const { setActiveWorkspace } = useWorkspace();
  useEffect(() => {
    setActiveWorkspace('fleet');
  }, [setActiveWorkspace]);
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'map', selected: 'map.fill' }} />
        <Label>Map</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="fleet">
        <Icon sf={{ default: 'ferry', selected: 'ferry.fill' }} />
        <Label>Fleet</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="alerts">
        <Icon sf={{ default: 'bell', selected: 'bell.fill' }} />
        <Label>Alerts</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="agent-chat">
        <Icon
          sf={{
            default: 'bubble.left.and.bubble.right',
            selected: 'bubble.left.and.bubble.right.fill',
          }}
        />
        <Label>Helmsman</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="economics" options={{ href: null } as any} />
      <NativeTabs.Trigger name="mcp-tools" options={{ href: null } as any} />
      <NativeTabs.Trigger name="profile" options={{ href: null } as any} />
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === 'ios';
  const { setActiveWorkspace } = useWorkspace();
  useEffect(() => {
    setActiveWorkspace('fleet');
  }, [setActiveWorkspace]);

  const tabBarScreenOptions = useEcosystemTabBarScreenOptions({
    accentColor: ACCENT,
    inactiveColor: 'rgba(224,242,254,0.25)',
    backgroundColor: colors.navy,
    borderColor: colors.border,
    blurIntensity: 90,
  });

  return (
    <Tabs screenOptions={tabBarScreenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerLeft: () => <WorkspaceTrigger accentColor={ACCENT} />,
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="map" tintColor={color} size={22} />
            ) : (
              <Feather name="map" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="fleet"
        options={{
          title: 'Fleet',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="ferry" tintColor={color} size={22} />
            ) : (
              <Feather name="anchor" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="bell" tintColor={color} size={22} />
            ) : (
              <Feather name="bell" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="agent-chat"
        options={{
          title: 'Helmsman',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="bubble.left.and.bubble.right.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="message-circle" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen name="economics" options={{ href: null } as any} />
      <Tabs.Screen name="mcp-tools" options={{ href: null } as any} />
      <Tabs.Screen name="profile" options={{ href: null } as any} />
    </Tabs>
  );
}

export default function FleetTabLayout() {
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      {isLiquidGlassAvailable() ? <NativeTabLayout /> : <ClassicTabLayout />}
      <SpotlightFab
        onPress={() => setSpotlightOpen(true)}
        accentColor={ACCENT}
        bottom={100}
        right={20}
      />
      <SpotlightModal
        visible={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        commands={fleetCommands}
        appName="Fleet"
        accentColor={ACCENT}
        placeholder="Search fleet, vessels & alerts..."
      />
    </View>
  );
}
