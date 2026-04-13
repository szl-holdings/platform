import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Platform, Switch, Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useBiometric } from "@/context/BiometricContext";
import type { FeatherIconName } from "@/types/feather-icons";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { isEnabled, isAvailable, enableBiometric, disableBiometric } = useBiometric();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  const handleBiometricToggle = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (value) {
      const success = await enableBiometric();
      if (!success) {
        Alert.alert("Biometric Unavailable", "Could not enable biometric authentication.");
      }
    } else {
      Alert.alert(
        "Disable Biometric Lock",
        "Are you sure you want to disable biometric authentication?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Disable", style: "destructive", onPress: disableBiometric },
        ]
      );
    }
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  const initials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "A";

  const STATS: Array<{ label: string; value: string; icon: FeatherIconName }> = [
    { label: "Conversations", value: "24", icon: "message-circle" },
    { label: "Workflows", value: "8", icon: "git-merge" },
    { label: "Approvals", value: "12", icon: "check-circle" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(139,92,246,0.07)", "transparent"]}
        style={[styles.headerGradient, { height: topPad + 180 }]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPad + 16, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.eyebrow, { color: "rgba(139,92,246,0.6)" }]}>ALLOY</Text>

        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: "rgba(139,92,246,0.2)", borderColor: "rgba(139,92,246,0.4)" }]}>
            <Text style={[styles.avatarText, { color: colors.violet }]}>{initials}</Text>
          </View>
          <Text style={[styles.displayName, { color: colors.cream }]}>{user?.displayName ?? "Alloy User"}</Text>
          {user?.email && <Text style={[styles.email, { color: colors.mutedForeground }]}>{user.email}</Text>}
          {(user?.roles?.length ?? 0) > 0 && user?.roles?.[0] && (
            <View style={[styles.roleBadge, { backgroundColor: "rgba(139,92,246,0.12)", borderColor: "rgba(139,92,246,0.25)" }]}>
              <Text style={[styles.roleText, { color: colors.violet }]}>{user.roles[0]}</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          {STATS.map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.borderSubtle }]}>
              <Feather name={s.icon} size={16} color={colors.violet} style={{ marginBottom: 6 }} />
              <Text style={[styles.statValue, { color: colors.cream }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SECURITY</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.borderSubtle }]}>
          {isAvailable && (
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Feather name="shield" size={16} color={colors.violet} />
                <View>
                  <Text style={[styles.settingTitle, { color: colors.cream }]}>Biometric Lock</Text>
                  <Text style={[styles.settingSubtitle, { color: colors.mutedForeground }]}>Face ID / Fingerprint</Text>
                </View>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: colors.borderSubtle, true: "rgba(139,92,246,0.5)" }}
                thumbColor={isEnabled ? colors.violet : colors.mutedForeground}
              />
            </View>
          )}
          <View style={[styles.settingRow, { borderTopWidth: isAvailable ? 1 : 0, borderTopColor: colors.borderSubtle }]}>
            <View style={styles.settingLeft}>
              <Feather name="lock" size={16} color={colors.mutedForeground} />
              <View>
                <Text style={[styles.settingTitle, { color: colors.cream }]}>Two-Factor Auth</Text>
                <Text style={[styles.settingSubtitle, { color: colors.mutedForeground }]}>Managed on web platform</Text>
              </View>
            </View>
            <Feather name="external-link" size={14} color={colors.mutedForeground} />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PREFERENCES</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.borderSubtle }]}>
          {(([
            { icon: "bell" as FeatherIconName, title: "Push Notifications", subtitle: "Agent alerts and approvals", hasArrow: true },
            { icon: "moon" as FeatherIconName, title: "Theme", subtitle: "Dark mode", hasArrow: true },
            { icon: "globe" as FeatherIconName, title: "Language", subtitle: "English", hasArrow: true },
          ] as Array<{ icon: FeatherIconName; title: string; subtitle: string; hasArrow: boolean }>)).map((item, i) => (
            <Pressable
              key={item.title}
              style={[styles.settingRow, i > 0 ? { borderTopWidth: 1, borderTopColor: colors.borderSubtle } : {}]}
              onPress={() => Haptics.selectionAsync()}
            >
              <View style={styles.settingLeft}>
                <Feather name={item.icon} size={16} color={colors.mutedForeground} />
                <View>
                  <Text style={[styles.settingTitle, { color: colors.cream }]}>{item.title}</Text>
                  <Text style={[styles.settingSubtitle, { color: colors.mutedForeground }]}>{item.subtitle}</Text>
                </View>
              </View>
              {item.hasArrow && <Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ABOUT</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.borderSubtle }]}>
          {(([
            { icon: "info" as FeatherIconName, title: "Version", subtitle: "1.0.0" },
            { icon: "file-text" as FeatherIconName, title: "Privacy Policy", hasArrow: true },
            { icon: "file-text" as FeatherIconName, title: "Terms of Service", hasArrow: true },
          ] as Array<{ icon: FeatherIconName; title: string; subtitle?: string; hasArrow?: boolean }>)).map((item, i) => (
            <Pressable
              key={item.title}
              style={[styles.settingRow, i > 0 ? { borderTopWidth: 1, borderTopColor: colors.borderSubtle } : {}]}
              onPress={() => Haptics.selectionAsync()}
            >
              <View style={styles.settingLeft}>
                <Feather name={item.icon} size={16} color={colors.mutedForeground} />
                <Text style={[styles.settingTitle, { color: colors.cream }]}>{item.title}</Text>
              </View>
              {item.subtitle && <Text style={[styles.settingSubtitle, { color: colors.mutedForeground }]}>{item.subtitle}</Text>}
              {item.hasArrow && <Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.logoutBtn, { borderColor: "rgba(239,68,68,0.3)" }]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={16} color="#ef4444" />
          <Text style={[styles.logoutText, { color: "#ef4444" }]}>Sign Out</Text>
        </Pressable>

        <View style={[styles.footer, { borderTopColor: colors.borderSubtle }]}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>ALLOY · Intelligence Platform</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  eyebrow: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 3, marginBottom: 20 },
  profileCard: { alignItems: "center", marginBottom: 24, gap: 8 },
  avatar: { width: 72, height: 72, borderRadius: 20, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 24, fontFamily: "SpaceGrotesk_700Bold" },
  displayName: { fontSize: 20, fontFamily: "SpaceGrotesk_600SemiBold" },
  email: { fontSize: 13 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  roleText: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 24 },
  statCard: { flex: 1, alignItems: "center", padding: 14, borderRadius: 10, borderWidth: 1 },
  statValue: { fontSize: 18, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  statLabel: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 0.5, textAlign: "center" },
  sectionLabel: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 2, marginBottom: 8, marginTop: 4 },
  settingsCard: { borderRadius: 10, borderWidth: 1, marginBottom: 20, overflow: "hidden" },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  settingTitle: { fontSize: 14, fontFamily: "Inter_500Medium" },
  settingSubtitle: { fontSize: 11, marginTop: 1 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 10, borderWidth: 1, marginBottom: 24 },
  logoutText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  footer: { alignItems: "center", paddingTop: 16, borderTopWidth: 1 },
  footerText: { fontSize: 10, fontFamily: "Inter_500Medium", letterSpacing: 2 },
});
