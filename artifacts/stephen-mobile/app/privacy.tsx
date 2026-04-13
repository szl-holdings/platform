import React from "react";
import { ScrollView, Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const SECTIONS = [
  {
    title: "Data We Collect",
    body: "The Stephen Lutar app collects minimal data: push notification tokens (if you opt in for updates) and locally stored preferences. No personal information is collected beyond what you voluntarily provide through contact forms.",
  },
  {
    title: "How We Use Your Data",
    body: "Push notification tokens are used only to deliver updates about new content and ventures. Contact information submitted through the app is used only to respond to your inquiry. No data is sold or shared.",
  },
  {
    title: "Analytics",
    body: "This app does not use any third-party analytics or tracking SDKs. Usage is not monitored or reported to external services.",
  },
  {
    title: "Data Security",
    body: "All communications are encrypted with TLS 1.3. Locally stored preferences are stored using the platform's standard storage mechanisms.",
  },
  {
    title: "Data Retention",
    body: "Notification preferences are retained until you uninstall the app. Contact form submissions are retained for correspondence purposes only.",
  },
  {
    title: "Your Rights",
    body: "You may opt out of notifications at any time from device settings. Contact stephen@stephenlutar.com for any privacy-related requests.",
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
          <Feather name="arrow-left" size={20} color="#e8e8e8" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>STEPHEN LUTAR</Text>
        <Text style={styles.intro}>
          This privacy policy describes how this app collects, uses, and protects your information. Last updated: April 2026.
        </Text>
        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
        <Text style={styles.contact}>Contact: stephen@stephenlutar.com</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backBtn: { padding: 4, marginRight: 12 },
  title: { fontSize: 17, fontWeight: "600", color: "#e8e8e8" },
  scroll: { flex: 1 },
  content: { padding: 20 },
  eyebrow: { fontSize: 9, letterSpacing: 3, color: "rgba(232,232,232,0.5)", marginBottom: 12, fontWeight: "500" },
  intro: { fontSize: 13, lineHeight: 20, color: "rgba(232,232,232,0.4)", marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: "#e8e8e8", marginBottom: 6 },
  sectionBody: { fontSize: 13, lineHeight: 20, color: "rgba(232,232,232,0.4)" },
  contact: { fontSize: 12, color: "rgba(232,232,232,0.5)", marginTop: 16, textAlign: "center" },
});
