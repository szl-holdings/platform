import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  Animated as RNAnimated,
  Share,
  Linking,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

const { width: SCREEN_W } = Dimensions.get("window");

const CARD_DATA = {
  name: "Stephen Lutar",
  title: "Founder & CEO",
  company: "SZL Holdings",
  tagline: "Building enterprise infrastructure for the next decade",
  email: "stephen@szlholdings.com",
  phone: "+1 (202) 555-0100",
  linkedin: "https://linkedin.com/in/stephenlutar",
  website: "https://szlholdings.com",
  location: "Washington, D.C. Metro",
  ventures: [
    { name: "Aegis", role: "Defense & Intelligence", color: "#6366f1" },
    { name: "Vessels", role: "Maritime Intelligence", color: "#3b82f6" },
    { name: "Terra", role: "Real Estate Intel", color: "#4d7c0f" },
    { name: "Lyte", role: "Business Observability", color: "#f59e0b" },
    { name: "Carlota Jo", role: "Advisory Platform", color: "#e879f9" },
    { name: "PRISM", role: "Legal Matter Command", color: "#f97316" },
  ],
  highlights: [
    { label: "Portfolio ARR", value: "$35M+" },
    { label: "Platforms", value: "6" },
    { label: "Assets Tracked", value: "$4.2B+" },
  ],
};

interface DigitalBusinessCardProps {
  visible: boolean;
  onClose: () => void;
}

export function DigitalBusinessCard({ visible, onClose }: DigitalBusinessCardProps) {
  const [shared, setShared] = useState(false);
  const [nfcMode, setNfcMode] = useState(false);
  const floatAnim = useRef(new RNAnimated.Value(0)).current;
  const glowAnim = useRef(new RNAnimated.Value(0)).current;
  const nfcAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setShared(false);
      setNfcMode(false);
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    const float = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(floatAnim, { toValue: -8, duration: 2000, useNativeDriver: true }),
        RNAnimated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );

    const glow = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        RNAnimated.timing(glowAnim, { toValue: 0.3, duration: 2000, useNativeDriver: false }),
      ])
    );

    float.start();
    glow.start();

    return () => {
      float.stop();
      glow.stop();
    };
  }, [visible]);

  const handleShare = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    const shareContent = `${CARD_DATA.name}
${CARD_DATA.title} at ${CARD_DATA.company}

"${CARD_DATA.tagline}"

📧 ${CARD_DATA.email}
📱 ${CARD_DATA.phone}
🔗 ${CARD_DATA.linkedin}
🌐 ${CARD_DATA.website}
📍 ${CARD_DATA.location}

Portfolio: ${CARD_DATA.highlights.map((h) => `${h.label}: ${h.value}`).join(" · ")}

SZL Holdings — ${CARD_DATA.ventures.map((v) => v.name).join(", ")}`;

    try {
      await Share.share({
        message: shareContent,
        title: `${CARD_DATA.name} — Digital Business Card`,
      });
      setShared(true);
      setTimeout(() => setShared(false), 3000);
    } catch {}
  }, []);

  const handleNFC = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }
    setNfcMode(true);

    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(nfcAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        RNAnimated.timing(nfcAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    setTimeout(() => {
      setNfcMode(false);
      nfcAnim.setValue(0);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    }, 5000);
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0.3, 1],
    outputRange: [0.1, 0.25],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />

        <RNAnimated.View
          style={[styles.card, { transform: [{ translateY: floatAnim }] }]}
        >
          <LinearGradient
            colors={["#0a0814", "#12102a", "#0a0814"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <RNAnimated.View
            style={[styles.glow, { opacity: glowOpacity }]}
          />

          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>SL</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.name}>{CARD_DATA.name}</Text>
              <Text style={styles.title}>{CARD_DATA.title}</Text>
              <Text style={styles.company}>{CARD_DATA.company}</Text>
            </View>
          </View>

          <Text style={styles.tagline}>{CARD_DATA.tagline}</Text>

          <View style={styles.contactRow}>
            <Pressable style={styles.contactItem} onPress={() => Linking.openURL(`mailto:${CARD_DATA.email}`)}>
              <Feather name="mail" size={13} color="#c9a84c" />
              <Text style={styles.contactText}>{CARD_DATA.email}</Text>
            </Pressable>
            <Pressable style={styles.contactItem} onPress={() => Linking.openURL(`tel:${CARD_DATA.phone}`)}>
              <Feather name="phone" size={13} color="#c9a84c" />
              <Text style={styles.contactText}>{CARD_DATA.phone}</Text>
            </Pressable>
          </View>

          <View style={styles.highlights}>
            {CARD_DATA.highlights.map((h) => (
              <View key={h.label} style={styles.highlightItem}>
                <Text style={styles.highlightValue}>{h.value}</Text>
                <Text style={styles.highlightLabel}>{h.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.ventures}>
            <Text style={styles.venturesLabel}>PORTFOLIO</Text>
            <View style={styles.ventureChips}>
              {CARD_DATA.ventures.map((v) => (
                <View key={v.name} style={[styles.ventureChip, { borderColor: `${v.color}40` }]}>
                  <View style={[styles.ventureDot, { backgroundColor: v.color }]} />
                  <Text style={styles.ventureName}>{v.name}</Text>
                </View>
              ))}
            </View>
          </View>

          {nfcMode ? (
            <View style={styles.nfcMode}>
              <RNAnimated.View style={[styles.nfcRipple, { opacity: nfcAnim }]} />
              <Feather name="wifi" size={24} color="#c9a84c" />
              <Text style={styles.nfcText}>Hold phones together to share</Text>
              <Text style={styles.nfcSub}>NFC sharing active…</Text>
            </View>
          ) : (
            <View style={styles.actions}>
              <Pressable style={styles.nfcBtn} onPress={handleNFC}>
                <Feather name="wifi" size={16} color="#c9a84c" />
                <Text style={styles.nfcBtnText}>Tap to Share</Text>
              </Pressable>
              <Pressable
                style={[styles.shareBtn, shared && styles.shareBtnSuccess]}
                onPress={handleShare}
              >
                <Feather name={shared ? "check" : "share-2"} size={16} color={shared ? "#000" : "#c9a84c"} />
                <Text style={[styles.shareBtnText, shared && { color: "#000" }]}>
                  {shared ? "Shared!" : "Share Card"}
                </Text>
              </Pressable>
            </View>
          )}

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Feather name="x" size={14} color="rgba(255,255,255,0.3)" />
          </Pressable>
        </RNAnimated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  backdropPress: { ...StyleSheet.absoluteFillObject },
  card: {
    width: SCREEN_W - 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.2)",
    padding: 24,
    gap: 18,
    zIndex: 10,
  },
  glow: {
    position: "absolute",
    top: -50,
    left: -50,
    right: -50,
    height: 200,
    backgroundColor: "#c9a84c",
    borderRadius: 100,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(201,168,76,0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(201,168,76,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: "#c9a84c" },
  headerInfo: { gap: 2 },
  name: { fontSize: 19, fontFamily: "Inter_700Bold", color: "#fff" },
  title: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(201,168,76,0.8)" },
  company: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.5)" },
  tagline: { fontSize: 13, fontFamily: "Inter_300Light", color: "rgba(255,255,255,0.5)", lineHeight: 19, fontStyle: "italic" },
  contactRow: { gap: 8 },
  contactItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)" },
  highlights: {
    flexDirection: "row",
    backgroundColor: "rgba(201,168,76,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.1)",
    padding: 12,
    justifyContent: "space-around",
  },
  highlightItem: { alignItems: "center", gap: 3 },
  highlightValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#c9a84c" },
  highlightLabel: { fontSize: 9, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.5 },
  ventures: { gap: 8 },
  venturesLabel: { fontSize: 9, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase" },
  ventureChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  ventureChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ventureDot: { width: 5, height: 5, borderRadius: 3 },
  ventureName: { fontSize: 11, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.6)" },
  nfcMode: { alignItems: "center", gap: 10, paddingVertical: 8 },
  nfcRipple: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#c9a84c",
  },
  nfcText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#c9a84c", textAlign: "center" },
  nfcSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.3)" },
  actions: { flexDirection: "row", gap: 10 },
  nfcBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.3)",
    backgroundColor: "rgba(201,168,76,0.08)",
    padding: 12,
  },
  nfcBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#c9a84c" },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.3)",
    backgroundColor: "rgba(201,168,76,0.08)",
    padding: 12,
  },
  shareBtnSuccess: { backgroundColor: "#c9a84c", borderColor: "#c9a84c" },
  shareBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#c9a84c" },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
});
