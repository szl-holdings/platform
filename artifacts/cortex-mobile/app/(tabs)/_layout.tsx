import { Feather, Ionicons } from "@expo/vector-icons";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Redirect, Tabs, router } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SpotlightFab, SpotlightModal, type SpotlightCommand } from "@szl-holdings/mobile-shared/components";
import { useEcosystemTabBarScreenOptions } from "@szl-holdings/mobile-shared";

import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useColors } from "@/hooks/useColors";
import { WORKSPACE_TABS } from "@/constants/tabs";
import { WORKSPACES } from "@/constants/workspaces";

function WorkspaceButton({ accentColor }: { accentColor: string }) {
  const { config } = useWorkspace();
  return (
    <TouchableOpacity
      onPress={() => router.push("/workspace-switcher")}
      style={styles.wsButton}
      accessibilityLabel="Switch workspace"
    >
      <View style={[styles.wsButtonInner, { backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40` }]}>
        <Text style={styles.wsButtonIcon}>{config.icon}</Text>
      </View>
    </TouchableOpacity>
  );
}

function ProfileButton({ color }: { color: string }) {
  const isIOS = Platform.OS === "ios";
  return (
    <TouchableOpacity
      onPress={() => {}}
      style={{ marginRight: 12, padding: 4 }}
      accessibilityLabel="Profile"
    >
      {isIOS ? (
        <SymbolView name="person.circle" tintColor={color} size={24} />
      ) : (
        <Feather name="user" size={22} color={color} />
      )}
    </TouchableOpacity>
  );
}

function buildSpotlightCommands(activeWorkspaceId: string, accentColor: string): SpotlightCommand[] {
  const commands: SpotlightCommand[] = [
    { id: "nav-command", label: "Command", description: "Workspace dashboard", icon: "📊", group: "Navigate", action: () => router.push("/(tabs)") },
    { id: "nav-signals", label: "Signals", description: "Alerts & pipeline", icon: "📡", group: "Navigate", action: () => router.push("/(tabs)/signals") },
    { id: "nav-copilot", label: "Copilot", description: "AI assistant", icon: "🤖", group: "Navigate", action: () => router.push("/(tabs)/copilot") },
    { id: "nav-feed", label: "CORTEX Feed", description: "Cross-workspace feed", icon: "🧠", group: "Navigate", action: () => router.push("/(tabs)/feed") },
    { id: "action-switch", label: "Switch Workspace", description: "Open workspace switcher", icon: "🔄", group: "Quick Actions", isQuickAction: true, action: () => router.push("/workspace-switcher") },
  ];
  WORKSPACES.filter(w => w.id !== activeWorkspaceId).forEach(w => {
    commands.push({ id: `ws-${w.id}`, label: `Switch to ${w.label}`, description: w.description, icon: w.icon, group: "Workspaces", action: () => router.push("/workspace-switcher") });
  });
  return commands;
}

function NativeTabLayout() {
  const { config } = useWorkspace();
  const tabs = WORKSPACE_TABS[config.id];
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: tabs[0]?.sfIcon ?? "square.grid.2x2", selected: tabs[0]?.sfIconSelected ?? "square.grid.2x2.fill" } as any} />
        <Label>{tabs[0]?.label ?? "Command"}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="signals">
        <Icon sf={{ default: tabs[1]?.sfIcon ?? "bell", selected: tabs[1]?.sfIconSelected ?? "bell.fill" } as any} />
        <Label>{tabs[1]?.label ?? "Signals"}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="feed">
        <Icon sf={{ default: "brain.head.profile", selected: "brain.head.profile.fill" } as any} />
        <Label>Feed</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="copilot">
        <Icon sf={{ default: "bubble.left.and.bubble.right", selected: "bubble.left.and.bubble.right.fill" } as any} />
        <Label>{tabs[2]?.label ?? "Copilot"}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const { config } = useWorkspace();
  const isIOS = Platform.OS === "ios";
  const tabs = WORKSPACE_TABS[config.id];

  const tabBarScreenOptions = useEcosystemTabBarScreenOptions({
    accentColor: config.accentColor,
    inactiveColor: "rgba(232,234,240,0.25)",
    backgroundColor: colors.navy,
    borderColor: colors.border,
    blurIntensity: 90,
  });

  return (
    <Tabs screenOptions={tabBarScreenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: tabs[0]?.label ?? "Command",
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
          headerLeft: () => <WorkspaceButton accentColor={config.accentColor} />,
          headerRight: () => <ProfileButton color={config.accentColor} />,
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name={(tabs[0]?.sfIconSelected ?? "square.grid.2x2.fill") as any} tintColor={color} size={22} />
            ) : (
              <Feather name={(tabs[0]?.androidIcon as any) ?? "grid"} size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="signals"
        options={{
          title: tabs[1]?.label ?? "Signals",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name={(tabs[1]?.sfIconSelected ?? "bell.fill") as any} tintColor={color} size={22} />
            ) : (
              <Feather name={(tabs[1]?.androidIcon as any) ?? "bell"} size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="brain.head.profile" tintColor={color} size={22} />
            ) : (
              <Feather name="rss" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="copilot"
        options={{
          title: tabs[2]?.label ?? "Copilot",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="bubble.left.and.bubble.right.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="message-circle" size={20} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { config, activeWorkspace } = useWorkspace();
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/auth" />;
  }

  return (
    <View style={{ flex: 1 }}>
      {isLiquidGlassAvailable() ? (
        <NativeTabLayout />
      ) : (
        <ClassicTabLayout />
      )}
      <SpotlightFab
        onPress={() => setSpotlightOpen(true)}
        accentColor={config.accentColor}
        bottom={100}
        right={20}
      />
      <SpotlightModal
        visible={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        commands={buildSpotlightCommands(activeWorkspace, config.accentColor)}
        appName="CORTEX"
        accentColor={config.accentColor}
        placeholder="Search commands, workspaces & screens..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wsButton: { marginLeft: 12, padding: 4 },
  wsButtonInner: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  wsButtonIcon: { fontSize: 16 },
});
