import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Animated as RNAnimated,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { CameraType } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

export interface DocumentEntity {
  type: string;
  value: string;
  confidence: number;
  color: string;
}

export interface DocumentResult {
  id: string;
  classification: string;
  classificationColor: string;
  summary: string;
  entities: DocumentEntity[];
  rawText: string;
  processedAt: number;
}

interface DocumentCaptureProps {
  visible: boolean;
  onClose: () => void;
  onResult: (result: DocumentResult) => void;
  documentType: "legal" | "property" | "shipping";
  accentColor: string;
  title?: string;
  apiBase?: string;
  authToken?: string | null;
}

const ENTITY_COLORS = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#6b7280"];

export function DocumentCapture({
  visible,
  onClose,
  onResult,
  documentType,
  accentColor,
  title = "Document Scanner",
  apiBase,
  authToken,
}: DocumentCaptureProps) {
  const [phase, setPhase] = useState<"camera" | "processing" | "result">("camera");
  const [result, setResult] = useState<DocumentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<React.ElementRef<typeof CameraView>>(null);
  const processAnim = useRef(new RNAnimated.Value(0)).current;
  const scanAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setPhase("camera");
      setResult(null);
      setError(null);
      processAnim.setValue(0);
      scanAnim.setValue(0);
    }
  }, [visible, processAnim, scanAnim]);

  const runScanAnimation = useCallback(() => {
    scanAnim.setValue(0);
    return RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(scanAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        RNAnimated.timing(scanAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
  }, [scanAnim]);

  const processImage = useCallback(async (uri: string) => {
    setPhase("processing");
    setError(null);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    const scanLoop = runScanAnimation();
    scanLoop.start();
    RNAnimated.timing(processAnim, { toValue: 0.7, duration: 2000, useNativeDriver: false }).start();

    try {
      const headers: Record<string, string> = {};
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

      let apiResult: DocumentResult | null = null;

      if (apiBase) {
        const formData = new FormData();
        const filename = uri.split("/").pop() ?? "scan.jpg";
        formData.append("file", { uri, name: filename, type: "image/jpeg" } as unknown as Blob);
        formData.append("domain", documentType);
        formData.append("tasks", JSON.stringify(["classification", "entities", "summary"]));

        const res = await fetch(`${apiBase}/ai/extract`, { method: "POST", headers, body: formData });
        RNAnimated.timing(processAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();
        scanLoop.stop();

        if (res.ok) {
          const data = await res.json() as {
            classification?: string;
            entities?: Array<{ type: string; value: string; confidence?: number }>;
            summary?: string;
            rawText?: string;
          };
          apiResult = {
            id: `doc-${Date.now()}`,
            classification: data.classification ?? "Intelligence Document",
            classificationColor: accentColor,
            summary: data.summary ?? "Document processed by AI extraction pipeline.",
            entities: (data.entities ?? []).map((e, i) => ({
              type: e.type,
              value: e.value,
              confidence: e.confidence ?? 0.9,
              color: ENTITY_COLORS[i % ENTITY_COLORS.length]!,
            })),
            rawText: data.rawText ?? "",
            processedAt: Date.now(),
          };
        }
      }

      if (!apiResult) {
        scanLoop.stop();
        setError("Cannot reach extraction API. Ensure connectivity and try again.");
        setPhase("camera");
        processAnim.setValue(0);
        return;
      }

      setResult(apiResult);
      setPhase("result");
      onResult(apiResult);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      scanLoop.stop();
      setError("Document capture failed. Please try again.");
      setPhase("camera");
      processAnim.setValue(0);
    }
  }, [apiBase, authToken, documentType, accentColor, onResult, processAnim, runScanAnimation]);

  const captureFromCamera = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });
      if (photo?.uri) await processImage(photo.uri);
    } catch {
      setError("Camera capture failed. Please try again.");
    }
  }, [processImage]);

  const captureFromGallery = useCallback(async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!picked.canceled && picked.assets[0]) {
      await processImage(picked.assets[0].uri);
    }
  }, [processImage]);

  const reset = () => {
    setPhase("camera");
    setResult(null);
    processAnim.setValue(0);
    scanAnim.setValue(0);
  };

  const progressWidth = processAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  const scanY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 280] });

  const renderCamera = () => {
    if (Platform.OS === "web") {
      return (
        <View style={styles.webFallback}>
          <Feather name="file-text" size={48} color="rgba(255,255,255,0.15)" />
          <Text style={styles.hintText}>Camera not available on web</Text>
          <TouchableOpacity onPress={captureFromGallery} style={[styles.galleryBtn, { backgroundColor: accentColor }]}>
            <Feather name="image" size={18} color="#fff" />
            <Text style={styles.captureBtnText}>Select from Gallery</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!permission?.granted) {
      return (
        <View style={styles.webFallback}>
          <Feather name="camera-off" size={40} color="rgba(255,255,255,0.3)" />
          <Text style={styles.hintText}>Camera permission required</Text>
          <TouchableOpacity onPress={requestPermission} style={[styles.galleryBtn, { backgroundColor: accentColor }]}>
            <Text style={styles.captureBtnText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={captureFromGallery} style={[styles.galleryBtn, { borderColor: accentColor + "40", borderWidth: 1 }]}>
            <Feather name="image" size={16} color={accentColor} />
            <Text style={[styles.captureBtnText, { color: accentColor }]}>Use Gallery Instead</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraWrapper}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing={cameraFacing} />
        <View style={[styles.scanOverlay, StyleSheet.absoluteFillObject]}>
          <View style={styles.scanCornerTL} />
          <View style={styles.scanCornerTR} />
          <View style={styles.scanCornerBL} />
          <View style={styles.scanCornerBR} />
          <RNAnimated.View style={[styles.scanLine, { backgroundColor: accentColor, transform: [{ translateY: scanY }] }]} />
        </View>
        <Text style={styles.cameraHint}>Align document within frame</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.header, { borderBottomColor: accentColor + "30" }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={20} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={[styles.badge, { backgroundColor: accentColor + "20", borderColor: accentColor + "40" }]}>
            <Feather name="camera" size={11} color={accentColor} />
            <Text style={[styles.badgeText, { color: accentColor }]}>AI OCR</Text>
          </View>
        </View>

        {phase === "camera" && (
          <View style={styles.captureView}>
            <View style={styles.cameraFrame}>
              {renderCamera()}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <View style={styles.captureBottom}>
              <Text style={styles.captureDesc}>
                Point camera at document — AI will extract entities, classify, and summarize automatically.
              </Text>
              {Platform.OS !== "web" && permission?.granted && (
                <TouchableOpacity onPress={captureFromCamera} style={[styles.captureBtn, { backgroundColor: accentColor }]}>
                  <Feather name="aperture" size={22} color="#fff" />
                  <Text style={styles.captureBtnText}>Capture Document</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={captureFromGallery} style={[styles.galleryBtn, { borderColor: accentColor + "40" }]}>
                <Feather name="image" size={16} color={accentColor} />
                <Text style={[styles.captureBtnText, { color: accentColor }]}>Upload from Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {phase === "processing" && (
          <View style={styles.processingView}>
            <ActivityIndicator size="large" color={accentColor} />
            <Text style={styles.processingTitle}>Analyzing Document</Text>
            <Text style={styles.processingDesc}>Running OCR, NER extraction, and classification…</Text>
            <View style={styles.progressBar}>
              <RNAnimated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: accentColor }]} />
            </View>
            <View style={styles.processingSteps}>
              {["OCR Text Extraction", "Entity Recognition", "Classification", "AI Summary"].map((step) => (
                <View key={step} style={styles.step}>
                  <ActivityIndicator size={10} color={accentColor} />
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {phase === "result" && result && (
          <ScrollView style={styles.resultScroll} contentContainerStyle={styles.resultContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.classCard, { borderColor: result.classificationColor + "40", backgroundColor: result.classificationColor + "10" }]}>
              <Text style={styles.classLabel}>CLASSIFICATION</Text>
              <Text style={[styles.classValue, { color: result.classificationColor }]}>{result.classification}</Text>
              <Text style={styles.processedAt}>Processed {new Date(result.processedAt).toLocaleTimeString()}</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.sectionLabel}>AI SUMMARY</Text>
              <Text style={styles.summaryText}>{result.summary}</Text>
            </View>

            <View style={styles.entitiesCard}>
              <Text style={styles.sectionLabel}>EXTRACTED ENTITIES</Text>
              <View style={styles.entitiesGrid}>
                {result.entities.map(entity => (
                  <View key={entity.type} style={[styles.entityChip, { borderColor: entity.color + "40", backgroundColor: entity.color + "10" }]}>
                    <Text style={[styles.entityType, { color: entity.color }]}>{entity.type}</Text>
                    <Text style={styles.entityValue}>{entity.value}</Text>
                    <Text style={[styles.entityConf, { color: entity.color }]}>{Math.round(entity.confidence * 100)}%</Text>
                  </View>
                ))}
              </View>
            </View>

            {result.rawText ? (
              <View style={styles.rawCard}>
                <Text style={styles.sectionLabel}>RAW TEXT</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text style={styles.rawText}>{result.rawText}</Text>
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.actions}>
              <TouchableOpacity onPress={reset} style={[styles.actionBtn, { borderColor: accentColor + "40" }]}>
                <Feather name="refresh-cw" size={14} color={accentColor} />
                <Text style={[styles.actionText, { color: accentColor }]}>Scan Another</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={[styles.actionBtn, { backgroundColor: accentColor }]}>
                <Feather name="check" size={14} color="#fff" />
                <Text style={[styles.actionText, { color: "#fff" }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08080f" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 54 : 24, paddingBottom: 14, borderBottomWidth: 1 },
  closeBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#fff", letterSpacing: -0.3 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: "600" },
  captureView: { flex: 1 },
  cameraFrame: { flex: 1, margin: 20, borderRadius: 16, overflow: "hidden" },
  cameraWrapper: { flex: 1, position: "relative", backgroundColor: "#000" },
  webFallback: { flex: 1, backgroundColor: "#0a1628", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  scanOverlay: { overflow: "hidden" },
  scanLine: { position: "absolute", left: 0, right: 0, height: 2, opacity: 0.8 },
  scanCornerTL: { position: "absolute", top: 20, left: 20, width: 28, height: 28, borderTopWidth: 2, borderLeftWidth: 2, borderColor: "rgba(255,255,255,0.7)" },
  scanCornerTR: { position: "absolute", top: 20, right: 20, width: 28, height: 28, borderTopWidth: 2, borderRightWidth: 2, borderColor: "rgba(255,255,255,0.7)" },
  scanCornerBL: { position: "absolute", bottom: 20, left: 20, width: 28, height: 28, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: "rgba(255,255,255,0.7)" },
  scanCornerBR: { position: "absolute", bottom: 20, right: 20, width: 28, height: 28, borderBottomWidth: 2, borderRightWidth: 2, borderColor: "rgba(255,255,255,0.7)" },
  cameraHint: { position: "absolute", bottom: 12, alignSelf: "center", fontSize: 12, color: "rgba(255,255,255,0.5)" },
  hintText: { fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center" },
  errorText: { fontSize: 12, color: "#ef4444", textAlign: "center", paddingHorizontal: 20, marginTop: -12 },
  captureBottom: { padding: 20, gap: 10 },
  captureDesc: { fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 20 },
  captureBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 14 },
  galleryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12 },
  captureBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  processingView: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 16 },
  processingTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  processingDesc: { fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center" },
  progressBar: { width: "100%", height: 3, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  processingSteps: { gap: 8, width: "100%" },
  step: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepText: { fontSize: 12, color: "rgba(255,255,255,0.5)" },
  resultScroll: { flex: 1 },
  resultContent: { padding: 16, gap: 12, paddingBottom: 40 },
  classCard: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 4 },
  classLabel: { fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, textTransform: "uppercase" },
  classValue: { fontSize: 18, fontWeight: "700" },
  processedAt: { fontSize: 10, color: "rgba(255,255,255,0.3)" },
  summaryCard: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", gap: 8 },
  sectionLabel: { fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.25)", letterSpacing: 1.5, textTransform: "uppercase" },
  summaryText: { fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 20 },
  entitiesCard: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", gap: 10 },
  entitiesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  entityChip: { borderWidth: 1, borderRadius: 8, padding: 8, gap: 2, minWidth: "44%" },
  entityType: { fontSize: 9, fontWeight: "700", letterSpacing: 0.8 },
  entityValue: { fontSize: 12, fontWeight: "600", color: "#fff" },
  entityConf: { fontSize: 9, fontWeight: "600" },
  rawCard: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", gap: 8 },
  rawText: { fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", lineHeight: 18 },
  actions: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 12, borderWidth: 1 },
  actionText: { fontSize: 14, fontWeight: "600" },
});
