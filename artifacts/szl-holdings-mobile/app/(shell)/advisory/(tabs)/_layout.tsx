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
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { SettingsHeaderButton, SettingsHeaderOverlay } from '@/components/SettingsHeaderButton';
import { WorkspaceTrigger } from '@/components/WorkspaceSwitcher';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useColors } from '@/hooks/useColors';
import { giColors } from '@/lib/gi-bridge';

const ACCENT = giColors.accent.green;

const advisoryCommands: SpotlightCommand[] = [
  {
    id: 'nav-home',
    label: 'Client Home',
    description: 'Advisory overview',
    icon: '◉',
    group: 'Navigate',
    action: () => router.push('/(shell)/advisory/(tabs)'),
  },
  {
    id: 'nav-docs',
    label: 'Documents',
    description: 'Client documents',
    icon: '📄',
    group: 'Navigate',
    action: () => router.push('/(shell)/advisory/(tabs)/documents'),
  },
  {
    id: 'nav-messages',
    label: 'Messages',
    description: 'Client messaging',
    icon: '💬',
    group: 'Navigate',
    action: () => router.push('/(shell)/advisory/(tabs)/messages'),
  },
  {
    id: 'nav-sessions',
    label: 'Sessions',
    description: 'Advisory sessions',
    icon: '📅',
    group: 'Navigate',
    action: () => router.push('/(shell)/advisory/(tabs)/sessions'),
  },
  {
    id: 'nav-ai',
    label: 'Advisory AI',
    description: 'Client advisory assistant',
    icon: '🤖',
    group: 'Navigate',
    action: () => router.push('/(shell)/advisory/(tabs)/agent-chat'),
  },
];

function NativeTabLayout() {
  const { setActiveWorkspace } = useWorkspace();
  useEffect(() => {
    setActiveWorkspace('advisory');
  }, [setActiveWorkspace]);
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="documents">
        <Icon sf={{ default: 'doc', selected: 'doc.fill' }} />
        <Label>Documents</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="messages">
        <Icon sf={{ default: 'message', selected: 'message.fill' }} />
        <Label>Messages</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="sessions">
        <Icon sf={{ default: 'calendar', selected: 'calendar.badge' as any }} />
        <Label>Sessions</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="agent-chat">
        <Icon
          sf={{
            default: 'bubble.left.and.bubble.right',
            selected: 'bubble.left.and.bubble.right.fill',
          }}
        />
        <Label>AI</Label>
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
    setActiveWorkspace('advisory');
  }, [setActiveWorkspace]);

  const tabBarScreenOptions = useEcosystemTabBarScreenOptions({
    accentColor: ACCENT,
    inactiveColor: 'rgba(16,185,129,0.25)',
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
          headerRight: () => <SettingsHeaderButton />,
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="home" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Documents',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="doc.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="file" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="message.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="message-square" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'Sessions',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="calendar" tintColor={color} size={22} />
            ) : (
              <Feather name="calendar" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="agent-chat"
        options={{
          title: 'AI',
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

export default function AdvisoryTabLayout() {
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      {isLiquidGlassAvailable() ? <NativeTabLayout /> : <ClassicTabLayout />}
      {isLiquidGlassAvailable() && <SettingsHeaderOverlay />}
      <SpotlightFab
        onPress={() => setSpotlightOpen(true)}
        accentColor={ACCENT}
        bottom={100}
        right={20}
      />
      <SpotlightModal
        visible={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        commands={advisoryCommands}
        appName="Advisory"
        accentColor={ACCENT}
        placeholder="Search documents, sessions & messages..."
      />
    </View>
  );
}
