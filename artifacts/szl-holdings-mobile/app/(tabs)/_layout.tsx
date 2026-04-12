import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const colors = useColors();

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/auth" />;
  }

  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: "rgba(240,238,255,0.2)",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : "#090810",
          borderTopWidth: 1,
          borderTopColor: "rgba(201,168,76,0.1)",
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: "#090810" }]}
            />
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
          title: "Command",
          tabBarIcon: ({ color }) => (
            <Feather name="activity" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: "Portfolio",
          tabBarIcon: ({ color }) => (
            <Feather name="briefcase" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alloy"
        options={{
          title: "Alloy",
          tabBarIcon: ({ color }) => (
            <Feather name="zap" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="investor"
        options={{
          title: "Investor",
          tabBarIcon: ({ color }) => (
            <Feather name="trending-up" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trust"
        options={{
          title: "Trust",
          tabBarIcon: ({ color }) => (
            <Feather name="shield" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pulse"
        options={{
          title: "Pulse",
          tabBarIcon: ({ color }) => (
            <Feather name="heart" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mcp-tools"
        options={{
          title: "AI Command",
          tabBarIcon: ({ color }) => (
            <Feather name="cpu" size={20} color={color} />
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
