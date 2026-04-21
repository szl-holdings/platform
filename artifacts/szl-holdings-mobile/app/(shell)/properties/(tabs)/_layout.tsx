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

const ACCENT = '#c87941';

const propertiesCommands: SpotlightCommand[] = [
  {
    id: 'nav-map',
    label: 'Property Map',
    description: 'Interactive real estate map',
    icon: '🗺',
    group: 'Navigate',
    action: () => router.push('/(shell)/properties/(tabs)'),
  },
  {
    id: 'nav-properties',
    label: 'Properties',
    description: 'All listings',
    icon: '🏛',
    group: 'Navigate',
    action: () => router.push('/(shell)/properties/(tabs)/properties'),
  },
  {
    id: 'nav-pipeline',
    label: 'Pipeline',
    description: 'Deal pipeline',
    icon: '📊',
    group: 'Navigate',
    action: () => router.push('/(shell)/properties/(tabs)/pipeline'),
  },
  {
    id: 'nav-scanner',
    label: 'Scanner',
    description: 'AI property scanner',
    icon: '⚡',
    group: 'Navigate',
    action: () => router.push('/(shell)/properties/(tabs)/scanner'),
  },
  {
    id: 'nav-terra',
    label: 'Terra Modules',
    description: 'Rent Roll, Construction, Tenant Screening & more',
    icon: '🏗',
    group: 'Navigate',
    action: () => router.push('/(shell)/properties/(tabs)/terra-modules'),
  },
  {
    id: 'nav-rent-roll',
    label: 'Rent Roll',
    description: 'Live tenant rent roll & lease status',
    icon: '📄',
    group: 'Terra',
    action: () => router.push('/(shell)/properties/rent-roll'),
  },
  {
    id: 'nav-construction-monitor',
    label: 'Construction Monitor',
    description: 'Track active construction & renovation projects',
    icon: '🏗',
    group: 'Terra',
    action: () => router.push('/(shell)/properties/construction-monitor'),
  },
  {
    id: 'nav-tenant-screening',
    label: 'Tenant Screening',
    description: 'AI-powered applicant screening & scoring',
    icon: '🔍',
    group: 'Terra',
    action: () => router.push('/(shell)/properties/tenant-screening'),
  },
  {
    id: 'nav-ai',
    label: 'Terrain AI',
    description: 'Real estate intelligence assistant',
    icon: '🤖',
    group: 'Navigate',
    action: () => router.push('/(shell)/properties/(tabs)/agent-chat'),
  },
];

function NativeTabLayout() {
  const { setActiveWorkspace } = useWorkspace();
  useEffect(() => {
    setActiveWorkspace('properties');
  }, [setActiveWorkspace]);
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'map', selected: 'map.fill' }} />
        <Label>Map</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="properties">
        <Icon sf={{ default: 'building.2', selected: 'building.2.fill' }} />
        <Label>Properties</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="pipeline">
        <Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} />
        <Label>Pipeline</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="scanner">
        <Icon sf={{ default: 'sparkles', selected: 'sparkles' }} />
        <Label>Scanner</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="terra-modules">
        <Icon sf={{ default: 'building.columns', selected: 'building.columns.fill' }} />
        <Label>Terra</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="agent-chat">
        <Icon
          sf={{
            default: 'bubble.left.and.bubble.right',
            selected: 'bubble.left.and.bubble.right.fill',
          }}
        />
        <Label>Terrain</Label>
      </NativeTabs.Trigger>
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
    setActiveWorkspace('properties');
  }, [setActiveWorkspace]);

  const tabBarScreenOptions = useEcosystemTabBarScreenOptions({
    accentColor: ACCENT,
    inactiveColor: 'rgba(232,220,200,0.25)',
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
        name="properties"
        options={{
          title: 'Properties',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="building.2.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="home" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="pipeline"
        options={{
          title: 'Pipeline',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="chart.bar.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="bar-chart-2" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="sparkles" tintColor={color} size={22} />
            ) : (
              <Feather name="zap" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="terra-modules"
        options={{
          title: 'DOMAINE',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="building.columns.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="layers" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="agent-chat"
        options={{
          title: 'Terrain',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="bubble.left.and.bubble.right.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="message-circle" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen name="mcp-tools" options={{ href: null } as any} />
      <Tabs.Screen name="profile" options={{ href: null } as any} />
    </Tabs>
  );
}

export default function PropertiesTabLayout() {
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
        commands={propertiesCommands}
        appName="Properties"
        accentColor={ACCENT}
        placeholder="Search properties, pipeline & scanner..."
      />
    </View>
  );
}
