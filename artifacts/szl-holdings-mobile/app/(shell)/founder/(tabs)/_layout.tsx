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

const ACCENT = '#6366f1';

const founderCommands: SpotlightCommand[] = [
  {
    id: 'nav-home',
    label: 'Home',
    description: 'Founder personal command',
    icon: '◊',
    group: 'Navigate',
    action: () => router.push('/(shell)/founder/(tabs)'),
  },
  {
    id: 'nav-articles',
    label: 'Articles',
    description: 'Published writing',
    icon: '📝',
    group: 'Navigate',
    action: () => router.push('/(shell)/founder/(tabs)/articles'),
  },
  {
    id: 'nav-ventures',
    label: 'Ventures',
    description: 'Platform ventures',
    icon: '🚀',
    group: 'Navigate',
    action: () => router.push('/(shell)/founder/(tabs)/ventures'),
  },
  {
    id: 'nav-tools',
    label: 'Tools',
    description: 'Command tools',
    icon: '🔧',
    group: 'Navigate',
    action: () => router.push('/(shell)/founder/(tabs)/tools'),
  },
];

function NativeTabLayout() {
  const { setActiveWorkspace } = useWorkspace();
  useEffect(() => {
    setActiveWorkspace('founder');
  }, [setActiveWorkspace]);
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="articles">
        <Icon sf={{ default: 'doc.text', selected: 'doc.text.fill' }} />
        <Label>Articles</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ventures">
        <Icon sf={{ default: 'arrow.up' as any, selected: 'arrow.up.circle.fill' as any }} />
        <Label>Ventures</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tools">
        <Icon sf={{ default: 'terminal', selected: 'terminal.fill' }} />
        <Label>Tools</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === 'ios';
  const { setActiveWorkspace } = useWorkspace();
  useEffect(() => {
    setActiveWorkspace('founder');
  }, [setActiveWorkspace]);

  const tabBarScreenOptions = useEcosystemTabBarScreenOptions({
    accentColor: ACCENT,
    inactiveColor: 'rgba(99,102,241,0.25)',
    backgroundColor: colors.navy,
    borderColor: colors.border,
    blurIntensity: 90,
  });

  return (
    <Tabs screenOptions={tabBarScreenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerLeft: () => <WorkspaceTrigger accentColor={ACCENT} />,
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="home" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="articles"
        options={{
          title: 'Articles',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="doc.text.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="file-text" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="ventures"
        options={{
          title: 'Ventures',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="arrow.up.circle.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="zap" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Tools',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="terminal" tintColor={color} size={22} />
            ) : (
              <Feather name="cpu" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="user" size={20} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function FounderTabLayout() {
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
        commands={founderCommands}
        appName="Founder"
        accentColor={ACCENT}
        placeholder="Search ventures, articles & tools..."
      />
    </View>
  );
}
