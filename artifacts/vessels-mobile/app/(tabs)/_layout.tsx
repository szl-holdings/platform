import { Feather } from "@expo/vector-icons";
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

const VESSELS_ACCENT = "#38bdf8";

const vesselsCommands: SpotlightCommand[] = [
  { id: "nav-map", label: "Fleet Map", description: "Live vessel positions & AIS tracking", icon: "🗺", group: "Navigate", action: () => router.push("/(tabs)") },
  { id: "nav-fleet", label: "Fleet", description: "Vessel list & status overview", icon: "⚓", group: "Navigate", action: () => router.push("/(tabs)/fleet") },
  { id: "nav-alerts", label: "Alerts", description: "Fleet alerts & geofence violations", icon: "🔔", group: "Navigate", action: () => router.push("/(tabs)/alerts") },
  { id: "nav-helmsman", label: "Helmsman AI", description: "Maritime AI assistant", icon: "🤖", group: "Navigate", action: () => router.push("/(tabs)/agent-chat") },
  { id: "nav-profile", label: "Profile", description: "Account & settings", icon: "👤", group: "Navigate", action: () => router.push("/(tabs)/profile") },
  { id: "action-search-vessel", label: "Search Vessel", description: "Search fleet by name or IMO", icon: "🔍", group: "Quick Actions", isQuickAction: true, action: () => router.push("/(tabs)/fleet") },
  { id: "action-view-alerts", label: "View Active Alerts", description: "See all current fleet alerts", icon: "⚠️", group: "Quick Actions", isQuickAction: true, action: () => router.push("/(tabs)/alerts") },
  { id: "action-distress", label: "Distress Signals", description: "Active distress beacons", icon: "🚨", group: "Quick Actions", isQuickAction: true, keywords: ["sos", "emergency", "mayday"], action: () => router.push("/(tabs)/alerts") },
  { id: "cross-aegis", label: "Open Aegis", description: "Unified Defense & Intelligence", icon: "🛡", group: "Ecosystem", keywords: ["app", "switch"], action: () => Linking.openURL("aegis://") },
  { id: "cross-lyte", label: "Open Lyte", description: "Business Observability Command", icon: "⚡", group: "Ecosystem", keywords: ["app", "switch"], action: () => Linking.openURL("lyte://") },
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

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "map", selected: "map.fill" }} />
        <Label>Map</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="fleet">
        <Icon sf={{ default: "ferry", selected: "ferry.fill" }} />
        <Label>Fleet</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="alerts">
        <Icon sf={{ default: "bell", selected: "bell.fill" }} />
        <Label>Alerts</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="agent-chat">
        <Icon sf={{ default: "bubble.left.and.bubble.right", selected: "bubble.left.and.bubble.right.fill" }} />
        <Label>Helmsman</Label>
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
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.navyDeep,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.navyDeep }]} />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 9,
          fontFamily: "Inter_500Medium",
          letterSpacing: 0.5,
          textTransform: "uppercase",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Map",
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
          headerRight: () => <ProfileButton color={colors.primary} />,
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="map" tintColor={color} size={22} />
            ) : (
              <Feather name="map" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="fleet"
        options={{
          title: "Fleet",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="ferry" tintColor={color} size={22} />
            ) : (
              <Feather name="anchor" size={20} color={color} />
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
        name="agent-chat"
        options={{
          title: "Helmsman",
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
        options={{ href: null }}
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
        accentColor={VESSELS_ACCENT}
        bottom={100}
        right={20}
      />
      <SpotlightModal
        visible={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        commands={vesselsCommands}
        appName="Vessels"
        accentColor={VESSELS_ACCENT}
        placeholder="Search fleet, vessels & alerts..."
      />
    </View>
  );
}
