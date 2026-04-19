import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { getApiBaseUrl } from "@szl-holdings/api-client-react";
import { trackEvent } from "@/lib/analytics";
import { useAuth } from "@/context/AuthContext";

const ACCENT = "#c9a84c";

interface SettingItem {
  title: string;
  description: string;
  route: string;
  icon: keyof typeof Feather.glyphMap;
  accent: string;
  tag?: string;
}

const SETTINGS: SettingItem[] = [
  {
    title: "Notifications",
    description: "Inbox, read history, and notification channel preferences",
    route: "/(shell)/notifications",
    icon: "bell",
    accent: "#c9a84c",
    tag: "NEW",
  },
  {
    title: "Usage Dashboard",
    description: "Active users, API calls, storage, and feature adoption",
    route: "/(shell)/usage",
    icon: "bar-chart-2",
    accent: "#6366f1",
    tag: "NEW",
  },
  {
    title: "Home Screen Widgets",
    description: "Configure KPI widgets for iOS & Android home screen",
    route: "/(shell)/settings/widgets",
    icon: "grid",
    accent: "#6366f1",
  },
  {
    title: "Daily Executive Digest",
    description: "Morning briefing push notification with delivery time",
    route: "/(shell)/settings/digest",
    icon: "sun",
    accent: ACCENT,
  },
  {
    title: "Time Zone",
    description: "Choose how timestamps are displayed across the app",
    route: "/(shell)/settings/timezone",
    icon: "globe",
    accent: "#22d3ee",
  },
  {
    title: "Security & Privacy",
    description: "Biometric layers, screenshot prevention, enterprise policy",
    route: "/(shell)/settings/security",
    icon: "shield",
    accent: "#ef4444",
  },
];

export default function SettingsIndexScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [billingLoading, setBillingLoading] = useState(false);

  async function handleUpgrade() {
    setBillingLoading(true);
    trackEvent("upgrade_clicked", { product: "szl-holdings-mobile", source: "settings" });
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: process.env.EXPO_PUBLIC_STRIPE_PRICE_MOBILE ?? "price_szl_mobile_pro",
          mode: "subscription",
          successUrl: `${apiBase}/mobile?checkout=success`,
          cancelUrl: `${apiBase}/mobile`,
          customerEmail: user?.email ?? undefined,
        }),
      });
      const data = await res.json();
      const url = data?.data?.url ?? data?.url;
      if (url) await Linking.openURL(url);
    } catch {
      // Silently fail — user remains on settings
    } finally {
      setBillingLoading(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>COMMAND SURFACE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {SETTINGS.map((item, index) => (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.settingRow,
                index < SETTINGS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
              onPress={() => router.push(item.route as never)}
              activeOpacity={0.8}
            >
              <View style={[styles.itemIcon, { backgroundColor: `${item.accent}15` }]}>
                <Feather name={item.icon} size={16} color={item.accent} />
              </View>
              <View style={styles.itemText}>
                <View style={styles.itemTitleRow}>
                  <Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.title}</Text>
                  {item.tag && (
                    <View style={[styles.tag, { backgroundColor: `${ACCENT}15`, borderColor: `${ACCENT}30` }]}>
                      <Text style={[styles.tagText, { color: ACCENT }]}>{item.tag}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.itemDesc, { color: colors.mutedForeground }]}>{item.description}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 4 }]}>SUBSCRIPTION & BILLING</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={[styles.itemIcon, { backgroundColor: `${ACCENT}15` }]}>
              <Feather name="credit-card" size={16} color={ACCENT} />
            </View>
            <View style={styles.itemText}>
              <Text style={[styles.itemTitle, { color: colors.foreground }]}>SZL Holdings Pro</Text>
              <Text style={[styles.itemDesc, { color: colors.mutedForeground }]}>
                Upgrade for unlimited briefings, mobile command, and advanced analytics
              </Text>
            </View>
          </View>
          <View style={{ paddingHorizontal: 14, paddingBottom: 14, flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={handleUpgrade}
              disabled={billingLoading}
              style={[styles.billingBtn, { backgroundColor: `${ACCENT}15`, borderColor: `${ACCENT}35`, opacity: billingLoading ? 0.6 : 1 }]}
              activeOpacity={0.8}
            >
              {billingLoading
                ? <ActivityIndicator size="small" color={ACCENT} />
                : <Feather name="zap" size={13} color={ACCENT} />}
              <Text style={[styles.billingBtnText, { color: ACCENT }]}>
                {billingLoading ? "Redirecting…" : "Upgrade Plan"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_600SemiBold", letterSpacing: -0.3 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    marginTop: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: { flex: 1, gap: 2 },
  itemTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  itemTitle: { fontSize: 14, fontFamily: "Inter_500Medium" },
  itemDesc: { fontSize: 11, fontFamily: "Inter_400Regular" },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  tagText: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  billingBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  billingBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
