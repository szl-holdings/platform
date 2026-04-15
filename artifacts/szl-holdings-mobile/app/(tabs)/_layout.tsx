import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import * as Linking from "expo-linking";
import { Redirect, Tabs, router } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import React, { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { SpotlightFab, SpotlightModal, type SpotlightCommand } from "@szl-holdings/mobile-shared/components";
import { useEcosystemTabBarScreenOptions } from "@szl-holdings/mobile-shared";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const SZL_ACCENT = "#c9a84c";

const szlCommands: SpotlightCommand[] = [
  { id: "nav-command", label: "Command", description: "Executive command overview", icon: "◆", group: "Navigate", action: () => router.push("/(tabs)") },
  { id: "nav-portfolio", label: "Portfolio", description: "Holdings & venture performance", icon: "💼", group: "Navigate", action: () => router.push("/(tabs)/portfolio") },
  { id: "nav-investors", label: "Investors", description: "Investor relations & reports", icon: "📈", group: "Navigate", action: () => router.push("/(tabs)/investor") },
  { id: "nav-agents", label: "AI Agents", description: "SZL executive AI assistants", icon: "🤖", group: "Navigate", action: () => router.push("/(tabs)/agent-chat") },
  { id: "nav-profile", label: "Profile", description: "Account & settings", icon: "👤", group: "Navigate", action: () => router.push("/(tabs)/profile") },
  { id: "action-portfolio", label: "View Portfolio", description: "Check current portfolio performance", icon: "💰", group: "Quick Actions", isQuickAction: true, keywords: ["money", "invest", "return"], action: () => router.push("/(tabs)/portfolio") },
  { id: "action-approvals", label: "Pending Approvals", description: "Items awaiting executive sign-off", icon: "✅", group: "Quick Actions", isQuickAction: true, keywords: ["approve", "review", "sign"], action: () => router.push("/(tabs)") },
  { id: "action-reports", label: "Investor Reports", description: "Generate investor update", icon: "📊", group: "Quick Actions", isQuickAction: true, keywords: ["report", "update", "brief"], action: () => router.push("/(tabs)/investor") },
  { id: "cross-lyte", label: "Open Lyte", description: "Business Observability Command", icon: "⚡", group: "Ecosystem", keywords: ["app", "switch"], action: () => Linking.openURL("lyte://") },
  { id: "cross-aegis", label: "Open Aegis", description: "Unified Defense & Intelligence", icon: "🛡", group: "Ecosystem", keywords: ["app", "switch"], action: () => Linking.openURL("aegis://") },
];

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "gauge.medium", selected: "gauge.medium" }} />
        <Label>Command</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="portfolio">
        <Icon sf={{ default: "briefcase", selected: "briefcase.fill" }} />
        <Label>Portfolio</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="investor">
        <Icon sf={{ default: "chart.line.uptrend.xyaxis", selected: "chart.line.uptrend.xyaxis.circle.fill" }} />
        <Label>Investors</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="agent-chat">
        <Icon sf={{ default: "sparkles", selected: "sparkles" }} />
        <Label>AI</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="agents" options={{ href: null }} />
      <NativeTabs.Trigger name="trust" options={{ href: null }} />
      <NativeTabs.Trigger name="mcp-tools" options={{ href: null }} />
      <NativeTabs.Trigger name="profile" options={{ href: null }} />
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  const tabBarScreenOptions = useEcosystemTabBarScreenOptions({
    accentColor: colors.gold,
    inactiveColor: "rgba(240,238,255,0.2)",
    backgroundColor: "#090810",
    borderColor: "rgba(201,168,76,0.1)",
  });

  return (
    <Tabs screenOptions={tabBarScreenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Command",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="gauge.medium" tintColor={color} size={22} />
            ) : (
              <Feather name="activity" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: "Portfolio",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="briefcase" tintColor={color} size={22} />
            ) : (
              <Feather name="briefcase" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="investor"
        options={{
          title: "Investors",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="chart.line.uptrend.xyaxis" tintColor={color} size={22} />
            ) : (
              <Feather name="trending-up" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="trust"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="mcp-tools"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="agent-chat"
        options={{
          title: "AI",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="sparkles" tintColor={color} size={22} />
            ) : (
              <Feather name="message-circle" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person" tintColor={color} size={22} />
            ) : (
              <Feather name="user" size={20} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/auth" />;
  }

  return (
    <View style={{ flex: 1 }}>
      {isLiquidGlassAvailable() ? <NativeTabLayout /> : <ClassicTabLayout />}
      <SpotlightFab
        onPress={() => setSpotlightOpen(true)}
        accentColor={SZL_ACCENT}
        bottom={100}
        right={20}
      />
      <SpotlightModal
        visible={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        commands={szlCommands}
        appName="SZL"
        accentColor={SZL_ACCENT}
        placeholder="Search portfolio, investors & more..."
      />
    </View>
  );
}
