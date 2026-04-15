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

const ACCENT = "#c9a84c";

const portfolioCommands: SpotlightCommand[] = [
  { id: "nav-command", label: "Command", description: "Executive command overview", icon: "◆", group: "Navigate", action: () => router.push("/(shell)/portfolio/(tabs)") },
  { id: "nav-portfolio", label: "Portfolio", description: "Holdings & venture performance", icon: "💼", group: "Navigate", action: () => router.push("/(shell)/portfolio/(tabs)/portfolio") },
  { id: "nav-investors", label: "Investors", description: "Investor relations & reports", icon: "📈", group: "Navigate", action: () => router.push("/(shell)/portfolio/(tabs)/investor") },
  { id: "nav-ai", label: "Navigator AI", description: "Executive intelligence assistant", icon: "🤖", group: "Navigate", action: () => router.push("/(shell)/portfolio/(tabs)/agent-chat") },
];

function NativeTabLayout() {
  const { setActiveWorkspace } = useWorkspace();
  useEffect(() => { setActiveWorkspace("portfolio"); }, [setActiveWorkspace]);
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
      <NativeTabs.Trigger name="alloy" options={{ href: null }} />
      <NativeTabs.Trigger name="mcp-tools" options={{ href: null }} />
      <NativeTabs.Trigger name="profile" options={{ href: null }} />
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  const { setActiveWorkspace } = useWorkspace();
  useEffect(() => { setActiveWorkspace("portfolio"); }, [setActiveWorkspace]);

  const tabBarScreenOptions = useEcosystemTabBarScreenOptions({
    accentColor: ACCENT,
    inactiveColor: "rgba(201,168,76,0.25)",
    backgroundColor: colors.navy,
    borderColor: colors.border,
    blurIntensity: 90,
  });

  return (
    <Tabs screenOptions={tabBarScreenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Command",
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
          headerLeft: () => <WorkspaceTrigger accentColor={ACCENT} />,
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="gauge.medium" tintColor={color} size={22} /> : <Feather name="grid" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: "Portfolio",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="briefcase.fill" tintColor={color} size={22} /> : <Feather name="briefcase" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="investor"
        options={{
          title: "Investors",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="chart.line.uptrend.xyaxis" tintColor={color} size={22} /> : <Feather name="trending-up" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="agent-chat"
        options={{
          title: "AI",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="sparkles" tintColor={color} size={22} /> : <Feather name="cpu" size={20} color={color} />,
        }}
      />
      <Tabs.Screen name="agents" options={{ href: null }} />
      <Tabs.Screen name="trust" options={{ href: null }} />
      <Tabs.Screen name="alloy" options={{ href: null }} />
      <Tabs.Screen name="mcp-tools" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}

export default function PortfolioTabLayout() {
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      {isLiquidGlassAvailable() ? <NativeTabLayout /> : <ClassicTabLayout />}
      <SpotlightFab onPress={() => setSpotlightOpen(true)} accentColor={ACCENT} bottom={100} right={20} />
      <SpotlightModal
        visible={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        commands={portfolioCommands}
        appName="Portfolio"
        accentColor={ACCENT}
        placeholder="Search portfolio, investors & assets..."
      />
    </View>
  );
}
