import { Feather } from "@expo/vector-icons";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs, router } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import React, { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { SpotlightFab, SpotlightModal, type SpotlightCommand } from "@szl-holdings/mobile-shared/components";
import { useEcosystemTabBarScreenOptions } from "@szl-holdings/mobile-shared";
import { useColors } from "@/hooks/useColors";
import { useWorkspace } from "@/context/WorkspaceContext";
import { WorkspaceTrigger } from "@/components/WorkspaceSwitcher";

const ACCENT = "#a855f7";

const operationsCommands: SpotlightCommand[] = [
  { id: "nav-inbox", label: "Signal Inbox", description: "AIOps signal triage", icon: "⚡", group: "Navigate", action: () => router.push("/(shell)/operations/(tabs)") },
  { id: "nav-alerts", label: "Alerts", description: "Platform alerts", icon: "🔔", group: "Navigate", action: () => router.push("/(shell)/operations/(tabs)/alerts") },
  { id: "nav-health", label: "Health", description: "Platform health status", icon: "💚", group: "Navigate", action: () => router.push("/(shell)/operations/(tabs)/health") },
  { id: "nav-signals", label: "Signals", description: "All signals", icon: "📡", group: "Navigate", action: () => router.push("/(shell)/operations/(tabs)/signals") },
  { id: "nav-ai", label: "Lyte AI", description: "AIOps intelligence assistant", icon: "🤖", group: "Navigate", action: () => router.push("/(shell)/operations/(tabs)/agent-chat") },
];

function NativeTabLayout() {
  const { setActiveWorkspace } = useWorkspace();
  useEffect(() => { setActiveWorkspace("operations"); }, [setActiveWorkspace]);
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "tray", selected: "tray.fill" }} />
        <Label>Inbox</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="alerts">
        <Icon sf={{ default: "bell", selected: "bell.fill" }} />
        <Label>Alerts</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="health">
        <Icon sf={{ default: "heart.text.square", selected: "heart.text.square.fill" }} />
        <Label>Health</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="agent-chat">
        <Icon sf={{ default: "bubble.left.and.bubble.right", selected: "bubble.left.and.bubble.right.fill" }} />
        <Label>Lyte AI</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="signals" options={{ href: null }} />
      <NativeTabs.Trigger name="board-mode" options={{ href: null }} />
      <NativeTabs.Trigger name="receipts" options={{ href: null }} />
      <NativeTabs.Trigger name="prism" options={{ href: null }} />
      <NativeTabs.Trigger name="mcp-tools" options={{ href: null }} />
      <NativeTabs.Trigger name="profile" options={{ href: null }} />
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  const { setActiveWorkspace } = useWorkspace();
  useEffect(() => { setActiveWorkspace("operations"); }, [setActiveWorkspace]);

  const tabBarScreenOptions = useEcosystemTabBarScreenOptions({
    accentColor: ACCENT,
    inactiveColor: "rgba(168,85,247,0.25)",
    backgroundColor: colors.navy,
    borderColor: colors.border,
    blurIntensity: 90,
  });

  return (
    <Tabs screenOptions={tabBarScreenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Inbox",
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
          headerLeft: () => <WorkspaceTrigger accentColor={ACCENT} />,
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="tray.fill" tintColor={color} size={22} /> : <Feather name="inbox" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="bell.fill" tintColor={color} size={22} /> : <Feather name="bell" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: "Health",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="heart.text.square.fill" tintColor={color} size={22} /> : <Feather name="activity" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="agent-chat"
        options={{
          title: "Lyte AI",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="bubble.left.and.bubble.right.fill" tintColor={color} size={22} /> : <Feather name="message-circle" size={20} color={color} />,
        }}
      />
      <Tabs.Screen name="signals" options={{ href: null }} />
      <Tabs.Screen name="board-mode" options={{ href: null }} />
      <Tabs.Screen name="receipts" options={{ href: null }} />
      <Tabs.Screen name="prism" options={{ href: null }} />
      <Tabs.Screen name="mcp-tools" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}

export default function OperationsTabLayout() {
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      {isLiquidGlassAvailable() ? <NativeTabLayout /> : <ClassicTabLayout />}
      <SpotlightFab onPress={() => setSpotlightOpen(true)} accentColor={ACCENT} bottom={100} right={20} />
      <SpotlightModal
        visible={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        commands={operationsCommands}
        appName="Operations"
        accentColor={ACCENT}
        placeholder="Search signals, alerts & health..."
      />
    </View>
  );
}
