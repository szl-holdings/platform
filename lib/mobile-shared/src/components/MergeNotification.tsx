import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { MobileCrdtMergeEvent } from "../hooks/useMobileCrdt";

interface Props {
  merges: MobileCrdtMergeEvent[];
  onDismiss: () => void;
}

export function MergeNotification({ merges, onDismiss }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (merges.length === 0) return null;

  const actor = merges[0]!.actorId;
  const count = merges.length;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.dot} />
        <Text style={styles.message}>
          {actor} updated {count} field{count > 1 ? "s" : ""} — merged automatically
        </Text>
      </View>
      {expanded && (
        <View style={styles.details}>
          {merges.map((m, i) => (
            <View key={i} style={styles.field}>
              <Text style={styles.fieldKey}>{m.fieldKey}</Text>
              <Text style={styles.fieldValue}>{String(m.newValue ?? "—")}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => setExpanded((v) => !v)}>
          <Text style={styles.link}>{expanded ? "Hide" : "View changes"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDismiss}>
          <Text style={styles.dismiss}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#1e293b",
    borderRadius: 10,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#334155",
    zIndex: 999,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
  },
  message: {
    color: "#e2e8f0",
    fontSize: 13,
    flex: 1,
  },
  details: {
    marginTop: 10,
    gap: 4,
  },
  field: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  fieldKey: {
    color: "#94a3b8",
    fontSize: 12,
  },
  fieldValue: {
    color: "#e2e8f0",
    fontSize: 12,
    maxWidth: "60%",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
    marginTop: 10,
  },
  link: {
    color: "#3b82f6",
    fontSize: 12,
  },
  dismiss: {
    color: "#64748b",
    fontSize: 12,
  },
});
