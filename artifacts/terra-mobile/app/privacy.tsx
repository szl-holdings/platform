import React from "react";
import { ScrollView, Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const SECTIONS = [
  {
    title: "Data We Collect",
    body: "Terra collects authentication credentials, biometric authentication preferences (stored locally on-device), push notification tokens, property watchlist data, and pipeline configurations. Location data is used only when granted to surface nearby properties and auto-tag photos.",
  },
  {
    title: "How We Use Your Data",
    body: "Authentication data verifies analyst identity. Push notifications deliver distress property alerts and watchlist changes. Location data surfaces nearby properties. Watchlist and pipeline data is stored in your account and synced securely.",
  },
  {
    title: "Real Estate Data",
    body: "Property data, market trends, and NYC borough metrics are sourced from public real estate databases and the Terra backend intelligence platform. No personal property data is shared with third parties without your explicit consent.",
  },
  {
    title: "Data Security",
    body: "All communications are encrypted with TLS 1.3. Authentication tokens are stored in the device secure enclave. Biometric authentication is processed entirely on-device by the native OS biometric subsystem.",
  },
  {
    title: "Data Retention",
    body: "Session tokens expire after 30 days of inactivity. Cached property data is refreshed automatically. Account data is retained until you request deletion.",
  },
  {
    title: "Your Rights",
    body: "You may access, correct, or delete your personal data at any time. Disable push notifications from device settings. Contact privacy@terra.ai for data requests.",
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
          <Feather name="arrow-left" size={20} color="#b8943c" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>TERRA REAL ESTATE INTELLIGENCE</Text>
        <Text style={styles.intro}>
          This privacy policy describes how Terra collects, uses, and protects your information. Last updated: April 2026.
        </Text>
        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
        <Text style={styles.contact}>Contact: privacy@terra.ai</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0b08" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(184,148,60,0.15)",
  },
  backBtn: { padding: 4, marginRight: 12 },
  title: { fontSize: 17, fontWeight: "600", color: "#f5f0e8" },
  scroll: { flex: 1 },
  content: { padding: 20 },
  eyebrow: { fontSize: 9, letterSpacing: 3, color: "#b8943c", marginBottom: 12, fontWeight: "500" },
  intro: { fontSize: 13, lineHeight: 20, color: "#8a7a5a", marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: "#f5f0e8", marginBottom: 6 },
  sectionBody: { fontSize: 13, lineHeight: 20, color: "#8a7a5a" },
  contact: { fontSize: 12, color: "#b8943c", marginTop: 16, textAlign: "center" },
});
