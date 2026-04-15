import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState, useEffect, useRef, useMemo } from "react";
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
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { LYTE_COLORS } from "@/constants/colors";
import { useColors } from "@/hooks/useColors";
import { useLyte, Severity, LyteSignal } from "@/context/LyteContext";
import { useLyteWebSocket } from "@/hooks/useLyteWebSocket";
import { useFuzzySearch } from "@szl-holdings/mobile-shared";

const PLATFORMS = ["All", "Aegis", "Vessels", "Terra", "SZL", "Lyte", "API"];
const SEVERITIES = ["All", "Critical", "High", "Medium", "Low"] as const;

const SWIPE_THRESHOLD = 80;
const SWIPE_FULL = 110;

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

type StylesType = ReturnType<typeof makeStyles>;

interface SwipeableSignalCardProps {
  signal: LyteSignal;
  acknowledged: boolean;
  onAcknowledge: (id: string) => void;
  onDismiss: (id: string) => void;
  styles: StylesType;
  colors: ReturnType<typeof useColors>;
}

function SwipeableSignalCard({ signal, acknowledged, onAcknowledge, onDismiss, styles, colors }: SwipeableSignalCardProps) {
  const color = getSeverityColor(signal.severity);
  const pulse = useRef(new Animated.Value(1)).current;
  const translateX = useSharedValue(0);
  const [actionLabel, setActionLabel] = useState<"acknowledge" | "dismiss" | null>(null);

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

  const handleAcknowledge = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAcknowledge(signal.id);
  }, [signal.id, onAcknowledge]);

  const handleDismiss = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDismiss(signal.id);
  }, [signal.id, onDismiss]);

  const updateLabel = (x: number) => {
    if (x > SWIPE_THRESHOLD) setActionLabel("acknowledge");
    else if (x < -SWIPE_THRESHOLD) setActionLabel("dismiss");
    else setActionLabel(null);
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      runOnJS(updateLabel)(e.translationX);
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_FULL) {
        runOnJS(handleAcknowledge)();
      } else if (e.translationX < -SWIPE_FULL) {
        runOnJS(handleDismiss)();
      }
      translateX.value = withSpring(0, { damping: 15 });
      runOnJS(setActionLabel)(null);
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const revealBg = actionLabel === "acknowledge"
    ? "#00ff88"
    : actionLabel === "dismiss"
    ? "#ef4444"
    : "transparent";

  return (
    <View style={styles.swipeContainer}>
      <View style={[styles.swipeReveal, { backgroundColor: revealBg + "20" }]}>
        {actionLabel === "acknowledge" && (
          <View style={styles.revealLeft}>
            <Feather name="check-circle" size={20} color="#00ff88" />
            <Text style={[styles.revealText, { color: "#00ff88" }]}>Acknowledge</Text>
          </View>
        )}
        {actionLabel === "dismiss" && (
          <View style={styles.revealRight}>
            <Text style={[styles.revealText, { color: "#ef4444" }]}>Dismiss</Text>
            <Feather name="x-circle" size={20} color="#ef4444" />
          </View>
        )}
      </View>
      <GestureDetector gesture={panGesture}>
        <Reanimated.View style={[animStyle, styles.swipeCard, { borderLeftColor: color, borderLeftWidth: 3, opacity: acknowledged ? 0.4 : 1 }]}>
          <View style={styles.signalTop}>
            <View style={styles.signalLeft}>
              <Animated.View style={[styles.sevDot, { backgroundColor: color, opacity: pulse }]} />
              <View style={[styles.sevBadge, { backgroundColor: `${color}15`, borderColor: `${color}30` }]}>
                <Text style={[styles.sevText, { color }]}>{signal.severity.toUpperCase()}</Text>
              </View>
              <Text style={styles.signalSource}>{signal.source}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {acknowledged && (
                <View style={styles.ackBadge}>
                  <Feather name="check" size={8} color="#00ff88" />
                  <Text style={styles.ackText}>ACK</Text>
                </View>
              )}
              <Text style={styles.signalTime}>{timeAgo(signal.receivedAt)}</Text>
            </View>
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
            <Text style={[styles.swipeHint, { color: colors.textTertiary }]}>← swipe →</Text>
          </View>
          {signal.correlationReason != null && (
            <View style={styles.correlationRow}>
              <Feather name="link" size={10} color={colors.textTertiary} />
              <Text style={styles.correlationText} numberOfLines={2}>{signal.correlationReason}</Text>
            </View>
          )}
        </Reanimated.View>
      </GestureDetector>
    </View>
  );
}

export default function SignalsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { signals, reload } = useLyte();
  useLyteWebSocket({ onNewSignal: () => reload(), onConnect: reload });
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [platFilter, setPlatFilter] = useState("All");
  const [sevFilter, setSevFilter] = useState<typeof SEVERITIES[number]>("All");
  const [lastUpdatedAt] = useState<Date>(() => new Date());
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    reload();
    await new Promise(r => setTimeout(r, 1000));
    setRefreshing(false);
  }, [reload]);

  const handleAcknowledge = useCallback((id: string) => {
    setAcknowledged(prev => new Set([...prev, id]));
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  }, []);

  const baseSignals = signals.filter(s => !dismissed.has(s.id));
  const fuzzySignals = useFuzzySearch(baseSignals, search, s => [s.title, s.source, s.severity]);
  const filtered = fuzzySignals
    .filter(s => sevFilter === "All" || s.severity === sevFilter.toLowerCase())
    .filter(s => platFilter === "All" || s.source.toLowerCase().includes(platFilter.toLowerCase()))
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
    });

  const critCount = signals.filter(s => s.severity === "critical").length;
  const ackCount = acknowledged.size;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(0,212,255,0.04)", "transparent"]}
        style={[styles.headerGradient, { height: topPad + 130 }]}
      />
      <View style={{ paddingTop: topPad + 16, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <Text style={styles.eyebrow}>SIGNALS FEED</Text>
            <Text style={styles.headerTitle}>Live Signals</Text>
          </View>
          <Text style={{ fontSize: 9, fontFamily: "Inter_400Regular", color: colors.textTertiary, marginTop: 6 }}>
            {(() => {
              const ms = Date.now() - lastUpdatedAt.getTime();
              if (ms < 60000) return "Just now";
              if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
              return `${Math.floor(ms / 3600000)}h ago`;
            })()}
          </Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statText}>{filtered.length} signals</Text>
          {critCount > 0 && (
            <View style={styles.critPill}>
              <View style={[styles.sevDot, { backgroundColor: LYTE_COLORS.critical }]} />
              <Text style={styles.critText}>{critCount} critical</Text>
            </View>
          )}
          {ackCount > 0 && (
            <View style={styles.ackPill}>
              <Feather name="check" size={9} color="#00ff88" />
              <Text style={styles.ackPillText}>{ackCount} ack'd</Text>
            </View>
          )}
        </View>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={16} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search signals..."
              placeholderTextColor={colors.textMuted}
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
        renderItem={({ item }) => (
          <SwipeableSignalCard
            signal={item}
            acknowledged={acknowledged.has(item.id)}
            onAcknowledge={handleAcknowledge}
            onDismiss={handleDismiss}
            styles={styles}
            colors={colors}
          />
        )}
      />
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    headerGradient: { position: "absolute", top: 0, left: 0, right: 0 },
    eyebrow: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 3, color: LYTE_COLORS.electricBlue, marginBottom: 4 },
    headerTitle: { fontSize: 28, fontFamily: "Inter_600SemiBold", color: c.textPrimary, marginBottom: 8 },
    statsRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
    statText: { fontSize: 12, fontFamily: "Inter_400Regular", color: c.textSecondary },
    critPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: LYTE_COLORS.criticalDim },
    critText: { fontSize: 10, fontFamily: "Inter_500Medium", color: LYTE_COLORS.critical },
    ackPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: "rgba(0,255,136,0.08)", borderWidth: 1, borderColor: "rgba(0,255,136,0.2)" },
    ackPillText: { fontSize: 10, fontFamily: "Inter_500Medium", color: "#00ff88" },
    searchRow: { marginBottom: 10 },
    searchBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.surface, borderRadius: 10, borderWidth: 1, borderColor: c.border, paddingHorizontal: 12, paddingVertical: 8 },
    searchInput: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: c.textPrimary },
    filterRow: { gap: 6, paddingRight: 4, marginBottom: 8 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
    filterChipActive: { backgroundColor: LYTE_COLORS.electricBlueDim, borderColor: LYTE_COLORS.electricBlueLight },
    filterText: { fontSize: 11, fontFamily: "Inter_500Medium", color: c.textSecondary },
    filterTextActive: { color: LYTE_COLORS.electricBlue },
    swipeContainer: { position: "relative", borderRadius: 12, overflow: "hidden" },
    swipeReveal: { position: "absolute", inset: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, borderRadius: 12 },
    revealLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    revealRight: { flexDirection: "row", alignItems: "center", gap: 8, marginLeft: "auto" },
    revealText: { fontSize: 13, fontWeight: "600" },
    swipeCard: { backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 14, gap: 8 },
    signalTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    signalLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    sevDot: { width: 7, height: 7, borderRadius: 4 },
    sevBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
    sevText: { fontSize: 8, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
    signalSource: { fontSize: 10, fontFamily: "Inter_400Regular", color: c.textSecondary },
    signalTime: { fontSize: 10, fontFamily: "Inter_400Regular", color: c.textTertiary },
    signalTitle: { fontSize: 13, fontFamily: "Inter_500Medium", color: c.textPrimary, lineHeight: 18 },
    signalBody: { fontSize: 11, fontFamily: "Inter_400Regular", color: c.textSecondary, lineHeight: 16 },
    signalFooter: { flexDirection: "row", alignItems: "center", gap: 8 },
    statusChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    statusText: { fontSize: 9, fontFamily: "Inter_500Medium" },
    recAction: { flex: 1, fontSize: 10, fontFamily: "Inter_400Regular", color: c.textTertiary },
    swipeHint: { fontSize: 8, fontFamily: "Inter_400Regular" },
    ackBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, backgroundColor: "rgba(0,255,136,0.1)" },
    ackText: { fontSize: 7, fontFamily: "Inter_600SemiBold", color: "#00ff88", letterSpacing: 0.5 },
    correlationRow: { flexDirection: "row", alignItems: "flex-start", gap: 5, paddingTop: 4 },
    correlationText: { flex: 1, fontSize: 10, fontFamily: "Inter_400Regular", color: c.textTertiary, fontStyle: "italic" },
    empty: { paddingTop: 60, alignItems: "center" },
    emptyTitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: c.textSecondary },
  });
}
