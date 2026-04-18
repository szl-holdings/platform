import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

const { width: W } = Dimensions.get("window");

const VENTURES_MAP: Record<
  string,
  {
    name: string;
    tagline: string;
    description: string;
    color: string;
    url: string;
    status: string;
    year: string;
    metrics: { label: string; value: string }[];
    highlights: string[];
    tech: string[];
  }
> = {
  vessels: {
    name: "Vessels",
    tagline: "Maritime Intelligence",
    description:
      "A command-grade maritime intelligence platform covering global shipping routes. Vessels ingests live AIS feeds, enriches vessel and voyage data, applies sanctions screening against OFAC and UN watchlists, and surfaces operational exceptions in real time.",
    color: "#3b82f6",
    url: "https://vessels.szlholdings.com",
    status: "Live",
    year: "2024",
    metrics: [
      { label: "Vessels tracked", value: "50K+" },
      { label: "Data points/day", value: "2M+" },
      { label: "Coverage", value: "Global" },
      { label: "Sanctions databases", value: "OFAC + UN" },
    ],
    highlights: [
      "Real-time AIS position tracking with 15-second update cadence",
      "Multi-layer sanctions screening with automated escalation",
      "Voyage economics engine with cost and ETA projections",
      "Exception management queue with priority scoring",
      "Fleet performance benchmarking and KPI dashboards",
    ],
    tech: ["React", "TypeScript", "PostgreSQL", "AIS Stream", "Express"],
  },
  aegis: {
    name: "Aegis",
    tagline: "Unified Defense & Intelligence",
    description:
      "A unified command surface for enterprise cybersecurity converging Security Operations (Firestorm), Managed Services (Aegis Operations), and Intelligence Engine (Aegis Labs). Aegis brings together threat detection, incident response, and managed operations under a single Palantir-grade interface.",
    color: "#6366f1",
    url: "https://aegis.szlholdings.com",
    status: "Live",
    year: "2024",
    metrics: [
      { label: "Threat frameworks", value: "MITRE ATT&CK" },
      { label: "Response time", value: "<1 min" },
      { label: "SOC coverage", value: "24/7" },
      { label: "Modules", value: "3" },
    ],
    highlights: [
      "MITRE ATT&CK framework mapping for all threat detections",
      "Automated incident triage with AI-powered severity scoring",
      "Managed services ticketing and SLA management",
      "Real-time threat intelligence aggregation from 20+ feeds",
      "Cross-portfolio security posture dashboard",
    ],
    tech: ["React", "TypeScript", "WebSockets", "PostgreSQL", "AI/ML"],
  },
  terra: {
    name: "Terra",
    tagline: "Real Estate Intelligence",
    description:
      "A distress-first real estate intelligence platform covering all five NYC boroughs. Terra surfaces pre-foreclosure signals, tax lien patterns, and ownership anomalies — giving operators a 6–18 month head start on distressed opportunity.",
    color: "#10b981",
    url: "https://terra.szlholdings.com",
    status: "Live",
    year: "2024",
    metrics: [
      { label: "Properties indexed", value: "500K+" },
      { label: "Boroughs covered", value: "5" },
      { label: "Data sources", value: "12+" },
      { label: "Signal lead time", value: "6–18 mo" },
    ],
    highlights: [
      "Multi-factor distress scoring across 12+ public data sources",
      "Pre-foreclosure, tax lien, and ownership anomaly detection",
      "Spatial mapping with custom territory delineation",
      "Deal pipeline management with broker CRM",
      "Document vault with ownership history reconstruction",
    ],
    tech: ["React", "TypeScript", "PostGIS", "Mapbox", "PostgreSQL"],
  },
  lyte: {
    name: "Lyte",
    tagline: "Business Observability",
    description:
      "A unified AI operations and business observability platform. Lyte provides cross-portfolio signal aggregation, multi-model AI routing, infrastructure health monitoring, and the PRISM framework for translating operational data into decisions.",
    color: "#06b6d4",
    url: "https://lyte.szlholdings.com",
    status: "Live",
    year: "2024",
    metrics: [
      { label: "AI models", value: "6+" },
      { label: "Signals/hour", value: "10K+" },
      { label: "P95 latency", value: "<100ms" },
      { label: "Portfolios", value: "All" },
    ],
    highlights: [
      "PRISM framework: 5-layer business intelligence methodology",
      "Multi-model AI routing (GPT-5, Claude, Gemini) with cost optimization",
      "Cross-portfolio signal aggregation and correlation engine",
      "Real-time infrastructure health monitoring and alerting",
      "ActionLoop: automated decision-to-action workflows",
    ],
    tech: ["React", "TypeScript", "OpenAI", "Anthropic", "WebSockets"],
  },
  "carlota-jo": {
    name: "Carlota Jo",
    tagline: "Private Advisory",
    description:
      "A UHNW residential advisory platform combining a luxury marketing website with a private client portal and native mobile app. Carlota Jo enables high-touch client engagement, secure document exchange, and advisory relationship management.",
    color: "#f59e0b",
    url: "https://carlota-jo.szlholdings.com",
    status: "Live",
    year: "2024",
    metrics: [
      { label: "Client portal", value: "Secure" },
      { label: "Engagement model", value: "360°" },
      { label: "Platforms", value: "Web + Mobile" },
      { label: "Auth", value: "Replit OIDC" },
    ],
    highlights: [
      "Private client portal with secure document vault",
      "Native mobile app (iOS/Android) for on-the-go engagement",
      "Luxury marketing site with curated property showcase",
      "Appointment booking and scheduling system",
      "360° engagement tracking across all client touchpoints",
    ],
    tech: ["React", "Expo", "TypeScript", "Replit Auth", "PostgreSQL"],
  },
  "szl-holdings": {
    name: "SZL Holdings",
    tagline: "Parent Company",
    description:
      "The holding company architecting domain-specific enterprise platforms under one compounding infrastructure. SZL Holdings provides the shared services, design system, authentication layer, and execution fabric (Alloy) that powers all portfolio companies.",
    color: "#c4a97e",
    url: "https://szlholdings.com",
    status: "Live",
    year: "2023",
    metrics: [
      { label: "Portfolio companies", value: "6" },
      { label: "Shared infrastructure", value: "100%" },
      { label: "Lines of code", value: "150K+" },
      { label: "Build time", value: "2 years" },
    ],
    highlights: [
      "Shared PostgreSQL infrastructure with 120+ tables across all platforms",
      "Unified Replit Auth OIDC layer with 11-role RBAC",
      "Alloy: internal execution fabric and workflow orchestration engine",
      "Shared GraphQL API layer with Apollo Server v5",
      "Command-grade design system with dark-first aesthetic",
    ],
    tech: ["Node.js", "PostgreSQL", "GraphQL", "Drizzle ORM", "TypeScript"],
  },
};

export default function VentureDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const venture = VENTURES_MAP[slug ?? ""];

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const handleViewLive = () => {
    if (venture) Linking.openURL(venture.url);
  };

  if (!venture) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Venture not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.mutedForeground }]}>
            {venture.tagline.toUpperCase()}
          </Text>
        </View>
        <TouchableOpacity onPress={handleViewLive} style={styles.externalBtn}>
          <Feather name="external-link" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* Hero visual */}
        <View style={[styles.heroVisual, { backgroundColor: venture.color + "12" }]}>
          <LinearGradient
            colors={[venture.color + "20", "transparent"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          {/* Abstract graphic */}
          <View style={styles.heroGraphicContainer}>
            <View style={[styles.heroRing, { borderColor: venture.color + "30" }]}>
              <View style={[styles.heroRingInner, { borderColor: venture.color + "50" }]}>
                <View style={[styles.heroCore, { backgroundColor: venture.color }]}>
                  <Text style={styles.heroCoreInitial}>
                    {venture.name.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: venture.color + "20", borderColor: venture.color + "40" }]}>
              <View style={[styles.statusDot, { backgroundColor: venture.color }]} />
              <Text style={[styles.statusText, { color: venture.color }]}>{venture.status}</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.ventureName, { color: colors.foreground }]}>{venture.name}</Text>
          <View style={[styles.taglineRow]}>
            <View style={[styles.taglineDot, { backgroundColor: venture.color }]} />
            <Text style={[styles.taglineText, { color: venture.color }]}>{venture.tagline}</Text>
            <Text style={[styles.yearText, { color: colors.mutedForeground }]}>· Est. {venture.year}</Text>
          </View>

          <Text style={[styles.description, { color: colors.mutedForeground }]}>{venture.description}</Text>

          {/* Metrics */}
          <Text style={[styles.sectionLabel, { color: colors.silverSubtle }]}>METRICS</Text>
          <View style={styles.metricsGrid}>
            {venture.metrics.map((m) => (
              <View key={m.label} style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.metricValue, { color: colors.foreground }]}>{m.value}</Text>
                <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
              </View>
            ))}
          </View>

          {/* Highlights */}
          <Text style={[styles.sectionLabel, { color: colors.silverSubtle }]}>KEY CAPABILITIES</Text>
          <View style={styles.highlightsList}>
            {venture.highlights.map((h, i) => (
              <View key={i} style={styles.highlightRow}>
                <View style={[styles.highlightDot, { backgroundColor: venture.color }]} />
                <Text style={[styles.highlightText, { color: colors.mutedForeground }]}>{h}</Text>
              </View>
            ))}
          </View>

          {/* Tech */}
          <Text style={[styles.sectionLabel, { color: colors.silverSubtle }]}>TECHNOLOGY</Text>
          <View style={styles.techRow}>
            {venture.tech.map((t) => (
              <View key={t} style={[styles.techChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.techText, { color: colors.mutedForeground }]}>{t}</Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: venture.color }]}
            onPress={handleViewLive}
          >
            <Text style={[styles.ctaBtnText, { color: "#fff" }]}>View Live Platform</Text>
            <Feather name="arrow-up-right" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  externalBtn: { padding: 4 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  heroVisual: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  heroGraphicContainer: { alignItems: "center" },
  heroRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heroRingInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heroCore: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  heroCoreInitial: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 16,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  content: { padding: 20, gap: 0 },
  ventureName: { fontSize: 30, fontFamily: "Inter_600SemiBold", letterSpacing: -0.5, marginBottom: 8 },
  taglineRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  taglineDot: { width: 8, height: 8, borderRadius: 4 },
  taglineText: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase" },
  yearText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  description: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 25, marginBottom: 28 },
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 4,
  },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
  metricCard: {
    width: (W - 52) / 2,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
  },
  metricValue: { fontSize: 20, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  metricLabel: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  highlightsList: { gap: 12, marginBottom: 28 },
  highlightRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  highlightDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  highlightText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  techRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 32 },
  techChip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  techText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 10,
  },
  ctaBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
