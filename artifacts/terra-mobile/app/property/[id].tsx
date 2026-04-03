import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useMutation, useQuery } from "@tanstack/react-query";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? "https://" + process.env.EXPO_PUBLIC_DOMAIN + "/api"
  : "/api";

interface PropertyContact {
  name: string;
  phone: string;
  role: string;
}

interface PropertyTimeline {
  date: string;
  event: string;
}

interface PropertyDetail {
  id: string;
  address: string;
  borough: string;
  distressType: string;
  opportunityScore: number;
  estimatedValue: number;
  ownerName: string;
  daysInDistress: number;
  confidenceLevel: string;
  squareFeet?: number;
  yearBuilt?: number;
  lotSize?: string;
  zoning?: string;
  taxId?: string;
  debt?: number;
  equity?: number;
  thesis?: string;
  contacts?: PropertyContact[];
  timeline?: PropertyTimeline[];
  comparables?: Array<{ address: string; distance: string; sold: string; sqft: string; date: string; ppsf: string }>;
}

function formatCurrency(n: number) {
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "$" + Math.round(n / 1e3) + "K";
  return "$" + n;
}

const STATUS_COLORS: Record<string, string> = {
  "pre-foreclosure": "#b8943c",
  "foreclosure": "#c0503a",
  "tax-lien": "#8b5cf6",
  "reo": "#3a7ad4",
  "auction": "#ef4444",
};

export default function PropertyDetail() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [watchlisted, setWatchlisted] = useState(false);
  const { data: apiData, isLoading: propertyLoading } = useQuery<PropertyDetail | null>({
    queryKey: ["terra-property", id],
    queryFn: async () => {
      const res = await fetch(API_BASE + "/terra/distress/property/" + id);
      if (!res.ok) return null;
      const json = await res.json();
      const raw = json.data?.property ?? json.property ?? json.data ?? json;
      if (!raw || !raw.address) return null;
      return {
        id: raw.id ?? raw.externalId ?? id,
        address: raw.address,
        borough: raw.borough,
        distressType: raw.distressType ?? raw.distress_type ?? "distress",
        opportunityScore: raw.opportunityScore ?? raw.opportunity_score ?? 70,
        estimatedValue: raw.estimatedValue ?? raw.estimated_value ?? 0,
        ownerName: raw.ownerName ?? raw.owner_name ?? "Owner Unknown",
        daysInDistress: raw.daysInDistress ?? raw.days_in_distress ?? 0,
        confidenceLevel: raw.confidenceLevel ?? raw.confidence_level ?? "medium",
        squareFeet: raw.squareFeet ?? raw.square_feet,
        yearBuilt: raw.yearBuilt ?? raw.year_built,
        lotSize: raw.lotSize ?? raw.lot_size,
        zoning: raw.zoning,
        taxId: raw.taxId ?? raw.tax_id,
        debt: raw.debtAmount ?? raw.debt ?? raw.debt_amount,
        equity: raw.equity,
        thesis: raw.scoreRationale ?? raw.thesis ?? raw.score_rationale,
        contacts: raw.contacts,
        timeline: raw.timeline,
        comparables: raw.comparables,
      } as PropertyDetail;
    },
    retry: 1,
  });

  const property: PropertyDetail | null = apiData ?? null;

  const createLeadMutation = useMutation({
    mutationFn: async () => {
      if (!property) throw new Error("No property data");
      const nameParts = (property.ownerName ?? "Unknown Owner").split(" ");
      const firstName = nameParts[0] ?? "Unknown";
      const lastName = nameParts.slice(1).join(" ") || "Owner";
      const res = await fetch(API_BASE + "/terra/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          ownerName: property.ownerName,
          type: "seller",
          source: "mobile-detail",
          stage: "new",
          score: property.opportunityScore,
          propertyAddress: property.address + ", " + property.borough,
          estimatedValue: property.estimatedValue,
          notes: "Added from Terra Mobile property detail. Distress type: " + property.distressType,
        }),
      });
      if (!res.ok) throw new Error("Failed to create lead: " + res.status);
      return true;
    },
    onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  });

  const shareReport = async () => {
    if (!property) return;
    try {
      await Share.share({
        title: "Terra Property Report — " + property.address,
        message: [
          "Terra Field Intelligence Report",
          "Address: " + property.address + ", " + property.borough,
          "Est. Value: " + formatCurrency(property.estimatedValue),
          "Opportunity Score: " + property.opportunityScore + "/100",
          "Status: " + property.distressType?.replace(/-/g, " "),
          "Days in Distress: " + property.daysInDistress,
          property.thesis ? "AI Thesis: " + property.thesis : "",
        ].filter(Boolean).join(" | "),
      });
    } catch {}
  };

  const downloadPDF = async () => {
    if (!property) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const reportUrl = API_BASE + "/terra/reports/property/" + property.id + "?format=pdf";
    await Share.share({
      url: reportUrl,
      message: "Terra Property Report — " + property.address,
    });
    createLeadMutation.mutate();
  };


  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 20;

  if (propertyLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Feather name="loader" size={24} color={colors.mutedForeground} />
        <Text style={{ color: colors.mutedForeground, marginTop: 12, fontFamily: "Inter_400Regular", fontSize: 13 }}>Loading property…</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Feather name="alert-circle" size={24} color={colors.mutedForeground} />
        <Text style={{ color: colors.mutedForeground, marginTop: 12, fontFamily: "Inter_400Regular", fontSize: 13 }}>Property not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 8 }}>
          <Text style={{ color: colors.cream, fontFamily: "Inter_500Medium", fontSize: 13 }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const typeColor = STATUS_COLORS[property.distressType] ?? colors.gold;
  const scoreColor = property.opportunityScore >= 80 ? colors.emerald : property.opportunityScore >= 60 ? colors.amber : colors.rose;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(184,148,60,0.08)", "transparent"]}
        style={[styles.headerGradient, { height: topPad + 160 }]}
      />

      <View style={[styles.topBar, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: "rgba(255,255,255,0.06)", borderColor: colors.border }]}>
          <Feather name="arrow-left" size={16} color={colors.cream} />
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.cream }]}>Property Detail</Text>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); setWatchlisted(w => !w); }}
          style={[styles.backBtn, { backgroundColor: watchlisted ? colors.goldDim : "rgba(255,255,255,0.06)", borderColor: watchlisted ? colors.goldBorder : colors.border }]}
        >
          <Feather name="bookmark" size={16} color={watchlisted ? colors.gold : colors.mutedForeground} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={[styles.typeChip, { backgroundColor: typeColor + "15", borderColor: typeColor + "30" }]}>
            <Text style={[styles.typeText, { color: typeColor }]}>{property.distressType?.replace(/-/g, " ")}</Text>
          </View>
          <Text style={[styles.address, { color: colors.cream }]}>{property.address}</Text>
          <Text style={[styles.borough, { color: colors.mutedForeground }]}>{property.borough}</Text>

          <View style={styles.heroStats}>
            <View style={[styles.heroStat, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>EST. VALUE</Text>
              <Text style={[styles.heroStatValue, { color: colors.gold }]}>{formatCurrency(property.estimatedValue)}</Text>
            </View>
            <View style={[styles.heroStat, { borderColor: scoreColor + "30", backgroundColor: scoreColor + "10" }]}>
              <Text style={[styles.heroStatLabel, { color: scoreColor }]}>OPP SCORE</Text>
              <Text style={[styles.heroStatValue, { color: scoreColor }]}>{property.opportunityScore}</Text>
            </View>
            <View style={[styles.heroStat, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>DAYS</Text>
              <Text style={[styles.heroStatValue, { color: colors.cream }]}>{property.daysInDistress}</Text>
            </View>
          </View>
        </View>

        {/* Property Details */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.goldSubtle }]}>PROPERTY DETAILS</Text>
          {[
            { label: "Owner", value: property.ownerName },
            { label: "Sq. Footage", value: property.squareFeet ? property.squareFeet.toLocaleString() + " sq ft" : "N/A" },
            { label: "Year Built", value: String(property.yearBuilt ?? "N/A") },
            { label: "Lot Size", value: property.lotSize ?? "N/A" },
            { label: "Zoning", value: property.zoning ?? "N/A" },
            { label: "Tax ID", value: property.taxId ?? "N/A" },
          ].map(row => (
            <View key={row.label} style={[styles.detailRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
              <Text style={[styles.detailValue, { color: colors.cream }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Financial Summary */}
        {property.debt && (
          <View style={[styles.section, { borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.goldSubtle }]}>FINANCIAL SUMMARY</Text>
            <View style={styles.finRow}>
              <View style={[styles.finCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.finLabel, { color: colors.mutedForeground }]}>DEBT</Text>
                <Text style={[styles.finValue, { color: colors.rose }]}>{formatCurrency(property.debt)}</Text>
              </View>
              <View style={[styles.finCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.finLabel, { color: colors.mutedForeground }]}>EQUITY</Text>
                <Text style={[styles.finValue, { color: colors.emerald }]}>{formatCurrency(property.equity ?? 0)}</Text>
              </View>
              <View style={[styles.finCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.finLabel, { color: colors.mutedForeground }]}>LTV</Text>
                <Text style={[styles.finValue, { color: colors.cream }]}>{Math.round(((property.debt ?? 0) / property.estimatedValue) * 100)}%</Text>
              </View>
            </View>
          </View>
        )}

        {/* AI Thesis */}
        {property.thesis && (
          <View style={[styles.section, { borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.goldSubtle }]}>AI ACQUISITION THESIS</Text>
            <Text style={[styles.thesis, { color: colors.creamDim }]}>{property.thesis}</Text>
          </View>
        )}

        {/* Contacts */}
        {property.contacts && property.contacts.length > 0 && (
          <View style={[styles.section, { borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.goldSubtle }]}>CONTACTS</Text>
            {property.contacts.map((c: PropertyContact) => (
              <View key={c.phone} style={[styles.contactRow, { borderTopColor: colors.border }]}>
                <View style={[styles.contactIcon, { backgroundColor: colors.goldDim, borderColor: colors.goldBorder }]}>
                  <Feather name="user" size={12} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.contactName, { color: colors.cream }]}>{c.name}</Text>
                  <Text style={[styles.contactRole, { color: colors.mutedForeground }]}>{c.role}</Text>
                </View>
                <Pressable
                  onPress={() => Haptics.selectionAsync()}
                  style={[styles.callBtn, { backgroundColor: colors.emerald + "10", borderColor: colors.emerald + "30" }]}
                >
                  <Feather name="phone" size={12} color={colors.emerald} />
                  <Text style={[styles.callBtnText, { color: colors.emerald }]}>Call</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Timeline */}
        {property.timeline != null && property.timeline.length > 0 && (
          <View style={[styles.section, { borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.goldSubtle }]}>DISTRESS TIMELINE</Text>
            {property.timeline!.map((t: PropertyTimeline, i: number) => (
              <View key={t.date} style={styles.timelineRow}>
                <View style={[styles.timelineDot, { backgroundColor: i === property.timeline!.length - 1 ? colors.rose : colors.gold }]} />
                <View style={[styles.timelineLine, { backgroundColor: i < property.timeline!.length - 1 ? colors.border : "transparent" }]} />
                <View style={{ flex: 1, marginBottom: 12 }}>
                  <Text style={[styles.timelineDate, { color: colors.goldSubtle }]}>{t.date}</Text>
                  <Text style={[styles.timelineEvent, { color: i === property.timeline!.length - 1 ? colors.rose : colors.cream }]}>{t.event}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Property Photos */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.goldSubtle }]}>PROPERTY PHOTOS</Text>
          <View style={styles.photosRow}>
            {[
              { label: "Street View", icon: "map-pin" as const },
              { label: "Front Facade", icon: "home" as const },
              { label: "Interior", icon: "image" as const },
            ].map(photo => (
              <Pressable
                key={photo.label}
                onPress={() => { Haptics.selectionAsync(); router.push("/capture"); }}
                style={[styles.photoPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Feather name={photo.icon} size={20} color={colors.mutedForeground} />
                <Text style={[styles.photoLabel, { color: colors.mutedForeground }]}>{photo.label}</Text>
                <Feather name="plus-circle" size={12} color={colors.gold} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Comparable Sales */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.goldSubtle }]}>COMPARABLE SALES</Text>
          {(property.comparables ?? []).length === 0 ? (
            <View style={{ paddingVertical: 18, alignItems: "center" }}>
              <Feather name="bar-chart-2" size={20} color={colors.mutedForeground} />
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 6 }}>No comparable sales data available</Text>
            </View>
          ) : (
            <>
              {(property.comparables ?? []).map((comp, i) => (
                <View key={comp.address} style={[styles.compRow, { borderTopColor: colors.border, borderTopWidth: i > 0 ? 1 : 0 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.compAddress, { color: colors.cream }]}>{comp.address}</Text>
                    <Text style={[styles.compMeta, { color: colors.mutedForeground }]}>{comp.distance} · {comp.sqft} sf · {comp.date}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.compPrice, { color: colors.gold }]}>{comp.sold}</Text>
                    <Text style={[styles.compPpsf, { color: colors.mutedForeground }]}>{comp.ppsf}</Text>
                  </View>
                </View>
              ))}
              {property.squareFeet && (
                <View style={[styles.marketNote, { backgroundColor: colors.emerald + "08", borderColor: colors.emerald + "20" }]}>
                  <Feather name="trending-up" size={12} color={colors.emerald} />
                  <Text style={[styles.marketNoteText, { color: colors.emerald }]}>Subject: ${Math.round(property.estimatedValue / property.squareFeet)}/sf</Text>
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.actionGrid}>
          <Pressable
            onPress={() => { Haptics.selectionAsync(); setWatchlisted(w => !w); }}
            style={[styles.actionGridBtn, { borderColor: watchlisted ? colors.goldBorder : colors.border, backgroundColor: watchlisted ? colors.goldDim : 'rgba(255,255,255,0.02)' }]}
          >
            <Feather name="bookmark" size={16} color={watchlisted ? colors.gold : colors.mutedForeground} />
            <Text style={[styles.actionGridText, { color: watchlisted ? colors.gold : colors.mutedForeground }]}>{watchlisted ? 'Watchlisted' : 'Watchlist'}</Text>
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); createLeadMutation.mutate(); }}
            disabled={createLeadMutation.isPending || createLeadMutation.isSuccess}
            style={[styles.actionGridBtn, { borderColor: 'rgba(192,80,58,0.3)', backgroundColor: 'rgba(192,80,58,0.08)', opacity: createLeadMutation.isPending ? 0.6 : 1 }]}
          >
            <Feather name="user-plus" size={16} color={colors.rose} />
            <Text style={[styles.actionGridText, { color: colors.rose }]}>{createLeadMutation.isSuccess ? 'Lead Created' : 'Create Lead'}</Text>
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/capture'); }}
            style={[styles.actionGridBtn, { borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.02)' }]}
          >
            <Feather name="camera" size={16} color={colors.mutedForeground} />
            <Text style={[styles.actionGridText, { color: colors.mutedForeground }]}>Capture</Text>
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); shareReport(); }}
            style={[styles.actionGridBtn, { borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.02)' }]}
          >
            <Feather name="share-2" size={16} color={colors.mutedForeground} />
            <Text style={[styles.actionGridText, { color: colors.mutedForeground }]}>Share Report</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); downloadPDF(); }}
          style={[styles.downloadBtn, { backgroundColor: colors.goldDim, borderColor: colors.goldBorder }]}
        >
          <Feather name="download" size={16} color={colors.gold} />
          <Text style={[styles.downloadBtnText, { color: colors.gold }]}>Add to Pipeline &amp; Download PDF Report</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  topTitle: { fontSize: 14, fontFamily: "Inter_500Medium" },
  scroll: { flex: 1 },
  heroSection: { paddingHorizontal: 20, paddingVertical: 16 },
  typeChip: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, marginBottom: 10 },
  typeText: { fontSize: 10, fontFamily: "Inter_500Medium", textTransform: "uppercase" },
  address: { fontSize: 22, fontFamily: "Inter_600SemiBold", marginBottom: 4, letterSpacing: -0.3 },
  borough: { fontSize: 12, fontFamily: "Inter_300Light", marginBottom: 16 },
  heroStats: { flexDirection: "row", gap: 10 },
  heroStat: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: "center" },
  heroStatLabel: { fontSize: 7, fontFamily: "Inter_500Medium", letterSpacing: 1, marginBottom: 4 },
  heroStatValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  section: { marginHorizontal: 20, marginBottom: 12, borderRadius: 12, borderWidth: 1, padding: 14 },
  sectionTitle: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 2, marginBottom: 10 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: 1 },
  detailLabel: { fontSize: 11, fontFamily: "Inter_300Light" },
  detailValue: { fontSize: 11, fontFamily: "Inter_400Regular" },
  finRow: { flexDirection: "row", gap: 8 },
  finCard: { flex: 1, borderRadius: 8, borderWidth: 1, padding: 10, alignItems: "center" },
  finLabel: { fontSize: 8, fontFamily: "Inter_500Medium", letterSpacing: 1, marginBottom: 4 },
  finValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  thesis: { fontSize: 13, fontFamily: "Inter_300Light", lineHeight: 20 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 10, borderTopWidth: 1 },
  contactIcon: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  contactName: { fontSize: 12, fontFamily: "Inter_400Regular" },
  contactRole: { fontSize: 10, fontFamily: "Inter_300Light" },
  callBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  callBtnText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  timelineRow: { flexDirection: "row", gap: 12 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, flexShrink: 0 },
  timelineLine: { position: "absolute", left: 3, top: 12, width: 2, bottom: 0 },
  timelineDate: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 1, marginBottom: 2 },
  timelineEvent: { fontSize: 12, fontFamily: "Inter_400Regular" },

  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginHorizontal: 20, marginBottom: 8 },
  actionGridBtn: { flex: 1, minWidth: "40%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  actionGridText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  downloadBtn: { marginHorizontal: 20, marginBottom: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  downloadBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  photosRow: { flexDirection: "row", gap: 8 },
  photoPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 16, borderRadius: 8, borderWidth: 1 },
  photoLabel: { fontSize: 9, fontFamily: "Inter_300Light" },
  compRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  compAddress: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  compMeta: { fontSize: 9, fontFamily: "Inter_300Light" },
  compPrice: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  compPpsf: { fontSize: 9, fontFamily: "Inter_300Light" },
  marketNote: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8, borderRadius: 6, borderWidth: 1, marginTop: 8 },
  marketNoteText: { fontSize: 10, fontFamily: "Inter_400Regular", flex: 1 },
  actionBar: { margin: 20, borderRadius: 12, borderWidth: 1, flexDirection: "row", padding: 10, gap: 8 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  actionBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
