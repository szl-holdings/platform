/**
 * ROSIE Mobile · Optimizer — propose deterministic Ising solves.
 *
 * Web parity for the simplest path: pick a template, tap Propose. The
 * solve is queued via /api/rosie/solve/queue (no auto-seal) so the
 * HITL Approvals tab is the only path to a sealed receipt.
 *
 * This screen intentionally does NOT expose the custom J/h matrix
 * editor — that's a desktop affordance.
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

type Template = {
  id: string;
  name: string;
  domain: string;
  description: string;
  variables: number;
};

type QueueItem = {
  id: string;
  templateId: string;
  templateName?: string;
  status: string;
  createdAt: string;
};

export default function OptimizerScreen() {
  const colors = useColors();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [proposing, setProposing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [tRes, qRes] = await Promise.all([
        fetch(`${API_ROOT}/rosie/templates`),
        fetch(`${API_ROOT}/rosie/solve/queue`),
      ]);
      const tJson = await tRes.json();
      const qJson = await qRes.json();
      const t = (tJson && "success" in tJson ? tJson.data : tJson) as Template[] | { templates: Template[] };
      const q = (qJson && "success" in qJson ? qJson.data : qJson) as QueueItem[] | { queue: QueueItem[] };
      setTemplates(Array.isArray(t) ? t : t.templates ?? []);
      setQueue(Array.isArray(q) ? q : q.queue ?? []);
    } catch (e) {
      Alert.alert("Load failed", (e as Error).message);
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

  const propose = useCallback(async (templateId: string, name: string) => {
    setProposing(templateId);
    try {
      const res = await fetch(`${API_ROOT}/rosie/solve/queue`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ templateId, source: "rosie-mobile" }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} — ${text.slice(0, 120)}`);
      }
      Alert.alert("Solve queued", `${name} is in the HITL queue.`);
      await load();
    } catch (e) {
      Alert.alert("Propose failed", (e as Error).message);
    } finally {
      setProposing(null);
    }
  }, [load]);

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
      <Text style={[styles.h1, { color: colors.foreground }]}>Optimizer</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        Propose a deterministic Ising solve · HITL approval required to seal.
      </Text>

      <Text style={[styles.section, { color: colors.foreground }]}>Queue ({queue.length})</Text>
      {loading && queue.length === 0 ? (
        <ActivityIndicator color={colors.primary} />
      ) : queue.length === 0 ? (
        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
          Empty — propose a solve below.
        </Text>
      ) : (
        queue.slice(0, 5).map((q) => (
          <View
            key={q.id}
            style={[styles.queueCard, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <Text style={[styles.queueTitle, { color: colors.foreground }]} numberOfLines={1}>
              {q.templateName ?? q.templateId}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
              {q.status} · {new Date(q.createdAt).toLocaleTimeString()}
            </Text>
          </View>
        ))
      )}

      <Text style={[styles.section, { color: colors.foreground }]}>Templates ({templates.length})</Text>
      {templates.map((t) => (
        <View
          key={t.id}
          style={[styles.templateCard, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <Text style={[styles.templateName, { color: colors.foreground }]}>{t.name}</Text>
          <Text style={{ color: colors.primary, fontSize: 10, marginTop: 2, letterSpacing: 1 }}>
            {t.domain.toUpperCase()} · {t.variables} VARS
          </Text>
          <Text style={[styles.templateDesc, { color: colors.mutedForeground }]} numberOfLines={3}>
            {t.description}
          </Text>
          <Pressable
            onPress={() => propose(t.id, t.name)}
            disabled={proposing === t.id}
            style={[
              styles.proposeBtn,
              {
                backgroundColor: proposing === t.id ? colors.muted : colors.primary,
              },
            ]}
          >
            {proposing === t.id ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text style={{ color: colors.background, fontWeight: "600", fontSize: 13 }}>
                Propose solve
              </Text>
            )}
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 96, gap: 10 },
  h1: { fontSize: 28, fontWeight: "700" },
  sub: { fontSize: 13, marginBottom: 8 },
  section: { fontSize: 12, fontWeight: "700", letterSpacing: 1.5, marginTop: 16, marginBottom: 4, textTransform: "uppercase" },
  queueCard: { borderWidth: 1, borderRadius: 10, padding: 10 },
  queueTitle: { fontSize: 13, fontWeight: "600" },
  templateCard: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 4 },
  templateName: { fontSize: 15, fontWeight: "600" },
  templateDesc: { fontSize: 12, marginTop: 6, lineHeight: 17 },
  proposeBtn: { marginTop: 10, paddingVertical: 11, borderRadius: 8, alignItems: "center" },
});
