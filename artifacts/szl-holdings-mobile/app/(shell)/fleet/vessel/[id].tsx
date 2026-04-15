import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Image, FlatList, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { VesselIcon, featherIcon } from "@/components/VesselIcon";
import { useColors } from "@/hooks/useColors";
import { api, type VesselDetail, CACHE_KEYS, cacheSet, cacheGetStale } from "@/lib/fleet/api";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#64748b",
};

const STATUS_COLORS: Record<string, string> = {
  at_sea: "#22c55e",
  in_port: "#0ea5e9",
  anchored: "#f59e0b",
  maintenance: "#ef4444",
  active: "#22c55e",
};

const STATUS_LABELS: Record<string, string> = {
  at_sea: "At Sea",
  in_port: "In Port",
  anchored: "Anchored",
  maintenance: "Maintenance",
  active: "Active",
};

type ComplianceStatus = "green" | "yellow" | "red";

interface ComplianceCheck {
  label: string;
  status: ComplianceStatus;
  detail: string;
  icon: string;
}

const CARD_W = Dimensions.get("window").width - 32;
const IMG_H = 180;

function ImageCarousel({ images }: { images: Array<{ id: number; url: string; caption?: string | null }> }) {
  const colors = useColors();
  const [activeIdx, setActiveIdx] = useState(0);
  if (!images || images.length === 0) return null;
  return (
    <View style={[styles.carouselWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => String(item.id)}
        onViewableItemsChanged={({ viewableItems }) => {
          if (viewableItems.length > 0 && viewableItems[0].index != null) {
            setActiveIdx(viewableItems[0].index);
          }
        }}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={{ width: CARD_W, height: IMG_H }}>
            <Image
              source={{ uri: item.url }}
              style={{ width: CARD_W, height: IMG_H, resizeMode: "cover" }}
            />
            {item.caption && (
              <View style={[styles.imgCaption, { backgroundColor: `${colors.bg}cc` }]}>
                <Text style={[styles.imgCaptionText, { color: colors.textDim }]} numberOfLines={1}>{item.caption}</Text>
              </View>
            )}
          </View>
        )}
      />
      {images.length > 1 && (
        <View style={styles.dotsRow}>
          {images.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i === activeIdx ? colors.primary : colors.border }]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <VesselIcon name={featherIcon(icon)} size={12} color={colors.primary} />
      <Text style={[styles.sectionTitle, { color: colors.textFaint }]}>{title}</Text>
    </View>
  );
}

function MetricPair({ label, value, color }: { label: string; value: string; color?: string }) {
  const colors = useColors();
  return (
    <View style={styles.metricPair}>
      <Text style={[styles.metricPairLabel, { color: colors.textFaint }]}>{label}</Text>
      <Text style={[styles.metricPairValue, { color: color || colors.text }]}>{value || "—"}</Text>
    </View>
  );
}

function RYGIndicator({ status, label, detail }: { status: ComplianceStatus; label: string; detail: string }) {
  const colors = useColors();
  const colorMap: Record<ComplianceStatus, string> = {
    green: colors.green,
    yellow: colors.amber,
    red: colors.red,
  };
  const bgMap: Record<ComplianceStatus, string> = {
    green: colors.greenDim,
    yellow: colors.amberDim,
    red: colors.redDim,
  };
  const iconMap: Record<ComplianceStatus, string> = {
    green: "check-circle",
    yellow: "clock",
    red: "x-circle",
  };
  const c = colorMap[status];
  return (
    <View style={[styles.rygRow, { borderColor: `${c}20` }]}>
      <View style={[styles.rygIconWrap, { backgroundColor: bgMap[status] }]}>
        <VesselIcon name={featherIcon(iconMap[status])} size={14} color={c} />
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={[styles.rygLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.rygDetail, { color: colors.textFaint }]}>{detail}</Text>
      </View>
      <View style={[styles.rygPill, { backgroundColor: bgMap[status], borderColor: `${c}30` }]}>
        <View style={[styles.rygDot, { backgroundColor: c }]} />
        <Text style={[styles.rygStatus, { color: c }]}>{status.toUpperCase()}</Text>
      </View>
    </View>
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function VesselDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const vesselId = parseInt(id ?? "0", 10);
  const [activeTab, setActiveTab] = useState<"overview" | "voyage" | "exceptions" | "compliance">("overview");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["vessel-detail", vesselId],
    queryFn: async () => {
      try {
        const detail = await api.vesselDetail(vesselId);
        await cacheSet(CACHE_KEYS.vesselDetail(vesselId), detail);
        return detail;
      } catch {
        const cached = await cacheGetStale<VesselDetail>(CACHE_KEYS.vesselDetail(vesselId));
        if (cached) return cached;
        throw new Error("No vessel data available offline");
      }
    },
    staleTime: 60_000,
    enabled: !!vesselId,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textFaint }]}>Loading vessel data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
        <View style={styles.loadingState}>
          <VesselIcon name="alert-triangle" size={32} color={colors.red} />
          <Text style={[styles.errorText, { color: colors.text }]}>Could not load vessel</Text>
          <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: colors.primaryDim }]}>
            <Text style={{ color: colors.primary }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { vessel, position, activeVoyage, maintenance, portCalls, exceptions, sanctions } = data;
  const sc = STATUS_COLORS[vessel.status] || colors.textFaint;
  const sl = STATUS_LABELS[vessel.status] || vessel.status;
  const tce = parseFloat(activeVoyage?.tcePerDay || "0");
  const revenue = parseFloat(activeVoyage?.grossRevenue || "0");
  const margin = parseFloat(activeVoyage?.netMarginUsd || "0");
  const critExc = exceptions.filter(e => e.severity === "critical").length;
  const highExc = exceptions.filter(e => e.severity === "high").length;

  const ofacClear = !sanctions || sanctions.ofacStatus === "clear";
  const euClear = !sanctions || !sanctions.euStatus || sanctions.euStatus === "clear";
  const hasCritMaint = maintenance.some(m => m.priority === "critical");
  const hasHighMaint = maintenance.some(m => m.priority === "high");

  const complianceChecks: ComplianceCheck[] = [
    {
      label: "OFAC Sanctions",
      status: ofacClear ? "green" : "red",
      detail: ofacClear ? "Cleared against OFAC SDN list" : "FLAGGED — immediate review required",
      icon: "shield",
    },
    {
      label: "EU Sanctions",
      status: euClear ? "green" : "red",
      detail: euClear ? "Cleared against EU consolidated list" : "FLAGGED — EU restriction in effect",
      icon: "globe",
    },
    {
      label: "Maintenance Status",
      status: hasCritMaint ? "red" : hasHighMaint ? "yellow" : "green",
      detail: hasCritMaint
        ? "Critical maintenance items overdue"
        : hasHighMaint
        ? "High priority items require attention"
        : "All maintenance items current",
      icon: "tool",
    },
    {
      label: "Active Exceptions",
      status: critExc > 0 ? "red" : highExc > 0 ? "yellow" : "green",
      detail: critExc > 0
        ? `${critExc} critical exception(s) active`
        : highExc > 0
        ? `${highExc} high-severity exception(s) active`
        : "No active exceptions",
      icon: "bell",
    },
    {
      label: "ISM Certificate",
      status: "green",
      detail: "International Safety Management — valid",
      icon: "check-circle",
    },
    {
      label: "ISPS Compliance",
      status: "green",
      detail: "International Ship & Port Facility Security — compliant",
      icon: "shield",
    },
    {
      label: "MLC 2006",
      status: "green",
      detail: "Maritime Labour Convention — current",
      icon: "check-circle",
    },
    {
      label: "MARPOL",
      status: "green",
      detail: "Pollution prevention certificate — valid",
      icon: "check-circle",
    },
    {
      label: "Port State Control",
      status: maintenance.length > 5 ? "yellow" : "green",
      detail: maintenance.length > 5 ? "Review due — multiple open maintenance items" : "No deficiencies on file",
      icon: "anchor",
    },
  ];

  const greenCount = complianceChecks.filter(c => c.status === "green").length;
  const yellowCount = complianceChecks.filter(c => c.status === "yellow").length;
  const redCount = complianceChecks.filter(c => c.status === "red").length;

  const tabs = [
    { id: "overview", label: "Overview", icon: "info" },
    { id: "voyage", label: "Voyage", icon: "map-pin" },
    { id: "exceptions", label: `Alerts (${exceptions.length})`, icon: "bell" },
    { id: "compliance", label: "Compliance", icon: "shield" },
  ] as const;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      <View style={[styles.navBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <VesselIcon name="arrow-left" size={20} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.navTitle, { color: colors.text }]} numberOfLines={1}>{vessel.name}</Text>
          <Text style={[styles.navSub, { color: colors.textFaint }]}>{vessel.vesselType} · IMO {vessel.imo || "—"}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: `${sc}15`, borderColor: `${sc}30` }]}>
          <View style={[styles.statusDot, { backgroundColor: sc }]} />
          <Text style={[styles.statusText, { color: sc }]}>{sl}</Text>
        </View>
      </View>

      {(critExc > 0 || highExc > 0) && (
        <View style={[styles.alertBanner, { backgroundColor: colors.redDim, borderBottomColor: `${colors.red}20` }]}>
          <VesselIcon name="alert-triangle" size={13} color={colors.red} />
          <Text style={[styles.alertBannerText, { color: colors.red }]}>
            {critExc > 0 && `${critExc} critical`}{critExc > 0 && highExc > 0 && " · "}{highExc > 0 && `${highExc} high`} severity alerts active
          </Text>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabContent}>
        {tabs.map(t => (
          <TouchableOpacity
            key={t.id}
            onPress={() => setActiveTab(t.id)}
            style={[
              styles.tabBtn,
              {
                backgroundColor: activeTab === t.id ? colors.primaryDim : "transparent",
                borderColor: activeTab === t.id ? colors.primaryBorder : colors.border,
              },
            ]}
          >
            <VesselIcon name={featherIcon(t.icon)} size={11} color={activeTab === t.id ? colors.primary : colors.textDim} />
            <Text style={[styles.tabText, { color: activeTab === t.id ? colors.primary : colors.textDim }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body}>
        {activeTab === "overview" && (
          <>
            {data.images && data.images.length > 0 && (
              <ImageCarousel images={data.images} />
            )}

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SectionHeader title="VESSEL DETAILS" icon="anchor" />
              <View style={styles.grid}>
                <MetricPair label="Flag" value={vessel.flag || "—"} />
                <MetricPair label="Type" value={vessel.vesselType || "—"} />
                <MetricPair label="IMO" value={vessel.imo || "—"} />
                <MetricPair label="MMSI" value={vessel.mmsi || "—"} />
                <MetricPair label="Built" value={vessel.yearBuilt ? String(vessel.yearBuilt) : "—"} />
                <MetricPair label="Gross Tonnage" value={vessel.grossTonnage ? `${Number(vessel.grossTonnage).toLocaleString()} GT` : "—"} />
              </View>
            </View>

            {position && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <SectionHeader title="LIVE POSITION" icon="navigation" />
                <View style={styles.grid}>
                  <MetricPair label="Latitude" value={parseFloat(position.latitude).toFixed(4) + "°"} color={colors.primary} />
                  <MetricPair label="Longitude" value={parseFloat(position.longitude).toFixed(4) + "°"} color={colors.primary} />
                  <MetricPair label="Speed" value={`${parseFloat(position.speed).toFixed(1)} kn`} color={colors.green} />
                  <MetricPair label="Heading" value={`${position.heading}°`} />
                </View>
                {vessel.destination && (
                  <View style={[styles.destRow, { borderTopColor: colors.border }]}>
                    <VesselIcon name="map-pin" size={12} color={colors.textFaint} />
                    <Text style={[styles.destText, { color: colors.textDim }]}>Dest: {vessel.destination}</Text>
                  </View>
                )}
              </View>
            )}

            {maintenance.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <SectionHeader title="MAINTENANCE" icon="tool" />
                {maintenance.map((m, i) => {
                  const pc = m.priority === "critical" ? colors.red : m.priority === "high" ? colors.amber : colors.textFaint;
                  return (
                    <View key={m.id} style={[styles.listRow, { borderTopColor: i > 0 ? colors.border : "transparent" }]}>
                      <View style={[styles.listDot, { backgroundColor: pc }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.listTitle, { color: colors.text }]}>{m.component}</Text>
                        <Text style={[styles.listMeta, { color: colors.textFaint }]}>
                          {m.status} · Due {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : "—"}
                        </Text>
                      </View>
                      <View style={[styles.priorityPill, { backgroundColor: `${pc}15` }]}>
                        <Text style={[styles.priorityText, { color: pc }]}>{m.priority.toUpperCase()}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {portCalls.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <SectionHeader title="PORT HISTORY" icon="anchor" />
                {portCalls.slice(0, 5).map((pc, i) => (
                  <View key={pc.id} style={[styles.listRow, { borderTopColor: i > 0 ? colors.border : "transparent" }]}>
                    <VesselIcon name="anchor" size={13} color={colors.textFaint} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={[styles.listTitle, { color: colors.text }]}>{pc.portName}</Text>
                      <Text style={[styles.listMeta, { color: colors.textFaint }]}>
                        {pc.purpose || "Port call"} ·{" "}
                        {pc.arrivalAt ? new Date(pc.arrivalAt).toLocaleDateString() : "—"}
                        {" → "}
                        {pc.departureAt ? new Date(pc.departureAt).toLocaleDateString() : "pending"}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {activeTab === "voyage" && (
          <>
            {activeVoyage ? (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <SectionHeader title="ACTIVE VOYAGE" icon="map-pin" />
                <View style={styles.routeRow}>
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <VesselIcon name="circle" size={8} color={colors.primary} />
                    <Text style={[styles.portLabel, { color: colors.textFaint }]}>ORIGIN</Text>
                    <Text style={[styles.portName, { color: colors.text }]}>{activeVoyage.originPort || "—"}</Text>
                  </View>
                  <VesselIcon name="arrow-right" size={16} color={colors.textFaint} />
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <VesselIcon name="map-pin" size={8} color={colors.green} />
                    <Text style={[styles.portLabel, { color: colors.textFaint }]}>DESTINATION</Text>
                    <Text style={[styles.portName, { color: colors.text }]}>{activeVoyage.destinationPort || "—"}</Text>
                  </View>
                </View>
                <View style={styles.grid}>
                  <MetricPair label="Charter Type" value={activeVoyage.charterType || "—"} />
                  <MetricPair label="ETA" value={activeVoyage.estimatedArrivalAt ? new Date(activeVoyage.estimatedArrivalAt).toLocaleDateString() : "—"} />
                  <MetricPair label="Gross Revenue" value={revenue > 0 ? fmt(revenue) : "—"} color={colors.green} />
                  <MetricPair label="TCE / Day" value={tce > 0 ? fmt(tce) : "—"} color={colors.primary} />
                  <MetricPair label="Net Margin" value={margin !== 0 ? fmt(Math.abs(margin)) : "—"} color={margin >= 0 ? colors.green : colors.red} />
                  <MetricPair label="Total Costs" value={activeVoyage.totalCostsUsd ? fmt(parseFloat(activeVoyage.totalCostsUsd)) : "—"} color={colors.amber} />
                </View>
              </View>
            ) : (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.emptySection}>
                  <VesselIcon name="map-pin" size={28} color={colors.textFaint} />
                  <Text style={[styles.emptyText, { color: colors.textFaint }]}>No active voyage</Text>
                </View>
              </View>
            )}
          </>
        )}

        {activeTab === "exceptions" && (
          <>
            {exceptions.length === 0 ? (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.emptySection}>
                  <VesselIcon name="check-circle" size={28} color={colors.green} />
                  <Text style={[styles.emptyText, { color: colors.text }]}>No active exceptions</Text>
                </View>
              </View>
            ) : (
              exceptions.map(exc => {
                const ec = SEVERITY_COLORS[exc.severity] || colors.textFaint;
                return (
                  <View key={exc.id} style={[styles.card, { backgroundColor: colors.card, borderColor: `${ec}25` }]}>
                    <View style={styles.excHeader}>
                      <View style={[styles.excIcon, { backgroundColor: `${ec}15` }]}>
                        <VesselIcon name="alert-triangle" size={14} color={ec} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.excTitle, { color: colors.text }]}>{exc.title}</Text>
                        <Text style={[styles.excType, { color: colors.textFaint }]}>
                          {exc.exceptionType?.replace(/_/g, " ")}
                        </Text>
                      </View>
                      <View style={[styles.severityBadge, { backgroundColor: `${ec}15`, borderColor: `${ec}30` }]}>
                        <Text style={[styles.severityText, { color: ec }]}>{exc.severity.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={[styles.excDesc, { color: colors.textDim }]}>{exc.description}</Text>
                    <Text style={[styles.excTime, { color: colors.textFaint }]}>
                      Detected: {new Date(exc.detectedAt).toLocaleString()}
                    </Text>
                  </View>
                );
              })
            )}
          </>
        )}

        {activeTab === "compliance" && (
          <>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SectionHeader title="COMPLIANCE DASHBOARD" icon="shield" />

              <View style={styles.complianceSummaryRow}>
                {[
                  { label: "COMPLIANT", count: greenCount, color: colors.green, bg: colors.greenDim },
                  { label: "WATCH", count: yellowCount, color: colors.amber, bg: colors.amberDim },
                  { label: "FLAGGED", count: redCount, color: colors.red, bg: colors.redDim },
                ].map(s => (
                  <View key={s.label} style={[styles.complianceSummaryItem, { backgroundColor: s.bg, borderColor: `${s.color}25` }]}>
                    <Text style={[styles.complianceSummaryCount, { color: s.color }]}>{s.count}</Text>
                    <Text style={[styles.complianceSummaryLabel, { color: s.color }]}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {complianceChecks.map((check, i) => (
                <RYGIndicator
                  key={check.label}
                  status={check.status}
                  label={check.label}
                  detail={check.detail}
                />
              ))}
            </View>

            {sanctions && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <SectionHeader title="SANCTIONS DETAIL" icon="shield" />
                <View style={styles.grid}>
                  <MetricPair
                    label="OFAC Status"
                    value={sanctions.ofacStatus}
                    color={sanctions.ofacStatus === "clear" ? colors.green : colors.red}
                  />
                  <MetricPair
                    label="EU Status"
                    value={sanctions.euStatus || "clear"}
                    color={(sanctions.euStatus || "clear") === "clear" ? colors.green : colors.red}
                  />
                  <MetricPair
                    label="Last Screened"
                    value={new Date(sanctions.screeningDate).toLocaleDateString()}
                  />
                </View>
                <View style={[
                  styles.sanctionsBanner,
                  {
                    backgroundColor: sanctions.ofacStatus === "clear" ? colors.greenDim : colors.redDim,
                    borderColor: `${sanctions.ofacStatus === "clear" ? colors.green : colors.red}30`,
                  },
                ]}>
                  <VesselIcon
                    name={sanctions.ofacStatus === "clear" ? "check-circle" : "x-circle"}
                    size={14}
                    color={sanctions.ofacStatus === "clear" ? colors.green : colors.red}
                  />
                  <Text style={[
                    styles.sanctionsText,
                    { color: sanctions.ofacStatus === "clear" ? colors.green : colors.red },
                  ]}>
                    {sanctions.ofacStatus === "clear" ? "Vessel cleared for all major jurisdictions" : "SANCTIONS FLAG — Immediate review required"}
                  </Text>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingState: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  errorText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  navBar: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  navTitle: { fontSize: 16, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  navSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  alertBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1,
  },
  alertBannerText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  tabBar: { borderBottomWidth: 0 },
  tabContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  tabBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  tabText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  body: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100, gap: 12 },
  card: { padding: 14, borderRadius: 14, borderWidth: 1 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 10, letterSpacing: 0.5, fontFamily: "Inter_500Medium" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  metricPair: { width: "48%", paddingVertical: 8 },
  metricPairLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  metricPairValue: { fontSize: 14, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  destRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 0.5 },
  destText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  routeRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 16, marginBottom: 12,
  },
  portLabel: { fontSize: 9, letterSpacing: 0.5, marginTop: 4, fontFamily: "Inter_500Medium" },
  portName: { fontSize: 14, fontWeight: "600" as const, textAlign: "center", fontFamily: "Inter_600SemiBold", marginTop: 2 },
  listRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 10, borderTopWidth: 0.5,
  },
  listDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  listTitle: { fontSize: 13, fontWeight: "500" as const, fontFamily: "Inter_500Medium" },
  listMeta: { fontSize: 10, marginTop: 2, fontFamily: "Inter_400Regular" },
  priorityPill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  priorityText: { fontSize: 9, fontWeight: "700" as const, letterSpacing: 0.5, fontFamily: "Inter_700Bold" },
  excHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  excIcon: { width: 34, height: 34, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  excTitle: { fontSize: 13, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  excType: { fontSize: 10, marginTop: 2, fontFamily: "Inter_400Regular" },
  severityBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  severityText: { fontSize: 9, fontWeight: "700" as const, letterSpacing: 0.5, fontFamily: "Inter_700Bold" },
  excDesc: { fontSize: 12, lineHeight: 16, marginBottom: 6, fontFamily: "Inter_400Regular" },
  excTime: { fontSize: 10, fontFamily: "Inter_400Regular" },
  complianceSummaryRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  complianceSummaryItem: {
    flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: "center",
  },
  complianceSummaryCount: { fontSize: 20, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  complianceSummaryLabel: { fontSize: 9, fontWeight: "600" as const, letterSpacing: 0.5, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  rygRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: "rgba(14,165,233,0.1)",
  },
  rygIconWrap: { width: 30, height: 30, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  rygLabel: { fontSize: 13, fontWeight: "500" as const, fontFamily: "Inter_500Medium" },
  rygDetail: { fontSize: 10, marginTop: 2, fontFamily: "Inter_400Regular" },
  rygPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
  },
  rygDot: { width: 5, height: 5, borderRadius: 3 },
  rygStatus: { fontSize: 9, fontWeight: "700" as const, letterSpacing: 0.5, fontFamily: "Inter_700Bold" },
  sanctionsBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 12,
  },
  sanctionsText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium", lineHeight: 16 },
  emptySection: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  carouselWrap: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 5, paddingVertical: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  imgCaption: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 6 },
  imgCaptionText: { fontSize: 10, fontFamily: "Inter_400Regular" },
});
