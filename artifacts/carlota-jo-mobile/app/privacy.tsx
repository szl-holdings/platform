import React from "react";
import { ScrollView, Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const SECTIONS = [
  {
    title: "Data We Collect",
    body: "Carlota Jo collects authentication credentials, biometric authentication preferences (stored locally on-device), push notification tokens, session history, and document metadata. No biometric data is ever transmitted from your device.",
  },
  {
    title: "How We Use Your Data",
    body: "Authentication data confirms your identity as a Carlota Jo client. Push notifications deliver engagement updates and messages from your advisor. Session data and documents are stored securely in your client account to support your advisory engagement.",
  },
  {
    title: "Confidentiality",
    body: "All client information, session notes, and advisory communications are treated with the highest degree of confidentiality. Carlota Jo does not share client data with any third party without explicit written consent.",
  },
  {
    title: "Data Security",
    body: "All communications are encrypted with TLS 1.3. Authentication tokens are stored in the device secure enclave (iOS Keychain / Android Keystore). Biometric authentication is processed entirely on-device and never leaves your device.",
  },
  {
    title: "Data Retention",
    body: "Session tokens expire after 30 days of inactivity. Client engagement data is retained for the duration of the advisory relationship and for 3 years thereafter, as required for professional records. You may request deletion of non-essential data at any time.",
  },
  {
    title: "Your Rights",
    body: "You have the right to access your personal data, request corrections, or request deletion of non-essential records. Disable push notifications from device settings at any time. Contact rosa@carlotajo.com for privacy inquiries.",
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
        <Text style={styles.eyebrow}>CARLOTA JO CONSULTING</Text>
        <Text style={styles.intro}>
          This privacy policy describes how Carlota Jo Consulting collects, uses, and protects your information. Last updated: April 2026.
        </Text>
        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
        <Text style={styles.contact}>Privacy inquiries: rosa@carlotajo.com</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e0c09" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(201,168,76,0.15)",
  },
  backBtn: { padding: 4, marginRight: 12 },
  title: { fontSize: 17, fontWeight: "600", color: "#f5f0e8", fontFamily: "CormorantGaramond_400Regular" },
  scroll: { flex: 1 },
  content: { padding: 20 },
  eyebrow: { fontSize: 9, letterSpacing: 3, color: "#c9a84c", marginBottom: 12, fontFamily: "Inter_500Medium" },
  intro: { fontSize: 13, lineHeight: 20, color: "rgba(245,240,232,0.5)", marginBottom: 24, fontFamily: "Inter_300Light" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: "#f5f0e8", marginBottom: 6, fontFamily: "Inter_500Medium" },
  sectionBody: { fontSize: 13, lineHeight: 20, color: "rgba(245,240,232,0.5)", fontFamily: "Inter_300Light" },
  contact: { fontSize: 12, color: "#c9a84c", marginTop: 16, textAlign: "center", fontFamily: "Inter_400Regular" },
});
