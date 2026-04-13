import React from "react";
import { ScrollView, Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const SECTIONS = [
  {
    title: "Data We Collect",
    body: "Aegis collects authentication credentials, biometric authentication preferences (stored locally on-device only), push notification tokens, and operational logs generated during SOC sessions. No biometric data is ever transmitted off-device.",
  },
  {
    title: "How We Use Your Data",
    body: "Authentication data is used solely to verify operator identity. Push notification tokens are used to deliver critical security alerts. Operational logs are used for audit trails and incident correlation within your organization's SOC environment.",
  },
  {
    title: "Data Security",
    body: "All data in transit is encrypted using TLS 1.3. Authentication tokens are stored in the device secure enclave (iOS Keychain / Android Keystore). Biometric authentication is processed entirely on-device using the native OS biometric subsystem.",
  },
  {
    title: "Data Retention",
    body: "Session tokens expire after 30 days of inactivity. Audit logs are retained for 90 days. You may request deletion of your account data at any time by contacting your SOC administrator.",
  },
  {
    title: "Third-Party Services",
    body: "Aegis uses Expo (Expo Inc.) for push notification delivery infrastructure. No personal data is shared with third-party analytics providers. All intelligence feeds (threat intel, geopolitical data) are processed server-side and no raw feed data is stored on your device.",
  },
  {
    title: "Your Rights",
    body: "You have the right to access, correct, or delete your personal data. You may disable push notifications at any time from device settings. For data requests, contact security@aegis.ai.",
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
          <Ionicons name="arrow-back" size={20} color="#6366f1" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>AEGIS SOC PLATFORM</Text>
        <Text style={styles.intro}>
          This privacy policy describes how Aegis collects, uses, and protects information when you use the Aegis mobile application. Last updated: April 2026.
        </Text>
        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
        <Text style={styles.contact}>
          Questions? Contact us at privacy@aegis.ai
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080B12" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(99,102,241,0.15)",
  },
  backBtn: { padding: 4, marginRight: 12 },
  title: { fontSize: 17, fontWeight: "600", color: "#e2e8f0" },
  scroll: { flex: 1 },
  content: { padding: 20 },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 3,
    color: "#6366f1",
    marginBottom: 12,
    fontWeight: "500",
  },
  intro: {
    fontSize: 13,
    lineHeight: 20,
    color: "#94a3b8",
    marginBottom: 24,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#e2e8f0",
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 13,
    lineHeight: 20,
    color: "#94a3b8",
  },
  contact: {
    fontSize: 12,
    color: "#6366f1",
    marginTop: 16,
    textAlign: "center",
  },
});
