import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  Animated as RNAnimated,
  Dimensions,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

const { width: SCREEN_W } = Dimensions.get("window");

interface PropertyData {
  id: string;
  address: string;
  neighborhood: string;
  city: string;
  estimatedValue: string;
  owner: string;
  ownerType: "individual" | "llc" | "trust" | "corporate";
  distressScore: number;
  liens: number;
  lienAmount: string;
  yearBuilt: number;
  sqft: number;
  units: number;
  zoning: string;
  lastSaleDate: string;
  lastSalePrice: string;
  mortgageDelinquency: boolean;
  taxLien: boolean;
  preForeclosure: boolean;
  capRate: string;
  noi: string;
}

const MOCK_PROPERTY: PropertyData = {
  id: "NYC-5482",
  address: "247 West 57th Street",
  neighborhood: "Midtown",
  city: "New York, NY 10019",
  estimatedValue: "$4.2M",
  owner: "Midtown Assets LLC",
  ownerType: "llc",
  distressScore: 72,
  liens: 3,
  lienAmount: "$340K",
  yearBuilt: 1962,
  sqft: 8400,
  units: 12,
  zoning: "R8A / Commercial",
  lastSaleDate: "Mar 2019",
  lastSalePrice: "$3.1M",
  mortgageDelinquency: true,
  taxLien: false,
  preForeclosure: false,
  capRate: "5.8%",
  noi: "$243K",
};

interface ARPropertyScannerProps {
  visible: boolean;
  onClose: () => void;
}

export function ARPropertyScanner({ visible, onClose }: ARPropertyScannerProps) {
  const [scanning, setScanning] = useState(true);
  const [property, setProperty] = useState<PropertyData | null>(null);
  const scanProgress = useRef(new RNAnimated.Value(0)).current;
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;
  const cornerAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setScanning(true);
      setProperty(null);
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    const progress = RNAnimated.timing(scanProgress, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    });

    const corners = RNAnimated.timing(cornerAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    });

    const pulse = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
        RNAnimated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );

    scanProgress.setValue(0);
    cornerAnim.setValue(0);

    corners.start();
    pulse.start();
    progress.start(() => {
      setScanning(false);
      setProperty(MOCK_PROPERTY);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    });

    return () => {
      progress.stop();
      pulse.stop();
    };
  }, [visible]);

  const progressWidth = scanProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const distressColor =
    (property?.distressScore ?? 0) > 70
      ? "#ef4444"
      : (property?.distressScore ?? 0) > 40
      ? "#f59e0b"
      : "#22c55e";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.cameraView}>
          <View style={styles.cameraBackground} />

          {scanning && (
            <View style={styles.scanFrame}>
              <RNAnimated.View
                style={[styles.corner, styles.cornerTL, { opacity: cornerAnim, transform: [{ scale: cornerAnim }] }]}
              />
              <RNAnimated.View
                style={[styles.corner, styles.cornerTR, { opacity: cornerAnim, transform: [{ scale: cornerAnim }] }]}
              />
              <RNAnimated.View
                style={[styles.corner, styles.cornerBL, { opacity: cornerAnim, transform: [{ scale: cornerAnim }] }]}
              />
              <RNAnimated.View
                style={[styles.corner, styles.cornerBR, { opacity: cornerAnim, transform: [{ scale: cornerAnim }] }]}
              />

              <View style={styles.scanInfo}>
                <Text style={styles.scanningText}>Scanning building…</Text>
                <Text style={styles.scanSubText}>GPS + image recognition active</Text>
                <View style={styles.progressBar}>
                  <RNAnimated.View
                    style={[styles.progressFill, { width: progressWidth }]}
                  />
                </View>
              </View>
            </View>
          )}

          {property && !scanning && (
            <ScrollView
              style={styles.resultScroll}
              contentContainerStyle={styles.resultContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.addressCard}>
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.addressInner}>
                  <View style={styles.addressRow}>
                    <View style={styles.addressLeft}>
                      <Text style={styles.propertyId}>#{property.id}</Text>
                      <Text style={styles.address}>{property.address}</Text>
                      <Text style={styles.city}>{property.city}</Text>
                    </View>
                    <View style={[styles.distressScore, { borderColor: `${distressColor}50`, backgroundColor: `${distressColor}15` }]}>
                      <Text style={[styles.distressValue, { color: distressColor }]}>
                        {property.distressScore}
                      </Text>
                      <Text style={styles.distressLabel}>Distress</Text>
                    </View>
                  </View>

                  <View style={styles.flags}>
                    {property.mortgageDelinquency && (
                      <View style={styles.flag}>
                        <Feather name="alert-triangle" size={10} color="#ef4444" />
                        <Text style={[styles.flagText, { color: "#ef4444" }]}>Mortgage Delinquent</Text>
                      </View>
                    )}
                    {property.taxLien && (
                      <View style={styles.flag}>
                        <Feather name="alert-circle" size={10} color="#f59e0b" />
                        <Text style={[styles.flagText, { color: "#f59e0b" }]}>Tax Lien</Text>
                      </View>
                    )}
                    {property.preForeclosure && (
                      <View style={styles.flag}>
                        <Feather name="home" size={10} color="#ef4444" />
                        <Text style={[styles.flagText, { color: "#ef4444" }]}>Pre-Foreclosure</Text>
                      </View>
                    )}
                    {!property.mortgageDelinquency && !property.taxLien && !property.preForeclosure && (
                      <View style={[styles.flag, { backgroundColor: "rgba(34,197,94,0.1)" }]}>
                        <Feather name="check-circle" size={10} color="#22c55e" />
                        <Text style={[styles.flagText, { color: "#22c55e" }]}>No Active Distress Flags</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.metricsGrid}>
                {[
                  { label: "Est. Value", value: property.estimatedValue, icon: "dollar-sign", color: "#4d7c0f" },
                  { label: "Liens", value: `${property.liens} (${property.lienAmount})`, icon: "alert-circle", color: "#f59e0b" },
                  { label: "Cap Rate", value: property.capRate, icon: "percent", color: "#22c55e" },
                  { label: "NOI", value: property.noi, icon: "trending-up", color: "#3b82f6" },
                  { label: "Units", value: property.units, icon: "home", color: "#8b5cf6" },
                  { label: "Sq Ft", value: property.sqft.toLocaleString(), icon: "maximize-2", color: "#0ea5e9" },
                ].map((m) => (
                  <View key={m.label} style={styles.metricCard}>
                    <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
                    <Feather name={m.icon as any} size={14} color={m.color} />
                    <Text style={styles.metricValue}>{String(m.value)}</Text>
                    <Text style={styles.metricLabel}>{m.label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.ownerCard}>
                <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.ownerInner}>
                  <Text style={styles.ownerSection}>OWNERSHIP</Text>
                  <Text style={styles.ownerName}>{property.owner}</Text>
                  <Text style={styles.ownerType}>{property.ownerType.toUpperCase()} · Built {property.yearBuilt} · {property.zoning}</Text>
                  <View style={styles.ownerMeta}>
                    <Text style={styles.ownerMetaText}>Last sale: {property.lastSaleDate} at {property.lastSalePrice}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}

          <View style={styles.topBar}>
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.topBarInner}>
              <View style={styles.arBadge}>
                <Text style={styles.arText}>AR SCANNER</Text>
                <View style={styles.arDot} />
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={16} color="rgba(255,255,255,0.6)" />
              </Pressable>
            </View>
          </View>

          {property && (
            <Pressable
              style={styles.rescanBtn}
              onPress={() => {
                setProperty(null);
                setScanning(true);
                scanProgress.setValue(0);
                RNAnimated.timing(scanProgress, { toValue: 1, duration: 2500, useNativeDriver: false })
                  .start(() => {
                    setScanning(false);
                    setProperty(MOCK_PROPERTY);
                  });
              }}
            >
              <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
              <Feather name="refresh-cw" size={14} color="#4d7c0f" />
              <Text style={styles.rescanText}>Rescan</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  cameraView: { flex: 1, position: "relative", overflow: "hidden" },
  cameraBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: "#0a1a0a" },
  scanFrame: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "#4d7c0f",
    borderWidth: 3,
  },
  cornerTL: { top: "25%", left: "15%", borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: "25%", right: "15%", borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: "35%", left: "15%", borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: "35%", right: "15%", borderLeftWidth: 0, borderTopWidth: 0 },
  scanInfo: { alignItems: "center", gap: 8, marginTop: 40 },
  scanningText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  scanSubText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)" },
  progressBar: { width: 200, height: 3, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden", marginTop: 8 },
  progressFill: { height: "100%", backgroundColor: "#4d7c0f", borderRadius: 2 },
  resultScroll: { flex: 1, marginTop: 80 },
  resultContent: { padding: 16, gap: 12, paddingBottom: 40 },
  addressCard: { borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "rgba(77,124,15,0.3)" },
  addressInner: { padding: 16, gap: 12 },
  addressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  addressLeft: { flex: 1, gap: 4 },
  propertyId: { fontSize: 10, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.4)", letterSpacing: 1 },
  address: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#fff" },
  city: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)" },
  distressScore: { alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 12, minWidth: 72 },
  distressValue: { fontSize: 24, fontFamily: "Inter_700Bold" },
  distressLabel: { fontSize: 9, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 },
  flags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  flag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  flagText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metricCard: { width: (SCREEN_W - 48) / 3, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", alignItems: "center", padding: 12, gap: 6 },
  metricValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  metricLabel: { fontSize: 9, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" },
  ownerCard: { borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  ownerInner: { padding: 14, gap: 6 },
  ownerSection: { fontSize: 9, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase" },
  ownerName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  ownerType: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)" },
  ownerMeta: { marginTop: 4 },
  ownerMetaText: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)" },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, height: 76, overflow: "hidden" },
  topBarInner: { flex: 1, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, paddingTop: 36 },
  arBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  arText: { fontSize: 9, fontFamily: "Inter_600SemiBold", color: "#4d7c0f", letterSpacing: 2 },
  arDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22c55e" },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  rescanBtn: { position: "absolute", bottom: 30, right: 20, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "rgba(77,124,15,0.4)", paddingHorizontal: 14, paddingVertical: 10 },
  rescanText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#4d7c0f" },
});
