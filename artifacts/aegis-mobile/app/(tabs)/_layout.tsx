import { Feather, Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import * as Linking from "expo-linking";
import { Redirect, Tabs, router } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import React, { useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { SpotlightFab, SpotlightModal, type SpotlightCommand } from "@szl-holdings/mobile-shared/components";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const AEGIS_ACCENT = "#f59e0b";

const aegisCommands: SpotlightCommand[] = [
  { id: "nav-dashboard", label: "Dashboard", description: "SOC overview & threat status", icon: "🛡", group: "Navigate", action: () => router.push("/(tabs)") },
  { id: "nav-incidents", label: "Incidents", description: "Active security incidents", icon: "⚠️", group: "Navigate", action: () => router.push("/(tabs)/incidents") },
  { id: "nav-agents", label: "Agent Chat", description: "AI security assistant", icon: "🤖", group: "Navigate", action: () => router.push("/(tabs)/agent-chat") },
  { id: "nav-digest", label: "Digest", description: "Security briefings & summaries", icon: "📄", group: "Navigate", action: () => router.push("/(tabs)/digest") },
  { id: "nav-profile", label: "Profile", description: "Account & settings", icon: "👤", group: "Navigate", action: () => router.push("/(tabs)/profile") },
  { id: "action-new-incident", label: "New Incident", description: "Create a new security incident", icon: "🚨", group: "Quick Actions", isQuickAction: true, action: () => router.push("/(tabs)/incidents") },
  { id: "action-mitre", label: "View MITRE ATT&CK", description: "Browse the attack framework matrix", icon: "🎯", group: "Quick Actions", isQuickAction: true, action: () => Linking.openURL("https://attack.mitre.org") },
  { id: "cross-lyte", label: "Open Lyte", description: "Business Observability Command", icon: "⚡", group: "Ecosystem", keywords: ["app", "switch"], action: () => Linking.openURL("lyte://") },
  { id: "cross-vessels", label: "Open Vessels", description: "Maritime Command Intelligence", icon: "⚓", group: "Ecosystem", keywords: ["app", "switch"], action: () => Linking.openURL("vessels://") },
];

function ProfileButton({ color }: { color: string }) {
  const isIOS = Platform.OS === "ios";
  return (
    <TouchableOpacity
      onPress={() => router.push("/profile")}
      style={{ marginRight: 12, padding: 4 }}
      accessibilityLabel="Profile"
      accessibilityRole="button"
    >
      {isIOS ? (
        <SymbolView name="person.circle" tintColor={color} size={24} />
      ) : (
        <Feather name="user" size={22} color={color} />
      )}
    </TouchableOpacity>
  );
}

function NativeTabLayout({ accentColor }: { accentColor: string }) {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "shield", selected: "shield.fill" }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="incidents">
        <Icon sf={{ default: "exclamationmark.triangle", selected: "exclamationmark.triangle.fill" }} />
        <Label>Incidents</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="agent-chat">
        <Icon sf={{ default: "bubble.left.and.bubble.right", selected: "bubble.left.and.bubble.right.fill" }} />
        <Label>AI</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: "rgba(232,234,240,0.25)",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.navy,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.navy }]} />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 9,
          fontFamily: "Inter_500Medium",
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
          headerRight: () => <ProfileButton color={colors.amber} />,
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
          title: "Incidents",
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
        name="agents"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="digest"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="profile"
        options={{ href: null }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const colors = useColors();
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/auth" />;
  }

  return (
    <View style={{ flex: 1 }}>
      {isLiquidGlassAvailable() ? (
        <NativeTabLayout accentColor={colors.amber} />
      ) : (
        <ClassicTabLayout />
      )}
      <SpotlightFab
        onPress={() => setSpotlightOpen(true)}
        accentColor={AEGIS_ACCENT}
        bottom={100}
        right={20}
      />
      <SpotlightModal
        visible={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        commands={aegisCommands}
        appName="Aegis"
        accentColor={AEGIS_ACCENT}
        placeholder="Search incidents, alerts & screens..."
      />
    </View>
  );
}
