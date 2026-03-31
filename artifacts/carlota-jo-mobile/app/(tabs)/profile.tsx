import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const SESSION_HISTORY = [
  { id: 1, title: "Discovery Call", date: "Feb 15, 2026", duration: "45 min" },
  { id: 2, title: "Needs Assessment — Mayfair walkthrough", date: "Feb 22, 2026", duration: "2 hr" },
  { id: 3, title: "Service Plan presentation", date: "Mar 8, 2026", duration: "1 hr" },
  { id: 4, title: "Onboarding kickoff", date: "Mar 10, 2026", duration: "1.5 hr" },
];

interface SettingRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
  destructive?: boolean;
}

function SettingRow({
  icon,
  label,
  value,
  onPress,
  toggle,
  toggleValue,
  onToggle,
  destructive,
}: SettingRowProps) {
  const colors = useColors();

  return (
    <Pressable onPress={onPress} disabled={toggle}>
      {({ pressed }) => (
        <View
          style={[
            styles.settingRow,
            {
              borderBottomColor: colors.creamFaint,
              opacity: pressed && !toggle ? 0.7 : 1,
            },
          ]}
        >
          <Feather
            name={icon as any}
            size={15}
            color={destructive ? "#c05050" : colors.goldSubtle}
          />
          <Text
            style={[
              styles.settingLabel,
              { color: destructive ? "#c05050" : colors.creamDim },
            ]}
          >
            {label}
          </Text>
          <View style={styles.settingRight}>
            {value ? (
              <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>
                {value}
              </Text>
            ) : null}
            {toggle && onToggle ? (
              <Switch
                value={toggleValue}
                onValueChange={(v) => {
                  Haptics.selectionAsync();
                  onToggle(v);
                }}
                trackColor={{
                  false: "rgba(245,240,232,0.1)",
                  true: "rgba(200,169,106,0.5)",
                }}
                thumbColor={toggleValue ? colors.gold : colors.creamDim}
                ios_backgroundColor="rgba(245,240,232,0.1)"
              />
            ) : !toggle && onPress ? (
              <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
            ) : null}
          </View>
        </View>
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const displayName = user?.displayName ?? "Client";
  const email = user?.email ?? "";
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const [notifUpdates, setNotifUpdates] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifDocuments, setNotifDocuments] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of the Carlota Jo portal?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await logout();
            router.replace("/auth");
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(200,169,106,0.05)", "transparent"]}
        style={[styles.headerGradient, { height: topPad + 80 }]}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 16, paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.eyebrow, { color: colors.goldSubtle }]}>
          CLIENT PROFILE
        </Text>

        <View style={styles.profileCard}>
          <View style={[styles.monogram, { borderColor: colors.goldBorder }]}>
            <Text style={[styles.monogramText, { color: colors.gold }]}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.cream }]}>
              {displayName}
            </Text>
            {!!email && (
              <Text style={[styles.profileEmail, { color: colors.goldSubtle }]}>
                {email}
              </Text>
            )}
            <View style={[styles.statusBadge, { borderColor: colors.goldBorder, backgroundColor: colors.goldDim }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.gold }]} />
              <Text style={[styles.statusText, { color: colors.gold }]}>
                Active Engagement
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.infoGrid, { borderColor: colors.creamFaint }]}>
          {[
            { label: "Engagement Type", value: "Residential Management" },
            { label: "Start Date", value: "March 10, 2026" },
            { label: "Phase", value: "Onboarding" },
            { label: "Lead Advisor", value: "Rosa Carlota" },
          ].map((item, i, arr) => (
            <View
              key={item.label}
              style={[
                styles.infoRow,
                { borderBottomColor: i < arr.length - 1 ? colors.creamFaint : "transparent" },
              ]}
            >
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                {item.label}
              </Text>
              <Text style={[styles.infoValue, { color: colors.creamDim }]}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { borderTopColor: colors.creamFaint }]}>
          <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>
            SESSION HISTORY
          </Text>
          {SESSION_HISTORY.map((session) => (
            <Pressable key={session.id}>
              <View style={[styles.historyRow, { borderBottomColor: colors.creamFaint }]}>
                <View>
                  <Text style={[styles.historyTitle, { color: colors.creamDim }]}>
                    {session.title}
                  </Text>
                  <Text style={[styles.historyMeta, { color: colors.mutedForeground }]}>
                    {session.date} · {session.duration}
                  </Text>
                </View>
                <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
              </View>
            </Pressable>
          ))}
        </View>

        <View style={[styles.section, { borderTopColor: colors.creamFaint }]}>
          <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>
            NOTIFICATIONS
          </Text>
          <View style={[styles.settingsGroup, { borderColor: colors.creamFaint }]}>
            <SettingRow
              icon="bell"
              label="Engagement updates"
              toggle
              toggleValue={notifUpdates}
              onToggle={setNotifUpdates}
            />
            <SettingRow
              icon="message-circle"
              label="New messages from Rosa"
              toggle
              toggleValue={notifMessages}
              onToggle={setNotifMessages}
            />
            <SettingRow
              icon="file-text"
              label="Document activity"
              toggle
              toggleValue={notifDocuments}
              onToggle={setNotifDocuments}
            />
          </View>
        </View>

        <View style={[styles.section, { borderTopColor: colors.creamFaint }]}>
          <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>
            ACCOUNT
          </Text>
          <View style={[styles.settingsGroup, { borderColor: colors.creamFaint }]}>
            <SettingRow
              icon="lock"
              label="Privacy & Security"
              onPress={() => {}}
            />
            <SettingRow
              icon="mail"
              label="Contact Rosa"
              value="rosa@carlotajo.com"
              onPress={() => {}}
            />
            <SettingRow
              icon="info"
              label="App Version"
              value="1.0.0"
            />
          </View>
        </View>

        <Pressable onPress={handleLogout}>
          <View style={[styles.logoutRow, { borderColor: "rgba(192,80,80,0.2)" }]}>
            <Feather name="log-out" size={14} color="#c05050" />
            <Text style={[styles.logoutText, { color: "#c05050" }]}>Sign Out</Text>
          </View>
        </Pressable>

        <Text style={[styles.footNote, { color: "rgba(245,240,232,0.08)" }]}>
          Carlota Jo · Private Client Portal · 1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0 },
  content: { paddingHorizontal: 20 },
  eyebrow: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 3,
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  monogram: {
    width: 56,
    height: 56,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  monogramText: {
    fontSize: 18,
    fontFamily: "CormorantGaramond_500Medium",
    letterSpacing: 3,
  },
  profileInfo: { flex: 1, gap: 4 },
  profileName: {
    fontSize: 20,
    fontFamily: "CormorantGaramond_400Regular",
  },
  profileEmail: {
    fontSize: 11,
    fontFamily: "Inter_300Light",
    letterSpacing: 0.3,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
  },
  infoGrid: {
    borderWidth: 1,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    gap: 16,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: "Inter_300Light",
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    flex: 1,
  },
  section: {
    borderTopWidth: 1,
    paddingTop: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 3,
    marginBottom: 14,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  historyTitle: {
    fontSize: 13,
    fontFamily: "Inter_300Light",
    marginBottom: 3,
  },
  historyMeta: {
    fontSize: 10,
    fontFamily: "Inter_300Light",
  },
  settingsGroup: {
    borderWidth: 1,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_300Light",
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingValue: {
    fontSize: 11,
    fontFamily: "Inter_300Light",
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    paddingVertical: 14,
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1,
  },
  footNote: {
    fontSize: 9,
    fontFamily: "Inter_300Light",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 8,
  },
});
