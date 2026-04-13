import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";

export interface ToolResultCardProps {
  toolName: string;
  output: string | Record<string, unknown>;
  status: "running" | "done" | "error";
  accentColor?: string;
}

function tryParseJSON(raw: string | Record<string, unknown>): Record<string, unknown> | null {
  if (typeof raw === "object" && raw !== null) return raw;
  try {
    const parsed = JSON.parse(raw as string);
    if (typeof parsed === "object" && parsed !== null) return parsed;
    return null;
  } catch {
    return null;
  }
}

function DataTableCard({ data, accentColor }: { data: { columns?: any[]; rows?: any[]; title?: string }; accentColor: string }) {
  const cols = data.columns ?? [];
  const rows = (data.rows ?? []).slice(0, 8);
  if (cols.length === 0 || rows.length === 0) return null;

  return (
    <View style={styles.tableContainer}>
      {data.title && <Text style={[styles.tableTitle, { color: accentColor }]}>{data.title}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.tableHeaderRow}>
            {cols.slice(0, 5).map((col: any) => (
              <View key={col.key} style={styles.tableCell}>
                <Text style={styles.tableHeaderText}>{col.label ?? col.key}</Text>
              </View>
            ))}
          </View>
          {rows.map((row: any, i: number) => (
            <View key={i} style={[styles.tableRow, i % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
              {cols.slice(0, 5).map((col: any) => (
                <View key={col.key} style={styles.tableCell}>
                  <Text style={styles.tableCellText} numberOfLines={1}>
                    {row[col.key] != null ? String(row[col.key]) : "—"}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      {(data.rows?.length ?? 0) > 8 && (
        <Text style={styles.tableMoreText}>+{(data.rows?.length ?? 0) - 8} more rows</Text>
      )}
    </View>
  );
}

function SlidesDeckCard({ data, accentColor }: { data: { slides?: any[]; title?: string; slideCount?: number }; accentColor: string }) {
  const slides = (data.slides ?? []).slice(0, 3);
  return (
    <View style={styles.deckContainer}>
      <Text style={[styles.deckTitle, { color: accentColor }]}>
        📊 {data.title ?? "Presentation"} ({data.slideCount ?? slides.length} slides)
      </Text>
      {slides.map((slide: any) => (
        <View key={slide.index} style={styles.slideCard}>
          <Text style={styles.slideTitle}>{slide.title}</Text>
          {slide.content?.slice(0, 2).map((point: string, i: number) => (
            <Text key={i} style={styles.slideBullet}>• {point}</Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function ScheduleCard({ data, accentColor }: { data: { result?: any; conflicts?: any[]; recommendations?: string[] }; accentColor: string }) {
  const slots = data.result?.slots ?? [];
  const scheduled = data.result?.scheduled;
  return (
    <View style={styles.scheduleContainer}>
      {scheduled && (
        <View style={[styles.scheduledSlot, { borderColor: accentColor }]}>
          <Text style={[styles.scheduleLabel, { color: accentColor }]}>✅ Scheduled</Text>
          <Text style={styles.scheduleTime}>{new Date(scheduled.start).toLocaleString()}</Text>
        </View>
      )}
      {slots.slice(0, 3).map((slot: any, i: number) => (
        <View key={i} style={styles.slotRow}>
          <Text style={styles.slotScore}>{slot.score}%</Text>
          <Text style={styles.slotTime}>{new Date(slot.start).toLocaleString()}</Text>
        </View>
      ))}
      {(data.recommendations ?? []).slice(0, 2).map((rec: string, i: number) => (
        <Text key={i} style={styles.scheduleRec}>• {rec}</Text>
      ))}
    </View>
  );
}

function GenericResultCard({ data, toolName }: { data: Record<string, unknown>; toolName: string }) {
  const entries = Object.entries(data)
    .filter(([, v]) => typeof v !== "object" || v === null)
    .slice(0, 8);
  return (
    <View style={styles.genericContainer}>
      {entries.map(([key, value]) => (
        <View key={key} style={styles.genericRow}>
          <Text style={styles.genericKey}>{key.replace(/_/g, " ")}</Text>
          <Text style={styles.genericValue} numberOfLines={2}>{String(value ?? "—")}</Text>
        </View>
      ))}
    </View>
  );
}

export function ToolResultCard({ toolName, output, status, accentColor = "#6366f1" }: ToolResultCardProps) {
  const parsed = tryParseJSON(output);
  const isRunning = status === "running";
  const isError = status === "error";

  const toolLabel = toolName
    .replace(/_/g, " ")
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const TOOL_ICONS: Record<string, string> = {
    smart_spreadsheet: "📊",
    presentation_engine: "📋",
    scheduling_engine: "📅",
    email_composer: "📧",
    content_engine: "✍️",
    viz_engine: "📈",
    knowledge_vault: "🧠",
    meeting_intel: "🎙️",
    design_studio: "🎨",
    video_engine: "🎬",
  };
  const icon = TOOL_ICONS[toolName] ?? "⚙️";

  return (
    <View style={[styles.container, isError && styles.containerError]}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>{icon}</Text>
        <Text style={[styles.headerLabel, { color: accentColor }]}>{toolLabel}</Text>
        {isRunning && <Text style={styles.runningBadge}>Running…</Text>}
        {isError && <Text style={styles.errorBadge}>Failed</Text>}
        {status === "done" && <Text style={[styles.doneBadge, { color: accentColor }]}>✓ Done</Text>}
      </View>

      {!isRunning && parsed && !isError && (
        <View style={styles.resultContainer}>
          {(toolName === "smart_spreadsheet" && (parsed.rows || parsed.columns)) ? (
            <DataTableCard data={parsed as any} accentColor={accentColor} />
          ) : (toolName === "presentation_engine" && parsed.slides) ? (
            <SlidesDeckCard data={parsed as any} accentColor={accentColor} />
          ) : (toolName === "scheduling_engine") ? (
            <ScheduleCard data={parsed as any} accentColor={accentColor} />
          ) : (
            <GenericResultCard data={parsed} toolName={toolName} />
          )}
        </View>
      )}

      {isError && (
        <Text style={styles.errorText}>
          {typeof output === "string" ? output : "Tool execution failed"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginVertical: 4,
    overflow: "hidden",
  },
  containerError: {
    borderColor: "rgba(239,68,68,0.3)",
    backgroundColor: "rgba(239,68,68,0.05)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    gap: 8,
  },
  headerIcon: { fontSize: 14 },
  headerLabel: { fontSize: 12, fontWeight: "600", flex: 1 },
  runningBadge: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  errorBadge: {
    fontSize: 10,
    color: "#f87171",
    backgroundColor: "rgba(239,68,68,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  doneBadge: {
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  resultContainer: { padding: 12 },
  errorText: { color: "#f87171", fontSize: 12, padding: 12 },
  tableContainer: { gap: 4 },
  tableTitle: { fontSize: 11, fontWeight: "600", marginBottom: 6 },
  tableHeaderRow: { flexDirection: "row", marginBottom: 4 },
  tableRow: { flexDirection: "row" },
  tableRowEven: { backgroundColor: "rgba(255,255,255,0.02)" },
  tableRowOdd: {},
  tableCell: { width: 100, paddingHorizontal: 4, paddingVertical: 3 },
  tableHeaderText: { color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: "600", textTransform: "uppercase" },
  tableCellText: { color: "rgba(255,255,255,0.8)", fontSize: 11 },
  tableMoreText: { color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 4, textAlign: "right" },
  deckContainer: { gap: 8 },
  deckTitle: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  slideCard: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  slideTitle: { color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: "600", marginBottom: 4 },
  slideBullet: { color: "rgba(255,255,255,0.6)", fontSize: 11, marginLeft: 4 },
  scheduleContainer: { gap: 6 },
  scheduledSlot: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 4 },
  scheduleLabel: { fontSize: 11, fontWeight: "600" },
  scheduleTime: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
  slotRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 2 },
  slotScore: { color: "#34d399", fontSize: 11, fontWeight: "600", width: 30 },
  slotTime: { color: "rgba(255,255,255,0.6)", fontSize: 11 },
  scheduleRec: { color: "rgba(255,255,255,0.5)", fontSize: 10, marginTop: 2 },
  genericContainer: { gap: 6 },
  genericRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  genericKey: { color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "capitalize", flex: 1 },
  genericValue: { color: "rgba(255,255,255,0.8)", fontSize: 11, flex: 1, textAlign: "right" },
});
