import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useCallback } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const DEMO_DOCUMENTS = [
  { id: 1, name: "Service plan & scope agreement", date: "Mar 8, 2026", status: "Signed", category: "Governance", size: "2.1 MB" },
  { id: 2, name: "Mayfair Residence — operational assessment", date: "Mar 5, 2026", status: "Reviewed", category: "Operations", size: "4.7 MB" },
  { id: 3, name: "Household staff overview & rotas", date: "Mar 3, 2026", status: "Reviewed", category: "Staffing", size: "1.2 MB" },
  { id: 4, name: "Vendor register — Mayfair (Q1 2026)", date: "Mar 14, 2026", status: "Awaiting review", category: "Vendors", size: "890 KB" },
  { id: 5, name: "Oxfordshire Estate — condition report", date: "Mar 20, 2026", status: "Awaiting review", category: "Operations", size: "6.3 MB" },
  { id: 6, name: "Recommended vendor replacements — rationale", date: "Mar 28, 2026", status: "Awaiting review", category: "Vendors", size: "1.8 MB" },
  { id: 7, name: "Monthly operations summary — March 2026", date: "Mar 31, 2026", status: "New", category: "Reporting", size: "980 KB" },
  { id: 8, name: "NDA & confidentiality agreement", date: "Feb 20, 2026", status: "Signed", category: "Governance", size: "340 KB" },
  { id: 9, name: "Onboarding checklist — progress", date: "Mar 15, 2026", status: "Reviewed", category: "Operations", size: "560 KB" },
  { id: 10, name: "Security & access protocol — Mayfair", date: "Mar 10, 2026", status: "Reviewed", category: "Staffing", size: "420 KB" },
  { id: 11, name: "Emergency contacts & escalation guide", date: "Mar 8, 2026", status: "Reviewed", category: "Governance", size: "280 KB" },
];

const CATEGORIES = ["All", "Governance", "Operations", "Staffing", "Vendors", "Reporting"];

function getStatusStyle(status: string) {
  if (status === "New" || status === "Awaiting review") {
    return { isHighlight: true };
  }
  return { isHighlight: false };
}

export default function DocumentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  const filtered = filter === "All"
    ? DEMO_DOCUMENTS
    : DEMO_DOCUMENTS.filter((d) => d.category === filter);

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  }, []);

  const awaitingCount = DEMO_DOCUMENTS.filter(
    (d) => d.status === "Awaiting review" || d.status === "New"
  ).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(200,169,106,0.05)", "transparent"]}
        style={[styles.headerGradient, { height: topPad + 80 }]}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 16, paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
          />
        }
      >
        <Text style={[styles.eyebrow, { color: colors.goldSubtle }]}>
          DOCUMENT VAULT
        </Text>
        <Text style={[styles.title, { color: colors.cream }]}>Shared Materials</Text>

        {awaitingCount > 0 && (
          <View style={[styles.alertBanner, { borderColor: colors.goldBorder, backgroundColor: colors.goldDim }]}>
            <Feather name="bell" size={12} color={colors.gold} />
            <Text style={[styles.alertText, { color: colors.gold }]}>
              {awaitingCount} document{awaitingCount > 1 ? "s" : ""} awaiting your review
            </Text>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <View style={styles.filterInner}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter(cat);
                }}
              >
                <View
                  style={[
                    styles.filterChip,
                    {
                      borderColor: filter === cat ? colors.gold : colors.creamFaint,
                      backgroundColor: filter === cat ? colors.goldDim : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: filter === cat ? colors.gold : colors.creamDim },
                    ]}
                  >
                    {cat}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={[styles.docList, { borderColor: colors.creamFaint }]}>
          {filtered.map((doc, idx) => {
            const { isHighlight } = getStatusStyle(doc.status);
            return (
              <Pressable
                key={doc.id}
                onPress={() => Haptics.selectionAsync()}
              >
                <View
                  style={[
                    styles.docRow,
                    {
                      borderBottomColor: idx < filtered.length - 1 ? colors.creamFaint : "transparent",
                    },
                  ]}
                >
                  <View style={styles.docLeft}>
                    <View style={styles.docMeta}>
                      <View
                        style={[
                          styles.categoryBadge,
                          { borderColor: "rgba(200,169,106,0.12)" },
                        ]}
                      >
                        <Text style={[styles.categoryBadgeText, { color: "rgba(200,169,106,0.4)" }]}>
                          {doc.category}
                        </Text>
                      </View>
                      {isHighlight && (
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: "rgba(200,169,106,0.1)" },
                          ]}
                        >
                          <Text style={[styles.statusBadgeText, { color: colors.gold }]}>
                            {doc.status}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.docName, { color: "rgba(245,240,232,0.75)" }]}>
                      {doc.name}
                    </Text>
                    <Text style={[styles.docInfo, { color: colors.mutedForeground }]}>
                      {doc.date} · {doc.size}
                    </Text>
                  </View>
                  <View style={styles.docActions}>
                    <Pressable
                      style={styles.docAction}
                      onPress={() => Haptics.selectionAsync()}
                    >
                      <Feather name="eye" size={14} color="rgba(245,240,232,0.25)" />
                    </Pressable>
                    <Pressable
                      style={styles.docAction}
                      onPress={() => Haptics.selectionAsync()}
                    >
                      <Feather name="download" size={14} color="rgba(245,240,232,0.25)" />
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.footNote, { color: colors.mutedForeground }]}>
          {filtered.length} document{filtered.length !== 1 ? "s" : ""} · Showing demo documents
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0 },
  content: { paddingHorizontal: 20 },
  eyebrow: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 3,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: "CormorantGaramond_400Regular",
    marginBottom: 20,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  alertText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.3,
  },
  filterRow: { marginBottom: 16 },
  filterInner: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 4,
  },
  filterChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipText: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  docList: {
    borderWidth: 1,
    marginBottom: 16,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  docLeft: { flex: 1 },
  docMeta: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  categoryBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    fontSize: 8,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 8,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  docName: {
    fontSize: 13,
    fontFamily: "Inter_300Light",
    lineHeight: 18,
    marginBottom: 4,
  },
  docInfo: {
    fontSize: 10,
    fontFamily: "Inter_300Light",
  },
  docActions: {
    flexDirection: "row",
    gap: 8,
  },
  docAction: {
    padding: 6,
  },
  footNote: {
    fontSize: 10,
    fontFamily: "Inter_300Light",
    textAlign: "center",
    marginBottom: 8,
  },
});
