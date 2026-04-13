import React from "react";
import { ScrollView, Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const SECTIONS = [
  {
    title: "Data We Collect",
    body: "Vessels collects authentication credentials, biometric authentication preferences (stored locally on-device), push notification tokens, and fleet query logs. AIS vessel data is fetched in real-time and is not stored permanently on-device. Location data is used only when granted to show nearby fleet activity.",
  },
  {
    title: "How We Use Your Data",
    body: "Authentication data verifies maritime operator identity. Push notification tokens deliver critical alerts (dark vessel detections, sanctions flags, weather hazards). Location data surfaces nearby vessel activity. No usage data is sold or shared with third parties.",
  },
  {
    title: "AIS & Maritime Data",
    body: "Real-time AIS data is sourced from Digitraffic and BarentsWatch public APIs. Geopolitical intelligence uses GDELT Maritime feeds. Sanctions data is sourced from OFAC and EU databases. None of this data is linked to your personal identity.",
  },
  {
    title: "Data Security",
    body: "All communications are encrypted with TLS 1.3. Authentication tokens are stored in the device secure enclave (iOS Keychain / Android Keystore). Biometric authentication is processed entirely on-device.",
  },
  {
    title: "Data Retention",
    body: "Session tokens expire after 30 days of inactivity. Cached fleet data is cleared when you sign out. You may request deletion of your account data at any time.",
  },
  {
    title: "Your Rights",
    body: "You have the right to access, correct, or delete your personal data. Disable push notifications from device settings at any time. Contact privacy@vessels.ai for data requests.",
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
          <Feather name="arrow-left" size={20} color="#0ea5e9" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>VESSELS MARITIME INTELLIGENCE</Text>
        <Text style={styles.intro}>
          This privacy policy describes how Vessels collects, uses, and protects your information. Last updated: April 2026.
        </Text>
        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
        <Text style={styles.contact}>Contact: privacy@vessels.ai</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020d18" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14,165,233,0.15)",
  },
  backBtn: { padding: 4, marginRight: 12 },
  title: { fontSize: 17, fontWeight: "600", color: "#e2f4ff" },
  scroll: { flex: 1 },
  content: { padding: 20 },
  eyebrow: { fontSize: 9, letterSpacing: 3, color: "#0ea5e9", marginBottom: 12, fontWeight: "500" },
  intro: { fontSize: 13, lineHeight: 20, color: "#6b8fa8", marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: "#e2f4ff", marginBottom: 6 },
  sectionBody: { fontSize: 13, lineHeight: 20, color: "#6b8fa8" },
  contact: { fontSize: 12, color: "#0ea5e9", marginTop: 16, textAlign: "center" },
});
