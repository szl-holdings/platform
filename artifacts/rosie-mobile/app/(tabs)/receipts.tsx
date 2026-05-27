/**
 * ROSIE Mobile · Receipts — proof-chain inspector.
 *
 * Lists the most recent hash-chained receipts from /api/rosie/receipts,
 * shows the head hash + prev-hash linkage for each, and exposes a
 * "Verify chain" action that calls /api/rosie/receipts/verify to
 * re-walk every link server-side.
 *
 * Tapping a receipt expands its detail (kind-specific fields):
 *   - solve     → templateName, energy, sweeps, iterations
 *   - ingest    → source, itemCount, errorCount
 *   - narration → provider, model, narrative
 */

import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
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

type Receipt = {
  receiptId: string;
  kind: "solve" | "ingest" | "narration";
  createdAt: string;
  prevHash: string;
  receiptHash: string;
  templateName?: string;
  templateId?: string;
  domain?: string;
  energy?: number;
  sweeps?: number;
  iterations?: number;
  source?: string;
  itemCount?: number;
  errorCount?: number;
  provider?: string;
  model?: string;
  narrative?: string;
};

export default function ReceiptsScreen() {
  const colors = useColors();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_ROOT}/rosie/receipts?kind=all`);
      if (!res.ok) throw new Error(`receipts ${res.status}`);
      const json = await res.json();
      const data = (json && typeof json === "object" && "success" in json ? json.data : json) as
        | Receipt[]
        | { receipts: Receipt[] };
      const list = Array.isArray(data) ? data : data.receipts ?? [];
      setReceipts(list.slice(-50).reverse());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 15_000);
    return () => clearInterval(id);
  }, [load]);

  const verifyChain = useCallback(async () => {
    setVerifying(true);
    try {
      const res = await fetch(`${API_ROOT}/rosie/receipts/verify`, { method: "POST" });
      const json = await res.json();
      const data = (json && typeof json === "object" && "success" in json ? json.data : json) as {
        ok?: boolean;
        valid?: boolean;
        verified?: number;
        total?: number;
        head?: string;
        error?: string;
      };
      const ok = data.ok ?? data.valid ?? res.ok;
      Alert.alert(
        ok ? "Chain verified" : "Chain INVALID",
        `${data.verified ?? data.total ?? receipts.length} links checked\nhead: ${(data.head ?? receipts[0]?.receiptHash ?? "—").slice(0, 16)}…`,
      );
    } catch (e) {
      Alert.alert("Verify failed", (e as Error).message);
    } finally {
      setVerifying(false);
    }
  }, [receipts]);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.h1, { color: colors.foreground }]}>Proof Chain</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            {receipts.length} receipts · SHA-256 linked
          </Text>
        </View>
        <Pressable
          onPress={verifyChain}
          disabled={verifying || receipts.length === 0}
          style={[
            styles.verifyBtn,
            {
              borderColor: colors.primary,
              backgroundColor: verifying ? colors.muted : colors.background,
              opacity: receipts.length === 0 ? 0.4 : 1,
            },
          ]}
        >
          {verifying ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 12 }}>Verify</Text>
          )}
        </Pressable>
      </View>

      {loading && receipts.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error && receipts.length === 0 ? (
        <Text style={{ color: colors.destructive, fontSize: 13 }}>Receipts unavailable: {error}</Text>
      ) : receipts.length === 0 ? (
        <Text style={{ color: colors.mutedForeground, fontSize: 13, textAlign: "center", marginTop: 32 }}>
          No receipts sealed yet.
        </Text>
      ) : (
        receipts.map((r) => {
          const open = expanded === r.receiptId;
          return (
            <Pressable
              key={r.receiptId}
              onPress={() => setExpanded(open ? null : r.receiptId)}
              style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}
            >
              <View style={styles.rowBetween}>
                <Text style={[styles.kind, { color: colors.primary }]}>{r.kind.toUpperCase()}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>
                  {new Date(r.createdAt).toLocaleTimeString()}
                </Text>
              </View>
              <Text style={[styles.hash, { color: colors.foreground }]} numberOfLines={1}>
                {r.receiptHash.slice(0, 24)}…
              </Text>
              <Text style={[styles.prev, { color: colors.mutedForeground }]} numberOfLines={1}>
                ← {r.prevHash === "GENESIS" ? "GENESIS" : `${r.prevHash.slice(0, 20)}…`}
              </Text>
              {open && (
                <View style={[styles.detail, { borderTopColor: colors.border }]}>
                  {r.kind === "solve" && (
                    <>
                      <DetailRow k="Template" v={r.templateName ?? r.templateId ?? "—"} colors={colors} />
                      <DetailRow k="Energy" v={r.energy?.toFixed(4) ?? "—"} colors={colors} />
                      <DetailRow k="Sweeps" v={r.sweeps?.toLocaleString() ?? "—"} colors={colors} />
                      <DetailRow k="Iterations" v={r.iterations?.toLocaleString() ?? "—"} colors={colors} />
                    </>
                  )}
                  {r.kind === "ingest" && (
                    <>
                      <DetailRow k="Source" v={r.source ?? "—"} colors={colors} />
                      <DetailRow k="Items" v={r.itemCount?.toLocaleString() ?? "0"} colors={colors} />
                      <DetailRow k="Errors" v={r.errorCount?.toLocaleString() ?? "0"} colors={colors} />
                    </>
                  )}
                  {r.kind === "narration" && (
                    <>
                      <DetailRow k="Provider" v={`${r.provider ?? "—"}/${r.model ?? ""}`} colors={colors} />
                      {r.narrative && (
                        <Text style={[styles.narrative, { color: colors.foreground }]} numberOfLines={6}>
                          {r.narrative}
                        </Text>
                      )}
                    </>
                  )}
                  <Text style={[styles.id, { color: colors.mutedForeground }]} numberOfLines={1}>
                    id {r.receiptId}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

function DetailRow({ k, v, colors }: { k: string; v: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.detailRow}>
      <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{k}</Text>
      <Text style={{ color: colors.foreground, fontSize: 11, fontFamily: "monospace" }}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 96, gap: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  h1: { fontSize: 28, fontWeight: "700" },
  sub: { fontSize: 13 },
  verifyBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, minWidth: 70, alignItems: "center" },
  center: { padding: 32, alignItems: "center" },
  card: { borderWidth: 1, borderRadius: 10, padding: 12 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  kind: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  hash: { fontSize: 12, fontFamily: "monospace", fontWeight: "600" },
  prev: { fontSize: 11, fontFamily: "monospace", marginTop: 2 },
  detail: { borderTopWidth: 1, marginTop: 8, paddingTop: 8, gap: 4 },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  narrative: { fontSize: 12, lineHeight: 18, marginTop: 4, fontStyle: "italic" },
  id: { fontSize: 10, fontFamily: "monospace", marginTop: 4 },
});
