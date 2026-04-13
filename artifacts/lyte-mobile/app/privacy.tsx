import React from "react";
import { ScrollView, Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LYTE_COLORS } from "@/constants/colors";

const SECTIONS = [
  {
    title: "Data We Collect",
    body: "Lyte collects authentication credentials, biometric authentication preferences (stored locally on-device), push notification tokens, and operational signal metadata. Incident data and runbook actions are synced to your organization's Lyte backend. No biometric data leaves your device.",
  },
  {
    title: "How We Use Your Data",
    body: "Authentication data verifies on-call operator identity. Push notification tokens deliver critical incident alerts. Signal and action data is used to power the operations dashboard and audit trail within your organization.",
  },
  {
    title: "Operational Data",
    body: "Business signals, infrastructure alerts, and runbook actions are processed server-side. The Lyte app displays this data in real-time. Incident acknowledgments and resolutions are logged for audit purposes in your organization's environment.",
  },
  {
    title: "Data Security",
    body: "All communications are encrypted with TLS 1.3. Authentication tokens are stored in the device secure enclave. Biometric authentication uses the native OS biometric subsystem and no biometric data is transmitted or stored remotely.",
  },
  {
    title: "Data Retention",
    body: "Session tokens expire after 30 days of inactivity. Cached signal data is cleared on sign-out. Account and operational data retention is governed by your organization's Lyte deployment policy.",
  },
  {
    title: "Your Rights",
    body: "You may access or request deletion of your personal data. Disable push notifications from device settings at any time. Contact privacy@lyte.ai for data requests.",
  },
];

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={20} color={LYTE_COLORS.electricBlue} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>LYTE AIOPS COMMAND</Text>
        <Text style={styles.intro}>
          This privacy policy describes how Lyte collects, uses, and protects your information. Last updated: April 2026.
        </Text>
        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
        <Text style={styles.contact}>Contact: privacy@lyte.ai</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LYTE_COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: LYTE_COLORS.border,
  },
  backBtn: { padding: 4, marginRight: 12 },
  title: { fontSize: 17, fontWeight: "600", color: LYTE_COLORS.textPrimary },
  scroll: { flex: 1 },
  content: { padding: 20 },
  eyebrow: { fontSize: 9, letterSpacing: 3, color: LYTE_COLORS.electricBlue, marginBottom: 12, fontWeight: "500" },
  intro: { fontSize: 13, lineHeight: 20, color: LYTE_COLORS.textSecondary, marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: LYTE_COLORS.textPrimary, marginBottom: 6 },
  sectionBody: { fontSize: 13, lineHeight: 20, color: LYTE_COLORS.textSecondary },
  contact: { fontSize: 12, color: LYTE_COLORS.electricBlue, marginTop: 16, textAlign: "center" },
});
