/**
 * ROSIE Mobile · Jarvis — single-call ecosystem overview.
 *
 * Mirrors the web /jarvis surface but laid out for a phone: vertical
 * stack of slice cards backed by /api/rosie/jarvis/overview. Each card
 * shows status (ok / degraded) plus the slice's KPIs.
 *
 * Refresh: 30s auto-poll + pull-to-refresh. No SSE on mobile (cheap
 * snapshot endpoint is enough; the chain stream lives on the web).
 */

import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

const API_ROOT = (() => {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}/api` : "/api";
})();

interface SliceOK<T> { status: "ok"; data: T; fetchedInMs: number }
interface SliceDegraded { status: "degraded"; error: string; fetchedInMs: number }
type Slice<T> = SliceOK<T> | SliceDegraded;

interface Overview {
  asOf: string;
  schemaVersion: string;
  totals: {
    receipts: number;
    sealedLast24h: number;
    openIncidents: number;
    alertsLast24h: number;
    activeFleets: number;
    vesselCount: number;
    bundleCount: number;
  };
  ecosystem: {
    vessels: Slice<{ vesselCount: number; fleetCount: number; voyageCount: number; openExceptions: number }>;
    a11oy: Slice<{ proofPackets: number; executionTraces: number }>;
    sentra: Slice<{ totalAlerts: number; totalIncidents: number; alertsLast24h: number }>;
    conduit: Slice<{ syncCount: number; recentRuns: Array<{ id: string; status: string | null; startedAt: string }> }>;
    uds: Slice<{ bundleCount: number; slugs: string[] }>;
    proofChain: Slice<{
      totalReceipts: number;
      sealedLast24h: number;
      head: { product: string; kind: string; summary: string | null } | null;
    }>;
  };
}

async function fetchOverview(signal: AbortSignal): Promise<Overview> {
  const res = await fetch(`${API_ROOT}/rosie/jarvis/overview`, { signal });
  if (!res.ok) throw new Error(`overview ${res.status}`);
  const json = await res.json();
  return (json && typeof json === "object" && "success" in json ? json.data : json) as Overview;
}

export default function JarvisScreen() {
  const colors = useColors();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const ctl = signal ?? new AbortController().signal;
      const o = await fetchOverview(ctl);
      setOverview(o);
      setError(null);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const ctl = new AbortController();
    void load(ctl.signal);
    const id = setInterval(() => void load(), 30_000);
    return () => {
      ctl.abort();
      clearInterval(id);
    };
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const t = overview?.totals;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={[styles.h1, { color: colors.foreground }]}>Jarvis</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        Governed command surface · live snapshot every 30s
      </Text>

      {loading && !overview ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error && !overview ? (
        <View style={[styles.card, { borderColor: colors.destructive, backgroundColor: colors.background }]}>
          <Text style={{ color: colors.destructive, fontSize: 13 }}>
            Overview unavailable: {error}
          </Text>
        </View>
      ) : overview ? (
        <>
          <View style={styles.kpiRow}>
            <Kpi label="Receipts" value={t!.receipts.toLocaleString()} sub={`+${t!.sealedLast24h} / 24h`} />
            <Kpi label="Vessels" value={t!.vesselCount.toLocaleString()} sub={`${t!.activeFleets} fleets`} />
          </View>
          <View style={styles.kpiRow}>
            <Kpi label="Incidents" value={t!.openIncidents.toLocaleString()} sub={`${t!.alertsLast24h} alerts/24h`} />
            <Kpi label="UDS bundles" value={t!.bundleCount.toLocaleString()} sub="cosigned" />
          </View>

          <Slice title="Vessels — Maritime" s={overview.ecosystem.vessels} render={(d) => [
            ["Vessels", d.vesselCount],
            ["Fleets", d.fleetCount],
            ["Voyages", d.voyageCount],
            ["Open exceptions", d.openExceptions],
          ]} />
          <Slice title="A11oy — Brand Orchestration" s={overview.ecosystem.a11oy} render={(d) => [
            ["Proof packets", d.proofPackets],
            ["Execution traces", d.executionTraces],
          ]} />
          <Slice title="Sentra — Cyber" s={overview.ecosystem.sentra} render={(d) => [
            ["Total alerts", d.totalAlerts],
            ["Alerts (24h)", d.alertsLast24h],
            ["Open incidents", d.totalIncidents],
          ]} />
          <Slice title="Conduit — Ouroboros" s={overview.ecosystem.conduit} render={(d) => [
            ["Syncs", d.syncCount],
            ["Recent runs", d.recentRuns.length],
          ]} />
          <Slice title="UDS Fleet" s={overview.ecosystem.uds} render={(d) => [
            ["Bundles", d.bundleCount],
            ["Slugs", d.slugs.join(" · ")],
          ]} />
          <Slice title="Proof Chain" s={overview.ecosystem.proofChain} render={(d) => [
            ["Total receipts", d.totalReceipts],
            ["Sealed (24h)", d.sealedLast24h],
            ["Head", d.head ? `${d.head.product}/${d.head.kind}` : "—"],
          ]} />

          <Text style={[styles.asOf, { color: colors.mutedForeground }]}>
            As of {new Date(overview.asOf).toLocaleTimeString()} · schema v{overview.schemaVersion}
          </Text>
        </>
      ) : null}
    </ScrollView>
  );

  function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
    return (
      <View style={[styles.kpi, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.kpiValue, { color: colors.foreground }]}>{value}</Text>
        <Text style={[styles.kpiSub, { color: colors.mutedForeground }]}>{sub}</Text>
      </View>
    );
  }

  function Slice<T>({
    title,
    s,
    render,
  }: {
    title: string;
    s: Slice<T>;
    render: (data: T) => Array<[string, number | string]>;
  }) {
    const degraded = s.status === "degraded";
    return (
      <View
        style={[
          styles.card,
          { borderColor: degraded ? colors.destructive : colors.border, backgroundColor: colors.card },
        ]}
      >
        <View style={styles.cardHead}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text>
          <Text style={{ color: degraded ? colors.destructive : colors.mutedForeground, fontSize: 11 }}>
            {s.status} · {s.fetchedInMs}ms
          </Text>
        </View>
        {s.status === "ok" ? (
          render(s.data).map(([k, v]) => (
            <View key={k} style={styles.row}>
              <Text style={[styles.rowK, { color: colors.mutedForeground }]}>{k}</Text>
              <Text style={[styles.rowV, { color: colors.foreground }]}>
                {typeof v === "number" ? v.toLocaleString() : v}
              </Text>
            </View>
          ))
        ) : (
          <Text style={{ color: colors.destructive, fontSize: 12 }}>{s.error}</Text>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 96, gap: 12 },
  h1: { fontSize: 28, fontWeight: "700", marginTop: 8 },
  sub: { fontSize: 13, marginBottom: 12 },
  center: { padding: 32, alignItems: "center" },
  kpiRow: { flexDirection: "row", gap: 10 },
  kpi: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12, gap: 4 },
  kpiLabel: { fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5 },
  kpiValue: { fontSize: 22, fontWeight: "700" },
  kpiSub: { fontSize: 11 },
  card: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 6 },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  cardTitle: { fontSize: 14, fontWeight: "600" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  rowK: { fontSize: 12 },
  rowV: { fontSize: 12, fontFamily: "monospace", fontWeight: "600" },
  asOf: { fontSize: 11, textAlign: "center", marginTop: 8 },
});
