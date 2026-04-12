import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { useColors } from "@/hooks/useColors";
import { useIncidentSubscription } from "@/hooks/useGraphQL";
import { apiGet, apiPut } from "@/lib/apiClient";
import { RedAlertOverlay } from "@/components/RedAlertOverlay";
import { SecureComms } from "@/components/SecureComms";
import { VoiceCommandOverlay } from "@/components/VoiceCommandOverlay";
import { CommandPalette, type CommandItem } from "@/components/CommandPalette";
import { useShakeGesture } from "@/hooks/useShakeGesture";

interface Incident {
  id: number;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: string;
  assignedAnalyst?: string;
  attackTechnique?: string;
  affectedAsset?: string;
  detectedAt?: string;
  updatedAt?: string;
}

type IncidentUpdate = Partial<Pick<Incident, "status" | "severity" | "assignedAnalyst">>;

async function fetchIncidents(): Promise<Incident[]> {
  return apiGet<Incident[]>("/api/firestorm/incidents");
}

async function updateIncident(id: number, data: IncidentUpdate): Promise<Incident> {
  return apiPut<Incident>(`/api/firestorm/incidents/${id}`, data);
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#F59E0B",
  low: "#3B82F6",
};

const STATUS_ORDER = ["detection", "triage", "investigation", "containment", "remediation", "closed"];

interface SwipeableIncidentCardProps {
  incident: Incident;
  selected: boolean;
  bulkMode: boolean;
  onAcknowledge: (id: number) => void;
  onEscalate: (id: number) => void;
  onAssign: (id: number) => void;
  onDismiss: (id: number) => void;
  onPress: (incident: Incident) => void;
  onLongPress: (id: number) => void;
  colors: ReturnType<typeof useColors>;
}

function SwipeableIncidentCard({
  incident, selected, bulkMode,
  onAcknowledge, onEscalate, onAssign, onDismiss, onPress, onLongPress, colors,
}: SwipeableIncidentCardProps) {
  const translateX = useSharedValue(0);
  const THRESHOLD = 80;

  const handleAck = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAcknowledge(incident.id);
  };
  const handleEsc = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onEscalate(incident.id);
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = Math.max(-200, Math.min(0, e.translationX));
    })
    .onEnd(() => {
      if (translateX.value < -THRESHOLD) {
        translateX.value = withSpring(-160);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const sevColor = SEVERITY_COLORS[incident.severity] ?? colors.mutedForeground;
  const isCritical = incident.severity === "critical";

  return (
    <View style={{ marginBottom: 8, overflow: "hidden" }}>
      <View style={[styles.swipeActions, { backgroundColor: colors.navySurface }]}>
        <TouchableOpacity style={[styles.swipeActionBtn, { backgroundColor: colors.emeraldDim }]} onPress={handleAck}>
          <Ionicons name="checkmark-circle" size={18} color={colors.emerald} />
          <Text style={[styles.swipeActionText, { color: colors.emerald }]}>ACK</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.swipeActionBtn, { backgroundColor: colors.amberDim }]} onPress={() => onAssign(incident.id)}>
          <Ionicons name="person-add" size={18} color={colors.amber} />
          <Text style={[styles.swipeActionText, { color: colors.amber }]}>ASSIGN</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.swipeActionBtn, { backgroundColor: colors.redDim }]} onPress={handleEsc}>
          <Ionicons name="arrow-up-circle" size={18} color={colors.red} />
          <Text style={[styles.swipeActionText, { color: colors.red }]}>ESC</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.swipeActionBtn, { backgroundColor: colors.border }]} onPress={() => onDismiss(incident.id)}>
          <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
          <Text style={[styles.swipeActionText, { color: colors.mutedForeground }]}>DISMISS</Text>
        </TouchableOpacity>
      </View>
      <GestureDetector gesture={pan}>
        <Animated.View style={cardStyle}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => bulkMode ? onLongPress(incident.id) : onPress(incident)}
            onLongPress={() => onLongPress(incident.id)}
            style={[
              styles.incidentCard,
              { backgroundColor: colors.navyLight, borderColor: selected ? colors.amber : isCritical ? colors.redBorder : colors.border },
              selected && { borderWidth: 1.5 },
            ]}
          >
            {bulkMode && (
              <View style={[styles.checkBox, { borderColor: selected ? colors.amber : colors.border, backgroundColor: selected ? colors.amber : "transparent" }]}>
                {selected && <Ionicons name="checkmark" size={12} color={colors.background} />}
              </View>
            )}
            <View style={[styles.sevBar, { backgroundColor: sevColor }]} />
            <View style={{ flex: 1, paddingLeft: 12 }}>
              <View style={styles.cardTop}>
                <View style={[styles.sevBadge, { backgroundColor: `${sevColor}18` }]}>
                  <Text style={[styles.sevBadgeText, { color: sevColor }]}>{incident.severity?.toUpperCase()}</Text>
                </View>
                <Text style={[styles.statusText, { color: colors.mutedForeground }]}>{incident.status}</Text>
              </View>
              <Text style={[styles.incTitle, { color: colors.foreground, fontFamily: "Inter_500Medium" }]} numberOfLines={2}>
                {incident.title}
              </Text>
              <View style={styles.cardMeta}>
                {incident.assignedAnalyst && (
                  <View style={styles.metaRow}>
                    <Feather name="user" size={11} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{incident.assignedAnalyst}</Text>
                  </View>
                )}
                {incident.affectedAsset && (
                  <View style={styles.metaRow}>
                    <Feather name="server" size={11} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>{incident.affectedAsset}</Text>
                  </View>
                )}
                {incident.attackTechnique && (
                  <View style={[styles.techBadge, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.techText, { color: colors.amber }]}>{incident.attackTechnique}</Text>
                  </View>
                )}
                <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
                  {incident.detectedAt ? new Date(incident.detectedAt).toLocaleDateString() : "—"}
                </Text>
              </View>
            </View>
            {!bulkMode && <Feather name="chevron-right" size={16} color={colors.mutedForeground} style={{ alignSelf: "center" }} />}
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const ANALYSTS = ["Alice Chen", "Marcus Webb", "Priya Nair", "Jordan Smith", "Devon Okafor"];

export default function IncidentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [redAlertVisible, setRedAlertVisible] = useState(false);
  const [redAlertIncident, setRedAlertIncident] = useState<Incident | null>(null);
  const [commsVisible, setCommsVisible] = useState(false);
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [paletteVisible, setPaletteVisible] = useState(false);
  useIncidentSubscription();

  const { data: incidents = [], refetch, isLoading } = useQuery<Incident[]>({
    queryKey: ["aegis-incidents"],
    queryFn: fetchIncidents,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: IncidentUpdate }) => updateIncident(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aegis-incidents"] }),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAcknowledge = (id: number) => {
    const inc = incidents.find((i) => i.id === id);
    if (!inc) return;
    const idx = STATUS_ORDER.indexOf(inc.status);
    if (idx < STATUS_ORDER.length - 1) {
      updateMut.mutate({ id, data: { status: STATUS_ORDER[idx + 1] } });
    }
  };

  const handleEscalate = (id: number) => {
    Alert.alert("Escalate Incident", "Escalate this incident to critical priority?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Escalate",
        style: "destructive",
        onPress: () => updateMut.mutate({ id, data: { severity: "critical" } }),
      },
    ]);
  };

  const handleAssign = (id: number) => {
    Alert.alert(
      "Assign Incident",
      "Select analyst to assign:",
      [
        ...ANALYSTS.map((analyst) => ({
          text: analyst,
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            updateMut.mutate({ id, data: { assignedAnalyst: analyst } });
          },
        })),
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const handleDismiss = (id: number) => {
    Alert.alert("Dismiss Incident", "Mark this incident as closed?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Dismiss",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          updateMut.mutate({ id, data: { status: "closed" } });
        },
      },
    ]);
  };

  const handleLongPress = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!bulkMode) {
      setBulkMode(true);
      setSelected(new Set([id]));
    } else {
      const next = new Set(selected);
      if (next.has(id)) next.delete(id); else next.add(id);
      setSelected(next);
    }
  };

  const exitBulkMode = () => {
    setBulkMode(false);
    setSelected(new Set());
  };

  const bulkAcknowledge = () => {
    selected.forEach((id) => handleAcknowledge(id));
    exitBulkMode();
  };

  const bulkDismiss = () => {
    Alert.alert("Dismiss Selected", `Close ${selected.size} incident(s)?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Dismiss All",
        style: "destructive",
        onPress: () => {
          selected.forEach((id) => updateMut.mutate({ id, data: { status: "closed" } }));
          exitBulkMode();
        },
      },
    ]);
  };

  const bulkAssign = () => {
    Alert.alert(
      "Assign Selected",
      `Assign ${selected.size} incident(s) to:`,
      [
        ...ANALYSTS.map((analyst) => ({
          text: analyst,
          onPress: () => {
            selected.forEach((id) => updateMut.mutate({ id, data: { assignedAnalyst: analyst } }));
            exitBulkMode();
          },
        })),
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  useShakeGesture({ onShake: () => setPaletteVisible(true) });

  const criticalIncidents = incidents.filter((i) => i.severity === "critical" && i.status !== "closed");

  const triggerRedAlert = useCallback((inc: Incident) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }
    setRedAlertIncident(inc);
    setRedAlertVisible(true);
  }, []);

  const paletteCommands: CommandItem[] = [
    { id: "redalert", label: "Red Alert Mode", subtitle: criticalIncidents.length > 0 ? `${criticalIncidents.length} critical incidents` : "No critical incidents", icon: "alert-octagon", tags: ["red", "alert", "critical"], action: () => { if (criticalIncidents[0]) triggerRedAlert(criticalIncidents[0]); } },
    { id: "comms", label: "Secure Comms", subtitle: "Open IR team channel", icon: "message-square", tags: ["comms", "secure", "channel"], action: () => setCommsVisible(true) },
    { id: "voice", label: "Voice Command", subtitle: "Speak a command", icon: "mic", tags: ["voice"], action: () => setVoiceVisible(true) },
    { id: "filter-critical", label: "Filter: Critical", icon: "filter", tags: ["filter", "critical"], action: () => setSeverityFilter("critical") },
    { id: "filter-all", label: "Show All Incidents", icon: "list", tags: ["filter", "all"], action: () => setSeverityFilter("all") },
  ];

  const filtered = incidents.filter((i) => {
    const matchSearch = !search || i.title?.toLowerCase().includes(search.toLowerCase());
    const matchSev = severityFilter === "all" || i.severity === severityFilter;
    return matchSearch && matchSev;
  });

  const topInsets = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInsets = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInsets + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {bulkMode ? (
          <>
            <TouchableOpacity onPress={exitBulkMode} style={styles.cancelBtn}>
              <Ionicons name="close" size={20} color={colors.mutedForeground} />
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.bulkCount, { color: colors.amber, fontFamily: "SpaceGrotesk_700Bold" }]}>
              {selected.size} selected
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "SpaceGrotesk_700Bold" }]}>Incidents</Text>
            <View style={[styles.liveChip, { backgroundColor: colors.redDim, borderColor: colors.redBorder }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.red }]} />
              <Text style={[styles.liveText, { color: colors.red }]}>REALTIME</Text>
            </View>
          </>
        )}
      </View>

      {bulkMode && selected.size > 0 && (
        <View style={[styles.bulkBar, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.bulkBtn, { backgroundColor: colors.emeraldDim }]} onPress={bulkAcknowledge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.emerald} />
            <Text style={[styles.bulkBtnText, { color: colors.emerald }]}>ACK All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.bulkBtn, { backgroundColor: colors.amberDim }]} onPress={bulkAssign}>
            <Ionicons name="person-add" size={16} color={colors.amber} />
            <Text style={[styles.bulkBtnText, { color: colors.amber }]}>Assign All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.bulkBtn, { backgroundColor: colors.redDim }]} onPress={bulkDismiss}>
            <Ionicons name="trash" size={16} color={colors.red} />
            <Text style={[styles.bulkBtnText, { color: colors.red }]}>Dismiss All</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.searchBar, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
          placeholder="Search incidents..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterBar}>
        {["all", "critical", "high", "medium", "low"].map((sev) => {
          const active = severityFilter === sev;
          const sevColor = sev === "all" ? colors.amber : SEVERITY_COLORS[sev] ?? colors.amber;
          return (
            <TouchableOpacity
              key={sev}
              style={[styles.filterChip, { backgroundColor: active ? `${sevColor}20` : colors.navyLight, borderColor: active ? `${sevColor}50` : colors.border }]}
              onPress={() => setSeverityFilter(sev)}
            >
              <Text style={[styles.filterText, { color: active ? sevColor : colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                {sev.charAt(0).toUpperCase() + sev.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.amber} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomInsets + 100 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={filtered.length > 0}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amber} />}
          ListEmptyComponent={
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <Ionicons name="shield-checkmark" size={32} color={colors.emerald} />
              <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                {search ? "No matching incidents" : "No incidents"}
              </Text>
              <Text style={[styles.emptyBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Long-press a card to enter bulk triage mode
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <SwipeableIncidentCard
              incident={item}
              selected={selected.has(item.id)}
              bulkMode={bulkMode}
              onAcknowledge={handleAcknowledge}
              onEscalate={handleEscalate}
              onAssign={handleAssign}
              onDismiss={handleDismiss}
              onPress={(inc) => router.push(`/incident/${inc.id}`)}
              onLongPress={handleLongPress}
              colors={colors}
            />
          )}
        />
      )}

      <View style={incidentStyles.floatingBar}>
        {criticalIncidents.length > 0 && (
          <Pressable
            style={incidentStyles.redAlertBtn}
            onPress={() => triggerRedAlert(criticalIncidents[0])}
          >
            <Feather name="alert-octagon" size={16} color="#fff" />
            <Text style={incidentStyles.redAlertBtnText}>Red Alert</Text>
            <View style={incidentStyles.redAlertCount}>
              <Text style={incidentStyles.redAlertCountText}>{criticalIncidents.length}</Text>
            </View>
          </Pressable>
        )}
        <Pressable style={incidentStyles.commsBtn} onPress={() => setCommsVisible(true)}>
          <Feather name="message-square" size={16} color="#ef4444" />
        </Pressable>
        <Pressable style={incidentStyles.micBtn} onPress={() => setVoiceVisible(true)}>
          <Feather name="mic" size={16} color="#6366f1" />
        </Pressable>
        <Pressable style={incidentStyles.paletteBtn} onPress={() => setPaletteVisible(true)}>
          <Feather name="command" size={16} color="#6366f1" />
        </Pressable>
      </View>

      <RedAlertOverlay
        visible={redAlertVisible}
        incident={redAlertIncident}
        onDismiss={() => setRedAlertVisible(false)}
        onAcknowledge={() => {
          if (redAlertIncident) handleAcknowledge(redAlertIncident.id);
          setRedAlertVisible(false);
        }}
        onEscalate={() => {
          if (redAlertIncident) handleEscalate(redAlertIncident.id);
          setRedAlertVisible(false);
        }}
        onContain={() => {
          if (redAlertIncident) updateMut.mutate({ id: redAlertIncident.id, data: { status: "containment" } });
          setRedAlertVisible(false);
        }}
      />

      <SecureComms
        visible={commsVisible}
        onClose={() => setCommsVisible(false)}
        incidentId={redAlertIncident?.id}
      />

      <VoiceCommandOverlay
        visible={voiceVisible}
        onClose={() => setVoiceVisible(false)}
        onCommand={(text) => {
          const lower = text.toLowerCase();
          if (lower.includes("critical")) setSeverityFilter("critical");
          else if (lower.includes("all")) setSeverityFilter("all");
          else if (lower.includes("red") || lower.includes("alert")) {
            if (criticalIncidents[0]) triggerRedAlert(criticalIncidents[0]);
          } else if (lower.includes("comms") || lower.includes("channel")) {
            setCommsVisible(true);
          }
        }}
        appName="Aegis"
        accentColor="#ef4444"
        suggestions={["Show critical incidents", "Open secure comms", "Red alert mode", "Filter all incidents"]}
      />

      <CommandPalette
        visible={paletteVisible}
        onClose={() => setPaletteVisible(false)}
        commands={paletteCommands}
        accentColor="#ef4444"
        placeholder="Search Aegis commands…"
      />
    </View>
  );
}

const incidentStyles = StyleSheet.create({
  floatingBar: {
    position: "absolute",
    bottom: 90,
    right: 16,
    flexDirection: "column",
    gap: 8,
    alignItems: "center",
  },
  redAlertBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ef4444",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  redAlertBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  redAlertCount: {
    backgroundColor: "#fff",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  redAlertCountText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#ef4444",
  },
  commsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(99,102,241,0.1)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  paletteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(99,102,241,0.1)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22 },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 16,
    marginBottom: 0,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 11 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  swipeActions: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    overflow: "hidden",
  },
  swipeActionBtn: {
    width: 60,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  swipeActionText: { fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  incidentCard: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  sevBar: { width: 3, minHeight: 72 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  sevBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  sevBadgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5, fontFamily: "Inter_600SemiBold" },
  statusText: { fontSize: 11, textTransform: "capitalize", fontFamily: "Inter_400Regular" },
  incTitle: { fontSize: 14, lineHeight: 20 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 11 },
  techBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  techText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  timeText: { fontSize: 11 },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 8,
  },
  emptyTitle: { fontSize: 16 },
  emptyBody: { fontSize: 13, textAlign: "center" },
  cancelBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  cancelText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  bulkCount: { fontSize: 16 },
  bulkBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  bulkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  bulkBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    alignSelf: "center",
  },
});
