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
import { useColors } from "@/hooks/useColors";

const TERRA_ACCENT = "#c87941";

const terraCommands: SpotlightCommand[] = [
  { id: "nav-map", label: "Property Map", description: "Interactive real estate map", icon: "🗺", group: "Navigate", action: () => router.push("/(tabs)") },
  { id: "nav-properties", label: "Properties", description: "All listings & property details", icon: "🏡", group: "Navigate", action: () => router.push("/(tabs)/properties") },
  { id: "nav-pipeline", label: "Pipeline", description: "Deal pipeline & transaction status", icon: "📊", group: "Navigate", action: () => router.push("/(tabs)/pipeline") },
  { id: "nav-scanner", label: "Scanner", description: "AI property scanner & analysis", icon: "⚡", group: "Navigate", action: () => router.push("/(tabs)/scanner") },
  { id: "nav-profile", label: "Profile", description: "Account & settings", icon: "👤", group: "Navigate", action: () => router.push("/(tabs)/profile") },
  { id: "action-search", label: "Search Property", description: "Find properties by address or MLS", icon: "🔍", group: "Quick Actions", isQuickAction: true, keywords: ["find", "lookup", "mls", "address"], action: () => router.push("/(tabs)/properties") },
  { id: "action-new-deal", label: "New Deal", description: "Add a new transaction to pipeline", icon: "✍️", group: "Quick Actions", isQuickAction: true, keywords: ["add", "create", "transaction", "deal"], action: () => router.push("/(tabs)/pipeline") },
  { id: "action-scan", label: "Scan Property", description: "AI-powered property analysis", icon: "🔬", group: "Quick Actions", isQuickAction: true, keywords: ["analyze", "ai", "scan", "value"], action: () => router.push("/(tabs)/scanner") },
  { id: "cross-szl", label: "Open SZL Holdings", description: "Executive Command", icon: "◆", group: "Ecosystem", keywords: ["app", "switch"], action: () => Linking.openURL("szl-holdings://") },
];

function ProfileButton({ color }: { color: string }) {
  return (
    <TouchableOpacity
      onPress={() => router.push("/profile")}
      style={{ marginRight: 12, padding: 4 }}
      accessibilityLabel="Profile"
      accessibilityRole="button"
    >
      <Feather name="user" size={22} color={color} />
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
      <NativeTabs.Trigger name="properties">
        <Icon sf={{ default: "list.bullet", selected: "list.bullet" }} />
        <Label>Properties</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="pipeline">
        <Icon sf={{ default: "chart.line.uptrend.xyaxis", selected: "chart.line.uptrend.xyaxis.circle.fill" }} />
        <Label>Pipeline</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="scanner">
        <Icon sf={{ default: "bolt", selected: "bolt.fill" }} />
        <Label>Scanner</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="agent-chat">
        <Icon sf={{ default: "message", selected: "message.fill" }} />
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
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: "rgba(245,240,232,0.2)",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : "#0d0b08",
          borderTopWidth: 1,
          borderTopColor: "rgba(184,148,60,0.1)",
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0a0803" }]} />
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
          title: "Map",
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
          headerRight: () => <ProfileButton color={colors.gold} />,
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="map" tintColor={color} size={22} />
            ) : (
              <Feather name="map" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: "Properties",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="list.bullet" tintColor={color} size={22} />
            ) : (
              <Feather name="list" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: "Scanner",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="bolt" tintColor={color} size={22} />
            ) : (
              <Feather name="zap" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="pipeline"
        options={{
          title: "Pipeline",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="chart.line.uptrend.xyaxis" tintColor={color} size={22} />
            ) : (
              <Feather name="activity" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen name="mcp-tools" options={{ href: null }} />
      <Tabs.Screen
        name="agent-chat"
        options={{
          title: "AI",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="message" tintColor={color} size={22} />
            ) : (
              <Feather name="message-circle" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen name="profile" options={{ href: null }} />
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
        accentColor={TERRA_ACCENT}
        bottom={100}
        right={20}
      />
      <SpotlightModal
        visible={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        commands={terraCommands}
        appName="Terra"
        accentColor={TERRA_ACCENT}
        placeholder="Search properties, deals & pipeline..."
      />
    </View>
  );
}
