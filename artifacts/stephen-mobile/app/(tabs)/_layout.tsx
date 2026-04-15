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
import { useEcosystemTabBarScreenOptions } from "@szl-holdings/mobile-shared";

const ACCENT = "#6366f1";
const BG_DARK = "#0a0a0a";
const BORDER = "rgba(255,255,255,0.06)";

const stephenCommands: SpotlightCommand[] = [
  { id: "nav-home", label: "Home", description: "Personal command overview", icon: "🏠", group: "Navigate", action: () => router.push("/(tabs)/home") },
  { id: "nav-ventures", label: "Ventures", description: "Portfolio companies & investments", icon: "💼", group: "Navigate", action: () => router.push("/(tabs)/ventures") },
  { id: "nav-articles", label: "Articles", description: "Written content & publications", icon: "📖", group: "Navigate", action: () => router.push("/(tabs)/articles") },
  { id: "nav-tools", label: "Tools", description: "Productivity & utility tools", icon: "🛠", group: "Navigate", action: () => router.push("/(tabs)/tools") },
  { id: "nav-profile", label: "Profile", description: "Account & settings", icon: "👤", group: "Navigate", action: () => router.push("/(tabs)/profile") },
  { id: "action-ventures", label: "Browse Ventures", description: "View all portfolio companies", icon: "🚀", group: "Quick Actions", isQuickAction: true, keywords: ["portfolio", "startup", "invest", "company"], action: () => router.push("/(tabs)/ventures") },
  { id: "action-articles", label: "Read Latest Article", description: "Jump to newest publication", icon: "✍️", group: "Quick Actions", isQuickAction: true, keywords: ["read", "write", "blog", "post"], action: () => router.push("/(tabs)/articles") },
  { id: "action-tools", label: "Open Tools", description: "Access productivity utilities", icon: "⚙️", group: "Quick Actions", isQuickAction: true, keywords: ["utility", "productivity", "calculator"], action: () => router.push("/(tabs)/tools") },
  { id: "cross-szl", label: "Open SZL Holdings", description: "Executive Command", icon: "◆", group: "Ecosystem", keywords: ["app", "switch"], action: () => Linking.openURL("szl-holdings://") },
  { id: "cross-lyte", label: "Open Lyte", description: "Business Observability Command", icon: "⚡", group: "Ecosystem", keywords: ["app", "switch"], action: () => Linking.openURL("lyte://") },
];

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="home">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ventures">
        <Icon sf={{ default: "briefcase", selected: "briefcase.fill" }} />
        <Label>Ventures</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="articles">
        <Icon sf={{ default: "doc.text", selected: "doc.text.fill" }} />
        <Label>Articles</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tools">
        <Icon sf={{ default: "terminal", selected: "terminal.fill" }} />
        <Label>Tools</Label>
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
  const tabBarScreenOptions = useEcosystemTabBarScreenOptions({
    accentColor: ACCENT,
    inactiveColor: "rgba(255,255,255,0.25)",
    backgroundColor: BG_DARK,
    borderColor: BORDER,
  });

  return (
    <Tabs screenOptions={tabBarScreenOptions}>
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="home" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="ventures"
        options={{
          title: "Ventures",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="briefcase" tintColor={color} size={22} />
            ) : (
              <Feather name="briefcase" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="articles"
        options={{
          title: "Articles",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="doc.text" tintColor={color} size={22} />
            ) : (
              <Feather name="book-open" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: "Tools",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="terminal" tintColor={color} size={22} />
            ) : (
              <Feather name="cpu" size={20} color={color} />
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
        accentColor={ACCENT}
        bottom={100}
        right={20}
      />
      <SpotlightModal
        visible={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        commands={stephenCommands}
        appName="Stephen"
        accentColor={ACCENT}
        placeholder="Search ventures, articles & tools..."
      />
    </View>
  );
}
