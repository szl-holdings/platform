import React, { useState, useEffect, useRef } from "react";
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

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface VesselARPin {
  id: string;
  name: string;
  status: "at_sea" | "in_port" | "anchored" | "maintenance";
  type: "container" | "tanker" | "bulk" | "roro";
  flag: string;
  imo: string;
  heading: number;
  speed: number;
  eta?: string;
  berth?: string;
  x: number;
  y: number;
}

interface BerthStatus {
  id: string;
  name: string;
  status: "available" | "occupied" | "reserved";
  vessel?: string;
  eta?: string;
}

const MOCK_VESSELS: VesselARPin[] = [
  { id: "1", name: "MV Atlantic Meridian", status: "in_port", type: "container", flag: "🇺🇸", imo: "9876543", heading: 47, speed: 0, berth: "Berth 7-A", x: 0.25, y: 0.35 },
  { id: "2", name: "MV Pacific Star", status: "anchored", type: "tanker", flag: "🇬🇷", imo: "9234567", heading: 215, speed: 0.3, eta: "14:30 today", x: 0.65, y: 0.45 },
  { id: "3", name: "MV Northern Crown", status: "at_sea", type: "bulk", flag: "🇬🇧", imo: "9345678", heading: 312, speed: 14.2, eta: "Tomorrow 08:00", x: 0.8, y: 0.25 },
  { id: "4", name: "MV Baltic Express", status: "in_port", type: "roro", flag: "🇸🇪", imo: "9456789", heading: 90, speed: 0, berth: "Berth 12-B", x: 0.45, y: 0.65 },
];

const MOCK_BERTHS: BerthStatus[] = [
  { id: "7A", name: "Berth 7-A", status: "occupied", vessel: "MV Atlantic Meridian" },
  { id: "12B", name: "Berth 12-B", status: "occupied", vessel: "MV Baltic Express" },
  { id: "3C", name: "Berth 3-C", status: "available" },
  { id: "9D", name: "Berth 9-D", status: "reserved", vessel: "MV Copenhagen", eta: "16:00" },
  { id: "15A", name: "Berth 15-A", status: "available" },
];

const STATUS_COLORS: Record<string, string> = {
  at_sea: "#22c55e",
  in_port: "#0ea5e9",
  anchored: "#f59e0b",
  maintenance: "#ef4444",
};

interface ARPortOverlayProps {
  visible: boolean;
  onClose: () => void;
  portName?: string;
}

export function ARPortOverlay({ visible, onClose, portName = "Port of New York" }: ARPortOverlayProps) {
  const [selectedVessel, setSelectedVessel] = useState<VesselARPin | null>(null);
  const scanAnim = useRef(new RNAnimated.Value(0)).current;
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    const scan = RNAnimated.loop(
      RNAnimated.timing(scanAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      })
    );
    scan.start();

    const pulse = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        RNAnimated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();

    return () => {
      scan.stop();
      pulse.stop();
    };
  }, [visible]);

  const scanLineY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_H * 0.5],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.cameraView}>
          <View style={styles.cameraBackground} />

          <View style={styles.gridOverlay}>
            {Array.from({ length: 6 }, (_, i) => (
              <View key={`h${i}`} style={[styles.gridLineH, { top: `${(i + 1) * 14}%` as any }]} />
            ))}
            {Array.from({ length: 8 }, (_, i) => (
              <View key={`v${i}`} style={[styles.gridLineV, { left: `${(i + 1) * 11}%` as any }]} />
            ))}
          </View>

          <RNAnimated.View style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]} />

          {MOCK_VESSELS.map((vessel) => (
            <Pressable
              key={vessel.id}
              style={[
                styles.vesselPin,
                {
                  left: `${vessel.x * 100}%` as any,
                  top: `${vessel.y * 100}%` as any,
                },
              ]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
                setSelectedVessel(vessel === selectedVessel ? null : vessel);
              }}
            >
              <RNAnimated.View style={[styles.pinDot, { backgroundColor: STATUS_COLORS[vessel.status], transform: [{ scale: vessel === selectedVessel ? pulseAnim : 1 }] }]} />
              <BlurView intensity={60} tint="dark" style={styles.pinLabel}>
                <Text style={styles.pinName} numberOfLines={1}>{vessel.name}</Text>
                <Text style={styles.pinStatus} style={{ color: STATUS_COLORS[vessel.status] } as any}>
                  {vessel.status.replace("_", " ")}
                </Text>
              </BlurView>
            </Pressable>
          ))}

          {selectedVessel && (
            <View style={styles.selectedCard}>
              <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.selectedInner}>
                <View style={styles.selectedHeader}>
                  <Text style={styles.selectedName}>{selectedVessel.name}</Text>
                  <Text style={styles.selectedFlag}>{selectedVessel.flag}</Text>
                </View>
                <View style={styles.selectedMeta}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>IMO</Text>
                    <Text style={styles.metaValue}>{selectedVessel.imo}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Speed</Text>
                    <Text style={styles.metaValue}>{selectedVessel.speed} kn</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Heading</Text>
                    <Text style={styles.metaValue}>{selectedVessel.heading}°</Text>
                  </View>
                  {selectedVessel.berth && (
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Berth</Text>
                      <Text style={[styles.metaValue, { color: "#0ea5e9" }]}>{selectedVessel.berth}</Text>
                    </View>
                  )}
                  {selectedVessel.eta && (
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>ETA</Text>
                      <Text style={styles.metaValue}>{selectedVessel.eta}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          <View style={styles.topBar}>
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.topBarInner}>
              <View style={styles.portInfo}>
                <Feather name="anchor" size={14} color="#0ea5e9" />
                <Text style={styles.portName}>{portName}</Text>
              </View>
              <Text style={styles.vesselCount}>{MOCK_VESSELS.length} vessels detected</Text>
            </View>
          </View>

          <View style={styles.bottomPanel}>
            <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.bottomInner}>
              <Text style={styles.berthTitle}>BERTH AVAILABILITY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.berthScroll}>
                {MOCK_BERTHS.map((berth) => (
                  <View
                    key={berth.id}
                    style={[
                      styles.berthChip,
                      { borderColor: berth.status === "available" ? "#22c55e40" : berth.status === "occupied" ? "#ef444440" : "#f59e0b40" },
                    ]}
                  >
                    <View style={[styles.berthDot, { backgroundColor: berth.status === "available" ? "#22c55e" : berth.status === "occupied" ? "#ef4444" : "#f59e0b" }]} />
                    <View>
                      <Text style={styles.berthName}>{berth.name}</Text>
                      <Text style={[styles.berthStatus, { color: berth.status === "available" ? "#22c55e" : berth.status === "occupied" ? "#ef4444" : "#f59e0b" }]}>
                        {berth.vessel || "Available"}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Feather name="x" size={20} color="#fff" />
        </Pressable>

        <View style={styles.arLabel}>
          <Text style={styles.arLabelText}>AR PORT OVERLAY</Text>
          <View style={styles.arLiveDot} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraView: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  cameraBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0a1628",
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(14,165,233,0.1)",
  },
  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(14,165,233,0.1)",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(14,165,233,0.6)",
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  vesselPin: {
    position: "absolute",
    alignItems: "center",
    gap: 4,
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#fff",
  },
  pinLabel: {
    borderRadius: 6,
    overflow: "hidden",
    padding: 4,
    maxWidth: 120,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  pinName: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  pinStatus: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    textTransform: "capitalize",
  },
  selectedCard: {
    position: "absolute",
    left: 12,
    right: 12,
    top: "30%",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(14,165,233,0.4)",
  },
  selectedInner: {
    padding: 16,
    gap: 12,
  },
  selectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    flex: 1,
  },
  selectedFlag: {
    fontSize: 20,
  },
  selectedMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaItem: { gap: 2, minWidth: "28%" },
  metaLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metaValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.9)",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    overflow: "hidden",
  },
  topBarInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: 40,
  },
  portInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  portName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  vesselCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(14,165,233,0.8)",
  },
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
  },
  bottomInner: {
    padding: 16,
    paddingBottom: 32,
    gap: 10,
  },
  berthTitle: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  berthScroll: {
    gap: 8,
  },
  berthChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  berthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  berthName: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.8)",
  },
  berthStatus: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  closeBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  arLabel: {
    position: "absolute",
    top: 55,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  arLabelText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: "#0ea5e9",
    letterSpacing: 2,
  },
  arLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22c55e",
  },
});
