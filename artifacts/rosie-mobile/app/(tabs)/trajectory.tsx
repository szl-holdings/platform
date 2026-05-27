import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { useColors } from "@/hooks/useColors";

const API_ROOT = (() => {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}/api` : "http://localhost:5000/api";
})();

type TrajectoryPoint = { t: number; x: number; y: number; vx: number; vy: number };
type DetectedPeak = { index: number; prominence: number; snRatio: number };
type Telemetry = { t: number; altitude: number; speed: number; inGeofence: boolean };

type OversightResponse = {
  data: {
    verdict: "auto-cleared" | "requires-hitl";
    trajectory: TrajectoryPoint[];
    telemetry: Telemetry[];
    peaks: { detected: DetectedPeak[]; crossConfirmedCount: number; timeR1PeakBucket: number };
    pipeline: { pipelineId: string; stages: { stageName: string; stageOrdinal: number; outputsHash: string }[] };
  };
};

const W = 320;
const H = 220;

export default function TrajectoryScreen() {
  const colors = useColors();
  const [seed, setSeed] = useState("7");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OversightResponse["data"] | null>(null);

  const run = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_ROOT}/rosie/demos/drone-oversight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: Number(seed) || 7, scenario: "default-perimeter" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: OversightResponse = await res.json();
      setResult(json.data);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }, [seed]);

  const path = result?.trajectory.length
    ? (() => {
        const xs = result.trajectory.map((p) => p.x);
        const ys = result.trajectory.map((p) => p.y);
        const xMin = Math.min(...xs);
        const xMax = Math.max(...xs);
        const yMin = Math.min(...ys);
        const yMax = Math.max(...ys);
        const sx = (x: number) => ((x - xMin) / Math.max(0.001, xMax - xMin)) * (W - 20) + 10;
        const sy = (y: number) => H - 10 - ((y - yMin) / Math.max(0.001, yMax - yMin)) * (H - 20);
        return result.trajectory.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
      })()
    : "";

  const peakSet = new Set(result?.peaks.detected.map((p) => p.index) ?? []);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: colors.foreground }]}>Drone trajectory</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Verlet sim · peak-detector cross-opinion · sequence-pipeline trace
      </Text>

      <View style={styles.row}>
        <TextInput
          accessibilityLabel="seed"
          value={seed}
          onChangeText={setSeed}
          keyboardType="numeric"
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card },
          ]}
        />
        <TouchableOpacity
          onPress={run}
          disabled={busy}
          style={[styles.button, { backgroundColor: colors.primary, opacity: busy ? 0.5 : 1 }]}
        >
          <Text style={{ color: colors.primaryForeground, fontWeight: "600" }}>
            {busy ? "running…" : "run"}
          </Text>
        </TouchableOpacity>
      </View>

      {busy ? <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} /> : null}
      {error ? <Text style={{ color: colors.destructive, marginTop: 8 }}>{error}</Text> : null}

      {result ? (
        <>
          <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.cardLabel, { color: colors.primary }]}>
              verdict · {result.verdict}
            </Text>
            <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
              <Path d={path} stroke={colors.primary} strokeWidth={1.5} fill="none" />
              {result.trajectory.map((p, i) => {
                const breach = result.telemetry[i] && !result.telemetry[i].inGeofence;
                const peak = peakSet.has(i);
                if (!breach && !peak) return null;
                const xs = result.trajectory.map((q) => q.x);
                const ys = result.trajectory.map((q) => q.y);
                const cx = ((p.x - Math.min(...xs)) / Math.max(0.001, Math.max(...xs) - Math.min(...xs))) * (W - 20) + 10;
                const cy = H - 10 - ((p.y - Math.min(...ys)) / Math.max(0.001, Math.max(...ys) - Math.min(...ys))) * (H - 20);
                return (
                  <Circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r={peak ? 4 : 2.5}
                    fill={peak ? "#facc15" : colors.destructive}
                  />
                );
              })}
            </Svg>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 6 }}>
              red = geofence breach · yellow = peak-detector hit
            </Text>
          </View>

          <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.cardLabel, { color: colors.primary }]}>peak-detector</Text>
            <Text style={{ color: colors.foreground, fontSize: 14 }}>
              {result.peaks.detected.length} peaks · {result.peaks.crossConfirmedCount} confirm Time-R1 bucket{" "}
              {result.peaks.timeR1PeakBucket}
            </Text>
          </View>

          <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.cardLabel, { color: colors.primary }]}>
              pipeline trace · {result.pipeline.stages.length} stages
            </Text>
            {result.pipeline.stages.map((s) => (
              <Text
                key={s.stageOrdinal}
                style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: "monospace" }}
              >
                {String(s.stageOrdinal + 1).padStart(2, "0")} · {s.stageName} → {s.outputsHash.slice(0, 10)}
              </Text>
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 120, gap: 12 },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: -4 },
  row: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, width: 100 },
  button: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  card: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12 },
  cardLabel: { fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, fontFamily: "monospace" },
});
