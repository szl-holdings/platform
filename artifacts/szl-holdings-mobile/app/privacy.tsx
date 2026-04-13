import React from "react";
import { ScrollView, Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const SECTIONS = [
  {
    title: "Data We Collect",
    body: "SZL Holdings collects authentication credentials, biometric authentication preferences (stored locally on-device), and push notification tokens. Portfolio performance data, fund metrics, and deal flow information are fetched securely from the SZL Holdings backend. No biometric data is transmitted from your device.",
  },
  {
    title: "How We Use Your Data",
    body: "Authentication data verifies principal identity with the highest security standards. Push notifications deliver market signals and portfolio alerts. Portfolio and fund data is displayed in real-time and is never stored permanently on your device.",
  },
  {
    title: "Financial Data Confidentiality",
    body: "All portfolio performance data, fund details, and deal flow information are strictly confidential. This data is encrypted in transit and at rest. SZL Holdings does not share principal data with any third party without explicit authorization.",
  },
  {
    title: "Data Security",
    body: "All communications are encrypted with TLS 1.3. Authentication tokens are stored in the device secure enclave (iOS Keychain / Android Keystore). Biometric authentication uses the native OS biometric framework and no biometric template data leaves your device.",
  },
  {
    title: "Data Retention",
    body: "Session tokens expire after 30 days of inactivity. Cached financial data is cleared on sign-out. Account data is retained as required by applicable financial regulations.",
  },
  {
    title: "Your Rights",
    body: "You may request access to or deletion of your personal data. Disable push notifications from device settings at any time. Contact privacy@szlholdings.com for data inquiries.",
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
          <Feather name="arrow-left" size={20} color="#c9a84c" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>SZL HOLDINGS</Text>
        <Text style={styles.intro}>
          This privacy policy describes how SZL Holdings collects, uses, and protects your information. Last updated: April 2026.
        </Text>
        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
        <Text style={styles.contact}>Contact: privacy@szlholdings.com</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090810" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(201,168,76,0.15)",
  },
  backBtn: { padding: 4, marginRight: 12 },
  title: { fontSize: 17, fontWeight: "600", color: "#e8e0d0" },
  scroll: { flex: 1 },
  content: { padding: 20 },
  eyebrow: { fontSize: 9, letterSpacing: 3, color: "#c9a84c", marginBottom: 12, fontWeight: "500" },
  intro: { fontSize: 13, lineHeight: 20, color: "rgba(232,224,208,0.5)", marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: "#e8e0d0", marginBottom: 6 },
  sectionBody: { fontSize: 13, lineHeight: 20, color: "rgba(232,224,208,0.5)" },
  contact: { fontSize: 12, color: "#c9a84c", marginTop: 16, textAlign: "center" },
});
