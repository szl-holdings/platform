import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LYTE_COLORS } from "@/constants/colors";
import { useLyte, Severity, LyteSignal } from "@/context/LyteContext";

const PLATFORMS = ["All", "Aegis", "Vessels", "Terra", "SZL", "Lyte", "API"];
const SEVERITIES = ["All", "Critical", "High", "Medium", "Low"] as const;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  return hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d`;
}

function getSeverityColor(sev: Severity) {
  const map = {
    critical: LYTE_COLORS.critical,
    high: LYTE_COLORS.high,
    medium: LYTE_COLORS.medium,
    low: LYTE_COLORS.low,
    info: LYTE_COLORS.electricBlue,
  };
  return map[sev] ?? LYTE_COLORS.low;
}

function SignalCard({ signal }: { signal: LyteSignal }) {
  const color = getSeverityColor(signal.severity);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (signal.severity !== "critical") return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [signal.severity]);

  return (
    <View style={[styles.signalCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <View style={styles.signalTop}>
        <View style={styles.signalLeft}>
          <Animated.View style={[styles.sevDot, { backgroundColor: color, opacity: pulse }]} />
          <View style={[styles.sevBadge, { backgroundColor: `${color}15`, borderColor: `${color}30` }]}>
            <Text style={[styles.sevText, { color }]}>{signal.severity.toUpperCase()}</Text>
          </View>
          <Text style={styles.signalSource}>{signal.source}</Text>
        </View>
        <Text style={styles.signalTime}>{timeAgo(signal.receivedAt)}</Text>
      </View>
      <Text style={styles.signalTitle}>{signal.title}</Text>
      {signal.body ? (
        <Text style={styles.signalBody} numberOfLines={2}>{signal.body}</Text>
      ) : null}
      <View style={styles.signalFooter}>
        <View style={[styles.statusChip, { backgroundColor: signal.status === "new" ? "rgba(255,59,92,0.1)" : "rgba(0,255,136,0.08)" }]}>
          <Text style={[styles.statusText, { color: signal.status === "new" ? LYTE_COLORS.critical : LYTE_COLORS.neonGreen }]}>
            {signal.status}
          </Text>
        </View>
        {(signal.recommendedAction ?? (signal.metadata?.recommendedAction as string | undefined)) && (
          <Text style={styles.recAction} numberOfLines={1}>
            → {signal.recommendedAction ?? (signal.metadata?.recommendedAction as string | undefined)}
          </Text>
        )}
      </View>
      {signal.correlationReason != null && (
        <View style={styles.correlationRow}>
          <Feather name="link" size={10} color={LYTE_COLORS.textTertiary} />
          <Text style={styles.correlationText} numberOfLines={2}>{signal.correlationReason}</Text>
        </View>
      )}
    </View>
  );
}

export default function SignalsScreen() {
  const insets = useSafeAreaInsets();
  const { signals, reload } = useLyte();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [platFilter, setPlatFilter] = useState("All");
  const [sevFilter, setSevFilter] = useState<typeof SEVERITIES[number]>("All");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    reload();
    await new Promise(r => setTimeout(r, 1000));
    setRefreshing(false);
  }, [reload]);

  const filtered = signals
    .filter(s => sevFilter === "All" || s.severity === sevFilter.toLowerCase())
    .filter(s => platFilter === "All" || s.source.toLowerCase().includes(platFilter.toLowerCase()))
    .filter(s => search === "" || s.title.toLowerCase().includes(search.toLowerCase()) || s.source.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
    });

  const critCount = signals.filter(s => s.severity === "critical").length;

  return (
    <View style={[styles.container, { backgroundColor: LYTE_COLORS.background }]}>
      <LinearGradient
        colors={["rgba(0,212,255,0.04)", "transparent"]}
        style={[styles.headerGradient, { height: topPad + 130 }]}
      />
      <View style={{ paddingTop: topPad + 16, paddingHorizontal: 16 }}>
        <Text style={styles.eyebrow}>SIGNALS FEED</Text>
        <Text style={styles.headerTitle}>Live Signals</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statText}>{filtered.length} signals</Text>
          {critCount > 0 && (
            <View style={styles.critPill}>
              <View style={[styles.sevDot, { backgroundColor: LYTE_COLORS.critical }]} />
              <Text style={styles.critText}>{critCount} critical</Text>
            </View>
          )}
        </View>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={16} color={LYTE_COLORS.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search signals..."
              placeholderTextColor={LYTE_COLORS.textMuted}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
          </View>
        </View>
        <FlatList
          data={SEVERITIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={i => i}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.filterChip, sevFilter === item && styles.filterChipActive]}
              onPress={() => { Haptics.selectionAsync(); setSevFilter(item); }}
            >
              <Text style={[styles.filterText, sevFilter === item && styles.filterTextActive]}>{item}</Text>
            </Pressable>
          )}
        />
        <FlatList
          data={PLATFORMS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={i => i}
          contentContainerStyle={[styles.filterRow, { marginBottom: 0 }]}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.filterChip, platFilter === item && styles.filterChipActive]}
              onPress={() => { Haptics.selectionAsync(); setPlatFilter(item); }}
            >
              <Text style={[styles.filterText, platFilter === item && styles.filterTextActive]}>{item}</Text>
            </Pressable>
          )}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={s => s.id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: bottomPad, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={LYTE_COLORS.electricBlue} />}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No signals match filters</Text>
          </View>
        )}
        renderItem={({ item }) => <SignalCard signal={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0 },
  eyebrow: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 3, color: LYTE_COLORS.electricBlue, marginBottom: 4 },
  headerTitle: { fontSize: 28, fontFamily: "Inter_600SemiBold", color: LYTE_COLORS.textPrimary, marginBottom: 8 },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  statText: { fontSize: 12, fontFamily: "Inter_400Regular", color: LYTE_COLORS.textSecondary },
  critPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: LYTE_COLORS.criticalDim },
  critText: { fontSize: 10, fontFamily: "Inter_500Medium", color: LYTE_COLORS.critical },
  searchRow: { marginBottom: 10 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: LYTE_COLORS.surface, borderRadius: 10, borderWidth: 1, borderColor: LYTE_COLORS.border, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: LYTE_COLORS.textPrimary },
  filterRow: { gap: 6, paddingRight: 4, marginBottom: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: LYTE_COLORS.surface, borderWidth: 1, borderColor: LYTE_COLORS.border },
  filterChipActive: { backgroundColor: LYTE_COLORS.electricBlueDim, borderColor: LYTE_COLORS.electricBlueLight },
  filterText: { fontSize: 11, fontFamily: "Inter_500Medium", color: LYTE_COLORS.textSecondary },
  filterTextActive: { color: LYTE_COLORS.electricBlue },
  signalCard: { backgroundColor: LYTE_COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: LYTE_COLORS.border, padding: 14, gap: 8 },
  signalTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  signalLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  sevDot: { width: 7, height: 7, borderRadius: 4 },
  sevBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  sevText: { fontSize: 8, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  signalSource: { fontSize: 10, fontFamily: "Inter_400Regular", color: LYTE_COLORS.textSecondary },
  signalTime: { fontSize: 10, fontFamily: "Inter_400Regular", color: LYTE_COLORS.textTertiary },
  signalTitle: { fontSize: 13, fontFamily: "Inter_500Medium", color: LYTE_COLORS.textPrimary, lineHeight: 18 },
  signalBody: { fontSize: 11, fontFamily: "Inter_400Regular", color: LYTE_COLORS.textSecondary, lineHeight: 16 },
  signalFooter: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 9, fontFamily: "Inter_500Medium" },
  recAction: { flex: 1, fontSize: 10, fontFamily: "Inter_400Regular", color: LYTE_COLORS.textTertiary },
  correlationRow: { flexDirection: "row", alignItems: "flex-start", gap: 5, paddingTop: 4 },
  correlationText: { flex: 1, fontSize: 10, fontFamily: "Inter_400Regular", color: LYTE_COLORS.textTertiary, fontStyle: "italic" },
  empty: { paddingTop: 60, alignItems: "center" },
  emptyTitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: LYTE_COLORS.textSecondary },
});
