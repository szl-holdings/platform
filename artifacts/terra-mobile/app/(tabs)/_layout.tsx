import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
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
      <Tabs.Screen name="index" options={{ title: "Map", tabBarIcon: ({ color }) => <Feather name="map" size={20} color={color} /> }} />
      <Tabs.Screen name="properties" options={{ title: "Properties", tabBarIcon: ({ color }) => <Feather name="list" size={20} color={color} /> }} />
      <Tabs.Screen name="scanner" options={{ title: "Scanner", tabBarIcon: ({ color }) => <Feather name="zap" size={20} color={color} /> }} />
      <Tabs.Screen name="pipeline" options={{ title: "Pipeline", tabBarIcon: ({ color }) => <Feather name="activity" size={20} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <Feather name="user" size={20} color={color} /> }} />
    </Tabs>
  );
}
