import { Feather, Ionicons } from '@expo/vector-icons';
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
import { palette } from '@/lib/gi-bridge';

const ACCENT = palette.critical;

const defenseCommands: SpotlightCommand[] = [
  {
    id: 'nav-dashboard',
    label: 'SOC Dashboard',
    description: 'Security operations center overview',
    icon: '🛡',
    group: 'Navigate',
    action: () => router.push('/(shell)/defense/(tabs)'),
  },
  {
    id: 'nav-incidents',
    label: 'Incidents',
    description: 'Active security incidents',
    icon: '⚠',
    group: 'Navigate',
    action: () => router.push('/(shell)/defense/(tabs)/incidents'),
  },
  {
    id: 'nav-ai',
    label: 'Sentinel AI',
    description: 'SOC intelligence assistant',
    icon: '🤖',
    group: 'Navigate',
    action: () => router.push('/(shell)/defense/(tabs)/agent-chat'),
  },
  {
    id: 'nav-digest',
    label: 'Digest',
    description: 'Security briefings',
    icon: '📋',
    group: 'Navigate',
    action: () => router.push('/(shell)/defense/(tabs)/digest'),
  },
  {
    id: 'nav-findings',
    label: 'Findings',
    description: 'Vulnerability findings',
    icon: '🔍',
    group: 'Navigate',
    action: () => router.push('/(shell)/defense/findings'),
  },
  {
    id: 'nav-mitre',
    label: 'MITRE ATT&CK',
    description: 'Attack framework reference',
    icon: '🎯',
    group: 'Navigate',
    action: () => router.push('/(shell)/defense/mitre'),
  },
];

function NativeTabLayout() {
  const { setActiveWorkspace } = useWorkspace();
  useEffect(() => {
    setActiveWorkspace('defense');
  }, [setActiveWorkspace]);
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'shield', selected: 'shield.fill' }} />
        <Label>SOC</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="incidents">
        <Icon
          sf={{ default: 'exclamationmark.triangle', selected: 'exclamationmark.triangle.fill' }}
        />
        <Label>Incidents</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="agent-chat">
        <Icon
          sf={{
            default: 'bubble.left.and.bubble.right',
            selected: 'bubble.left.and.bubble.right.fill',
          }}
        />
        <Label>Sentinel</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="digest">
        <Icon sf={{ default: 'doc.text', selected: 'doc.text.fill' }} />
        <Label>Digest</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="agents" options={{ href: null } as any} />
      <NativeTabs.Trigger name="approvals" options={{ href: null } as any} />
      <NativeTabs.Trigger name="findings" options={{ href: null } as any} />
      <NativeTabs.Trigger name="mitre" options={{ href: null } as any} />
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
    setActiveWorkspace('defense');
  }, [setActiveWorkspace]);

  const tabBarScreenOptions = useEcosystemTabBarScreenOptions({
    accentColor: ACCENT,
    inactiveColor: 'rgba(232,234,240,0.25)',
    backgroundColor: colors.navy,
    borderColor: colors.border,
    blurIntensity: 90,
  });

  return (
    <Tabs screenOptions={tabBarScreenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'SOC',
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerLeft: () => <WorkspaceTrigger accentColor={ACCENT} />,
          headerRight: () => <SettingsHeaderButton />,
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="shield.fill" tintColor={color} size={22} />
            ) : (
              <Ionicons name="shield" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="incidents"
        options={{
          title: 'Incidents',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="exclamationmark.triangle.fill" tintColor={color} size={22} />
            ) : (
              <Ionicons name="warning" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="agent-chat"
        options={{
          title: 'Sentinel',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="bubble.left.and.bubble.right.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="message-circle" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="digest"
        options={{
          title: 'Digest',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="doc.text.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="file-text" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen name="agents" options={{ href: null } as any} />
      <Tabs.Screen name="approvals" options={{ href: null } as any} />
      <Tabs.Screen name="findings" options={{ href: null } as any} />
      <Tabs.Screen name="mitre" options={{ href: null } as any} />
      <Tabs.Screen name="mcp-tools" options={{ href: null } as any} />
      <Tabs.Screen name="profile" options={{ href: null } as any} />
    </Tabs>
  );
}

export default function DefenseTabLayout() {
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
        commands={defenseCommands}
        appName="Defense"
        accentColor={ACCENT}
        placeholder="Search incidents, findings & threats..."
      />
    </View>
  );
}
