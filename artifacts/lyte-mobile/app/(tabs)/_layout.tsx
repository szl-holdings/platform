import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import * as Linking from "expo-linking";
import { Tabs, router } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import React, { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
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

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "gauge.medium", selected: "gauge.medium" }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="health">
        <Icon sf={{ default: "heart.circle", selected: "heart.circle.fill" }} />
        <Label>Health</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="alerts">
        <Icon sf={{ default: "bell", selected: "bell.fill" }} />
        <Label>Alerts</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="board-mode">
        <Icon sf={{ default: "eye", selected: "eye.fill" }} />
        <Label>Board</Label>
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
        options={{
          title: "Health",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="heart.circle" tintColor={color} size={22} />
            ) : (
              <Feather name="heart" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="bell" tintColor={color} size={22} />
            ) : (
              <Feather name="bell" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="board-mode"
        options={{
          title: "Board",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="eye" tintColor={color} size={22} />
            ) : (
              <Feather name="eye" size={20} color={color} />
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
