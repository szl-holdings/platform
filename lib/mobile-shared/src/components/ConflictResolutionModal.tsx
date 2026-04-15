import React, { useContext } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { SyncEngineContext, type ConflictInfo } from "../context/SyncEngineContext";

interface Props {
  accentColor?: string;
}

export function ConflictResolutionModal({ accentColor = "#6366f1" }: Props) {
  const ctx = useContext(SyncEngineContext);
  const conflicts = ctx?.conflicts ?? [];
  const resolveConflict = ctx?.resolveConflict;
  const dismissConflict = ctx?.dismissConflict;

  const currentConflict = conflicts[0] ?? null;

  if (!currentConflict) return null;

  return (
    <Modal
      visible={conflicts.length > 0}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ConflictCard
            conflict={currentConflict}
            remaining={conflicts.length}
            accentColor={accentColor}
            onKeepMine={() => resolveConflict?.(currentConflict.id, "keep-mine")}
            onKeepTheirs={() => resolveConflict?.(currentConflict.id, "keep-theirs")}
            onDismiss={() => dismissConflict?.(currentConflict.id)}
          />
        </View>
      </View>
    </Modal>
  );
}

interface ConflictCardProps {
  conflict: ConflictInfo;
  remaining: number;
  accentColor: string;
  onKeepMine: () => void;
  onKeepTheirs: () => void;
  onDismiss: () => void;
}

function ConflictCard({
  conflict,
  remaining,
  accentColor,
  onKeepMine,
  onKeepTheirs,
  onDismiss,
}: ConflictCardProps) {
  const method = conflict.mutation.method;
  const url = conflict.mutation.url.replace(/.*\/api/, "/api");

  const clientStr = safeStringify(conflict.clientVersion);
  const serverStr = safeStringify(conflict.serverVersion);

  return (
    <View>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: "#ef4444" }]}>
          <Text style={styles.badgeText}>Conflict</Text>
        </View>
        {remaining > 1 && (
          <Text style={styles.remainingText}>{remaining} conflicts</Text>
        )}
      </View>

      <Text style={styles.title}>Sync Conflict</Text>
      <Text style={styles.subtitle}>
        Another user changed this record while you were offline.{"\n"}
        Choose which version to keep.
      </Text>
      <Text style={styles.metaText}>
        {method} {url}
      </Text>

      <View style={styles.versionsRow}>
        <View style={[styles.versionBox, styles.versionBoxLeft]}>
          <Text style={styles.versionLabel}>Your version</Text>
          <ScrollView style={styles.versionScroll} nestedScrollEnabled>
            <Text style={styles.versionCode}>{clientStr}</Text>
          </ScrollView>
        </View>
        <View style={[styles.versionBox, styles.versionBoxRight]}>
          <Text style={styles.versionLabel}>Server version</Text>
          <ScrollView style={styles.versionScroll} nestedScrollEnabled>
            <Text style={styles.versionCode}>{serverStr}</Text>
          </ScrollView>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: accentColor }]}
          onPress={onKeepMine}
        >
          <Text style={styles.btnText}>Keep Mine</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={onKeepTheirs}
        >
          <Text style={[styles.btnText, styles.btnTextSecondary]}>Keep Server's</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
        <Text style={styles.dismissText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

function safeStringify(value: unknown): string {
  if (value === null || value === undefined) return "(empty)";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#1a1a2e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  remainingText: {
    color: "#94a3b8",
    fontSize: 12,
  },
  title: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  metaText: {
    color: "#64748b",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 16,
  },
  versionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  versionBox: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    maxHeight: 160,
  },
  versionBoxLeft: {
    borderColor: "#6366f1",
  },
  versionBoxRight: {
    borderColor: "#475569",
  },
  versionLabel: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  versionScroll: {
    flex: 1,
  },
  versionCode: {
    color: "#e2e8f0",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    lineHeight: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
  },
  btnSecondary: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  btnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  btnTextSecondary: {
    color: "#e2e8f0",
  },
  dismissBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  dismissText: {
    color: "#64748b",
    fontSize: 13,
  },
});
