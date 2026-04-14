import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import type { ComponentProps } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? "https://" + process.env.EXPO_PUBLIC_DOMAIN + "/api"
  : "/api";

const NYC_BOROUGHS = [
  { name: "Manhattan", units: 342, avgPrice: "$4.2M", change: "+3.1%", positive: true },
  { name: "Brooklyn", units: 218, avgPrice: "$1.8M", change: "+1.4%", positive: true },
  { name: "Queens", units: 196, avgPrice: "$1.1M", change: "-0.7%", positive: false },
  { name: "Bronx", units: 87, avgPrice: "$680K", change: "+5.2%", positive: true },
  { name: "Staten Island", units: 43, avgPrice: "$620K", change: "-1.2%", positive: false },
];

function MarketPulseCard() {
  const colors = useColors();

  const { data } = useQuery({
    queryKey: ["terra-nyc-dashboard"],
    queryFn: async () => {
      const res = await fetch(API_BASE + "/terra/live/nyc-dashboard");
      if (!res.ok) return null;
      return res.json();
    },
    retry: 1,
  });

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.goldSubtle }]}>NYC MARKET PULSE</Text>
        <View style={[styles.liveBadge, { backgroundColor: colors.emerald + "15", borderColor: colors.emerald + "30" }]}>
          <View style={[styles.liveDot, { backgroundColor: colors.emerald }]} />
          <Text style={[styles.liveText, { color: colors.emerald }]}>LIVE</Text>
        </View>
      </View>
      {NYC_BOROUGHS.map((b, i) => (
        <View key={b.name} style={[styles.boroughRow, { borderTopColor: i > 0 ? colors.border : "transparent", borderTopWidth: i > 0 ? 1 : 0 }]}>
          <Text style={[styles.boroughName, { color: colors.cream }]}>{b.name}</Text>
          <Text style={[styles.boroughUnits, { color: colors.mutedForeground }]}>{b.units} units</Text>
          <Text style={[styles.boroughPrice, { color: colors.gold }]}>{b.avgPrice}</Text>
          <Text style={[styles.boroughChange, { color: b.positive ? colors.emerald : colors.rose }]}>{b.change}</Text>
        </View>
      ))}
    </View>
  );
}

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];
function SettingRow({ icon, label, value, onPress }: { icon: FeatherIconName; label: string; value?: string; onPress?: () => void }) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <Feather name={icon} size={14} color={colors.mutedForeground} />
      <Text style={[styles.settingLabel, { color: colors.cream }]}>{label}</Text>
      {value && <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{value}</Text>}
      {onPress && <Feather name="chevron-right" size={14} color={colors.mutedForeground} />}
    </Pressable>
  );
}

export default function ProfileTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  const handleSignOut = () => {
    if (Platform.OS === "web") {
      signOut();
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  const displayName = user?.username ?? user?.email?.split("@")[0] ?? "Field Agent";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={["rgba(184,148,60,0.06)", "transparent"]}
        style={[styles.headerGradient, { height: topPad + 180 }]}
      />

      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.eyebrow, { color: colors.goldSubtle }]}>TERRA · PROFILE</Text>
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: colors.goldDim, borderColor: colors.goldBorder }]}>
            <Text style={[styles.avatarText, { color: colors.gold }]}>{initials}</Text>
          </View>
          <View>
            <Text style={[styles.displayName, { color: colors.cream }]}>{displayName}</Text>
            <Text style={[styles.role, { color: colors.mutedForeground }]}>Real Estate Analyst</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        {[
          { label: "PROPERTIES", value: "247", icon: "home" as FeatherIconName },
          { label: "LEADS", value: "18", icon: "users" as FeatherIconName },
          { label: "CAPTURES", value: "34", icon: "camera" as FeatherIconName },
        ].map(stat => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Feather name={stat.icon} size={16} color={colors.gold} />
            <Text style={[styles.statNum, { color: colors.cream }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <MarketPulseCard />
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>PREFERENCES</Text>
        <View style={[styles.settingsBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon="bell"
            label="Distress Alerts"
            value={notificationsEnabled ? "On" : "Off"}
            onPress={() => { Haptics.selectionAsync(); setNotificationsEnabled(n => !n); }}
          />
          <SettingRow icon="map-pin" label="Default Borough" value="Manhattan" onPress={() => Haptics.selectionAsync()} />
          <SettingRow icon="sliders" label="Min Opportunity Score" value="60+" onPress={() => Haptics.selectionAsync()} />
          <SettingRow icon="refresh-cw" label="Data Refresh Rate" value="5 min" onPress={() => Haptics.selectionAsync()} />
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>ACCOUNT</Text>
        <View style={[styles.settingsBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow icon="user" label="Account Type" value="Pro Analyst" />
          <SettingRow icon="shield" label="Data Access" value="NYC Full" />
          <SettingRow icon="help-circle" label="Support" onPress={() => Haptics.selectionAsync()} />
          <SettingRow icon="file-text" label="Terms & Privacy" onPress={() => Haptics.selectionAsync()} />
        </View>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <Pressable
          onPress={handleSignOut}
          style={[styles.signOutBtn, { backgroundColor: "rgba(192,80,58,0.08)", borderColor: "rgba(192,80,58,0.2)" }]}
        >
          <Feather name="log-out" size={14} color={colors.rose} />
          <Text style={[styles.signOutText, { color: colors.rose }]}>Sign Out</Text>
        </Pressable>
      </View>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>Terra Mobile v1.0.0 · NYC Market Intelligence</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  eyebrow: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 3, marginBottom: 12 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  displayName: { fontSize: 18, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  role: { fontSize: 12, fontFamily: "Inter_300Light" },
  statsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: "center", gap: 6 },
  statNum: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  statLabel: { fontSize: 7, fontFamily: "Inter_500Medium", letterSpacing: 1, textTransform: "uppercase" },
  sectionLabel: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 2, marginBottom: 8 },
  settingsBlock: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1 },
  settingLabel: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  settingValue: { fontSize: 11, fontFamily: "Inter_300Light", marginRight: 4 },
  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  signOutText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  version: { textAlign: "center", fontSize: 10, fontFamily: "Inter_300Light", paddingBottom: 12 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  cardTitle: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 2 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  liveDot: { width: 5, height: 5, borderRadius: 3 },
  liveText: { fontSize: 8, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  boroughRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  boroughName: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
  boroughUnits: { fontSize: 10, fontFamily: "Inter_300Light", marginRight: 10 },
  boroughPrice: { fontSize: 11, fontFamily: "Inter_500Medium", marginRight: 8 },
  boroughChange: { fontSize: 11, fontFamily: "Inter_500Medium", minWidth: 40, textAlign: "right" },
});
