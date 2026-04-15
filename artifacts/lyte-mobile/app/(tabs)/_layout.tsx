import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import * as Linking from "expo-linking";
import { Tabs, router } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import React, { useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { SpotlightFab, SpotlightModal, type SpotlightCommand } from "@szl-holdings/mobile-shared/components";
import { LYTE_COLORS } from "@/constants/colors";

const LYTE_ACCENT = "#00d4ff";

const lyteCommands: SpotlightCommand[] = [
  { id: "nav-dashboard", label: "Dashboard", description: "Executive command overview", icon: "⚡", group: "Navigate", action: () => router.push("/(tabs)") },
  { id: "nav-health", label: "Service Health", description: "System & service health status", icon: "💚", group: "Navigate", action: () => router.push("/(tabs)/health") },
  { id: "nav-alerts", label: "Alerts", description: "Active alerts & notifications", icon: "🔔", group: "Navigate", action: () => router.push("/(tabs)/alerts") },
  { id: "nav-board", label: "Board Mode", description: "Executive board view", icon: "👁", group: "Navigate", action: () => router.push("/(tabs)/board-mode") },
  { id: "nav-profile", label: "Profile", description: "Account & settings", icon: "👤", group: "Navigate", action: () => router.push("/(tabs)/profile") },
  { id: "action-blockers", label: "View Blockers", description: "See all active blockers", icon: "🚫", group: "Quick Actions", isQuickAction: true, keywords: ["block", "issue", "problem"], action: () => router.push("/(tabs)/alerts") },
  { id: "action-approvals", label: "Open Approvals", description: "Review items waiting for approval", icon: "✅", group: "Quick Actions", isQuickAction: true, keywords: ["approve", "review", "sign off"], action: () => router.push("/(tabs)") },
  { id: "action-digest", label: "Daily Digest", description: "AI-generated executive briefing", icon: "📋", group: "Quick Actions", isQuickAction: true, keywords: ["summary", "brief", "report"], action: () => router.push("/(tabs)") },
  { id: "cross-aegis", label: "Open Aegis", description: "Unified Defense & Intelligence", icon: "🛡", group: "Ecosystem", keywords: ["app", "switch"], action: () => Linking.openURL("aegis://") },
  { id: "cross-vessels", label: "Open Vessels", description: "Maritime Command Intelligence", icon: "⚓", group: "Ecosystem", keywords: ["app", "switch"], action: () => Linking.openURL("vessels://") },
];

function ProfileButton() {
  const isIOS = Platform.OS === "ios";
  return (
    <TouchableOpacity
      onPress={() => router.push("/profile")}
      style={{ marginRight: 12, padding: 4 }}
      accessibilityLabel="Profile"
      accessibilityRole="button"
    >
      {isIOS ? (
        <SymbolView name="person.circle" tintColor={LYTE_COLORS.electricBlue} size={24} />
      ) : (
        <Feather name="user" size={22} color={LYTE_COLORS.electricBlue} />
      )}
    </TouchableOpacity>
  );
}

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "gauge.medium", selected: "gauge.medium" }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="signals">
        <Icon sf={{ default: "waveform", selected: "waveform" }} />
        <Label>Signals</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="prism">
        <Icon sf={{ default: "sparkles", selected: "sparkles" }} />
        <Label>PRISM</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="agent-chat">
        <Icon sf={{ default: "bubble.left.and.bubble.right", selected: "bubble.left.and.bubble.right.fill" }} />
        <Label>AI</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: LYTE_COLORS.electricBlue,
        tabBarInactiveTintColor: "rgba(255,255,255,0.2)",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : "#070c14",
          borderTopWidth: 1,
          borderTopColor: "rgba(0,212,255,0.08)",
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#070c14" }]} />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 9,
          fontFamily: "Inter_500Medium",
          letterSpacing: 1,
          textTransform: "uppercase",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="gauge.medium" tintColor={color} size={22} />
            ) : (
              <Feather name="activity" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="health"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="signals"
        options={{
          title: "Signals",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="waveform" tintColor={color} size={22} />
            ) : (
              <MaterialCommunityIcons name="signal-variant" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="board-mode"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="receipts"
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
              <SymbolView name="bubble.left.and.bubble.right.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="message-circle" size={20} color={color} />
            ),
        }}
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
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      {isLiquidGlassAvailable() ? <NativeTabLayout /> : <ClassicTabLayout />}
      <SpotlightFab
        onPress={() => setSpotlightOpen(true)}
        accentColor={LYTE_ACCENT}
        bottom={100}
        right={20}
      />
      <SpotlightModal
        visible={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        commands={lyteCommands}
        appName="Lyte"
        accentColor={LYTE_ACCENT}
        placeholder="Search dashboards, alerts & actions..."
      />
    </View>
  );
}
