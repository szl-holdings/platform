import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";

export interface DocumentCaptureConfig {
  accentColor: string;
  apiBaseUrl: string;
  authToken?: string;
  domain: "legal" | "maritime" | "property" | "financial";
  onResult?: (result: DocumentResult) => void;
  onPickImage?: () => Promise<string | null>;
  onCaptureImage?: () => Promise<string | null>;
}

export interface ExtractedEntity {
  type: string;
  value: string;
  confidence: number;
}

export interface DocumentResult {
  classification: string;
  entities: ExtractedEntity[];
  summary: string;
  rawText?: string;
  confidence: number;
  filename?: string;
}

async function extractDocument(
  apiBaseUrl: string,
  imageUri: string,
  domain: string,
  authToken?: string,
): Promise<DocumentResult> {
  const filename = imageUri.split("/").pop() ?? "document.jpg";
  const formData = new FormData();
  formData.append("file", { uri: imageUri, type: "image/jpeg", name: filename } as unknown as Blob);
  formData.append("domain", domain);
  formData.append("tasks", JSON.stringify(["classify", "extract_entities", "summarize"]));

  const headers: Record<string, string> = {};
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const resp = await fetch(`${apiBaseUrl}/ai/extract`, {
    method: "POST",
    headers,
    body: formData,
    signal: AbortSignal.timeout(30000),
  });

  if (!resp.ok) {
    throw new Error(`Document extraction failed: ${resp.status} ${resp.statusText}`);
  }

  const data = await resp.json() as {
    classification?: string;
    entities?: ExtractedEntity[];
    summary?: string;
    rawText?: string;
    confidence?: number;
  };

  return {
    classification: data.classification ?? "Unknown Document",
    entities: data.entities ?? [],
    summary: data.summary ?? "",
    rawText: data.rawText,
    confidence: data.confidence ?? 0.9,
    filename,
  };
}

export function DocumentCapture({ config }: { config: DocumentCaptureConfig }) {
  const [result, setResult] = useState<DocumentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accent = config.accentColor;

  const processDocument = useCallback(async (uri: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const extraction = await extractDocument(config.apiBaseUrl, uri, config.domain, config.authToken);
      setResult(extraction);
      config.onResult?.(extraction);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Document processing failed");
    } finally {
      setLoading(false);
    }
  }, [config]);

  const handlePickDocument = useCallback(async () => {
    if (!config.onPickImage) {
      Alert.alert("Not Available", "Document upload requires additional permissions setup.");
      return;
    }
    const uri = await config.onPickImage();
    if (uri) processDocument(uri);
  }, [config, processDocument]);

  const handleCaptureDocument = useCallback(async () => {
    if (!config.onCaptureImage) {
      Alert.alert("Not Available", "Camera capture requires additional permissions setup.");
      return;
    }
    const uri = await config.onCaptureImage();
    if (uri) processDocument(uri);
  }, [config, processDocument]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: accent }]}>Document Intelligence</Text>
        <Text style={styles.headerSubtitle}>
          {config.domain === "legal" ? "Legal documents · OCR · NER entity extraction"
            : config.domain === "maritime" ? "Maritime docs · Bills of lading · Manifests"
            : config.domain === "property" ? "Property docs · Deeds · Liens · Contracts"
            : "Financial docs · Invoices · Contracts · Reports"}
        </Text>
      </View>

      <View style={styles.captureButtons}>
        {Platform.OS !== "web" && config.onCaptureImage && (
          <TouchableOpacity
            style={[styles.captureBtn, { borderColor: accent + "50", backgroundColor: accent + "10" }]}
            onPress={handleCaptureDocument}
            disabled={loading}
          >
            <Text style={[styles.captureBtnIcon, { color: accent }]}>📷</Text>
            <Text style={[styles.captureBtnText, { color: accent }]}>Capture</Text>
          </TouchableOpacity>
        )}
        {config.onPickImage && (
          <TouchableOpacity
            style={[styles.captureBtn, { borderColor: accent + "50", backgroundColor: accent + "10" }]}
            onPress={handlePickDocument}
            disabled={loading}
          >
            <Text style={[styles.captureBtnIcon, { color: accent }]}>📂</Text>
            <Text style={[styles.captureBtnText, { color: accent }]}>Upload</Text>
          </TouchableOpacity>
        )}
        {!config.onPickImage && !config.onCaptureImage && (
          <View style={[styles.captureBtn, { borderColor: "rgba(255,255,255,0.1)", opacity: 0.5 }]}>
            <Text style={styles.captureBtnIcon}>📄</Text>
            <Text style={styles.captureBtnTextDisabled}>Document upload via image picker</Text>
          </View>
        )}
      </View>

      {loading && (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={accent} />
          <Text style={[styles.loadingText, { color: accent }]}>Extracting entities…</Text>
          <Text style={styles.loadingSubtext}>OCR → Classification → NER pipeline</Text>
        </View>
      )}

      {error && (
        <View style={[styles.errorCard, { borderColor: "#ef444440" }]}>
          <Text style={styles.errorTitle}>Extraction Failed</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={[styles.retryText, { color: accent }]}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {result && (
        <ScrollView style={styles.resultContainer} contentContainerStyle={{ gap: 12 }}>
          <View style={[styles.resultHeader, { borderColor: accent + "30" }]}>
            <Text style={[styles.classificationLabel, { color: accent }]}>{result.classification}</Text>
            <View style={[styles.confidenceBadge, { backgroundColor: accent + "15", borderColor: accent + "30" }]}>
              <Text style={[styles.confidenceText, { color: accent }]}>
                {Math.round(result.confidence * 100)}% confidence
              </Text>
            </View>
          </View>

          {result.summary && (
            <View style={styles.summaryCard}>
              <Text style={styles.sectionLabel}>AI SUMMARY</Text>
              <Text style={styles.summaryText}>{result.summary}</Text>
            </View>
          )}

          {result.entities.length > 0 && (
            <View style={styles.entitiesSection}>
              <Text style={styles.sectionLabel}>EXTRACTED ENTITIES ({result.entities.length})</Text>
              <View style={styles.entityGrid}>
                {result.entities.map((entity, i) => (
                  <View key={i} style={[styles.entityChip, { borderColor: accent + "25" }]}>
                    <Text style={[styles.entityType, { color: accent }]}>{entity.type}</Text>
                    <Text style={styles.entityValue}>{entity.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.clearBtn, { borderColor: "rgba(255,255,255,0.08)" }]}
            onPress={() => setResult(null)}
          >
            <Text style={styles.clearBtnText}>Process Another Document</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { marginBottom: 16 },
  headerTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  headerSubtitle: { fontSize: 11, color: "rgba(255,255,255,0.4)" },
  captureButtons: { flexDirection: "row", gap: 10, marginBottom: 20 },
  captureBtn: { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 14, alignItems: "center", gap: 6 },
  captureBtnIcon: { fontSize: 22 },
  captureBtnText: { fontSize: 12, fontWeight: "600" },
  captureBtnTextDisabled: { fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center" },
  loadingState: { alignItems: "center", gap: 10, paddingVertical: 40 },
  loadingText: { fontSize: 13, fontWeight: "600" },
  loadingSubtext: { fontSize: 11, color: "rgba(255,255,255,0.3)" },
  errorCard: { borderRadius: 10, borderWidth: 1, backgroundColor: "rgba(239,68,68,0.08)", padding: 14, gap: 6 },
  errorTitle: { color: "#ef4444", fontSize: 12, fontWeight: "600" },
  errorText: { color: "rgba(255,255,255,0.5)", fontSize: 11 },
  retryText: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  resultContainer: { flex: 1 },
  resultHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, borderBottomWidth: 1 },
  classificationLabel: { fontSize: 14, fontWeight: "700" },
  confidenceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  confidenceText: { fontSize: 10, fontWeight: "600" },
  summaryCard: { gap: 6, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 12 },
  sectionLabel: { fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: "700", letterSpacing: 1 },
  summaryText: { fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 18 },
  entitiesSection: { gap: 10 },
  entityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  entityChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "rgba(255,255,255,0.03)", gap: 2 },
  entityType: { fontSize: 9, fontWeight: "700", letterSpacing: 0.8 },
  entityValue: { fontSize: 11, color: "rgba(255,255,255,0.8)" },
  clearBtn: { borderRadius: 8, borderWidth: 1, paddingVertical: 11, alignItems: "center" },
  clearBtnText: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
});
