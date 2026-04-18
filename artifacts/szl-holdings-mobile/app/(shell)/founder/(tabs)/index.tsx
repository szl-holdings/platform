import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  Share,
  Alert,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons, Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
  FadeInDown,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { SectionNav, Section } from "@/components/founder/SectionNav";
import { mobile } from "@szl-holdings/brand-registry/mobile";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const PROFILE = {
  name: mobile.founderName,
  title: mobile.founderTitle,
  company: mobile.companyName,
  thesis:
    "I build the systems that power enterprises — from fintech platforms processing millions in transactions to maritime intelligence tracking global fleets.",
  email: mobile.email,
  phone: "+1 (202) 555-0100",
  linkedin: "https://linkedin.com/in/stephenlutar",
  location: "Washington, D.C. Metro",
};

const VENTURES = [
  {
    slug: "vessels",
    name: "Vessels",
    tagline: "Maritime Intelligence",
    description:
      "AIS fleet tracking, voyage economics, and sanctions screening covering global shipping routes.",
    url: "https://vessels.szlholdings.com",
    color: "#3b82f6",
    metrics: [
      { label: "Vessels tracked", value: "50K+" },
      { label: "Data pts/day", value: "2M+" },
      { label: "Coverage", value: "Global" },
    ],
  },
  {
    slug: "aegis",
    name: "Aegis",
    tagline: "Defense & Intelligence",
    description:
      "Unified cybersecurity command converging SOC operations, threat intel, and MSP management.",
    url: "https://aegis.szlholdings.com",
    color: "#6366f1",
    metrics: [
      { label: "Threat vectors", value: "100+" },
      { label: "Framework", value: "MITRE" },
      { label: "Response", value: "<1 min" },
    ],
  },
  {
    slug: "terra",
    name: "Terra",
    tagline: "Real Estate Intelligence",
    description:
      "Distress-first real estate platform covering all five NYC boroughs with multi-factor scoring.",
    url: "https://terra.szlholdings.com",
    color: "#10b981",
    metrics: [
      { label: "Properties", value: "500K+" },
      { label: "Coverage", value: "5 Boroughs" },
      { label: "Data sources", value: "12+" },
    ],
  },
  {
    slug: "lyte",
    name: "Lyte",
    tagline: "Business Observability",
    description:
      "AI ops dashboard with multi-model routing, cross-portfolio signal aggregation, and observability.",
    url: "https://lyte.szlholdings.com",
    color: "#06b6d4",
    metrics: [
      { label: "AI models", value: "6+" },
      { label: "Signals/hr", value: "10K+" },
      { label: "Latency", value: "<100ms" },
    ],
  },
  {
    slug: "carlota-jo",
    name: "Carlota Jo",
    tagline: "Private Advisory",
    description:
      "Strategic advisory platform for high-net-worth clients with secure communication and portal.",
    url: "https://carlota-jo.szlholdings.com",
    color: "#f59e0b",
    metrics: [
      { label: "Client portal", value: "Secure" },
      { label: "Engagement", value: "360°" },
      { label: "Advisors", value: "Dedicated" },
    ],
  },
  {
    slug: "szl-holdings",
    name: "SZL Holdings",
    tagline: "Parent Company",
    description:
      "Holding company with shared infrastructure, authentication, and execution fabric powering all platforms.",
    url: "https://szlholdings.com",
    color: "#c4a97e",
    metrics: [
      { label: "Platforms", value: "6" },
      { label: "Founded", value: "2023" },
      { label: "LOC", value: "150k+" },
    ],
  },
];

const MILESTONES = [
  {
    year: "2023",
    event: "Founded SZL Holdings",
    role: "Founder & CEO",
    company: "SZL Holdings",
    logoInitials: "SZL",
    logoColor: "#c4a97e",
    detail:
      "Established SZL Holdings as a strategic holding company to develop and operate domain-specific enterprise platforms across maritime, defense, real estate, and private advisory verticals.",
    achievement: "0 → 1: Company formation and shared infrastructure architecture",
    highlight: true,
  },
  {
    year: "2024 Q1",
    event: "Shipped Alloy — Execution Fabric",
    role: "Lead Architect",
    company: "SZL Holdings",
    logoInitials: "AL",
    logoColor: "#9ca3af",
    detail:
      "Built and shipped the core workflow orchestration and execution engine. Now the internal execution fabric powering all portfolio decision workflows and API routing.",
    achievement: "Core platform infrastructure: auth, logging, API, design system",
    highlight: false,
  },
  {
    year: "2024 Q2",
    event: "Vessels Maritime Intelligence",
    role: "Founder, Lead Engineer",
    company: "Vessels — SZL Holdings",
    logoInitials: "VS",
    logoColor: "#3b82f6",
    detail:
      "Shipped maritime fleet intelligence covering AIS tracking, exception management, voyage economics, and OFAC/UN sanctions screening for enterprise logistics operators.",
    achievement: "50K+ vessels tracked, 2M+ data points/day",
    highlight: false,
  },
  {
    year: "2024 Q2",
    event: "Lyte Command Center",
    role: "Founder, Lead Engineer",
    company: "Lyte — SZL Holdings",
    logoInitials: "LY",
    logoColor: "#06b6d4",
    detail:
      "Shipped unified AI operations dashboard with multi-model routing, PRISM intelligence methodology, and cross-portfolio signal aggregation.",
    achievement: "6+ AI models unified, <100ms P95 latency",
    highlight: false,
  },
  {
    year: "2024 Q3",
    event: "Aegis — Defense & Intelligence",
    role: "Founder, Lead Engineer",
    company: "Aegis — SZL Holdings",
    logoInitials: "AG",
    logoColor: "#6366f1",
    detail:
      "Shipped unified cybersecurity command surface converging SOC operations (Firestorm), Managed Services (Aegis Operations), and Intelligence Engine (Aegis Labs).",
    achievement: "MITRE ATT&CK mapping, <1 min automated response",
    highlight: false,
  },
  {
    year: "2024 Q3",
    event: "Terra — Real Estate Intelligence",
    role: "Founder, Lead Engineer",
    company: "Terra — SZL Holdings",
    logoInitials: "TR",
    logoColor: "#10b981",
    detail:
      "Shipped distress-first real estate intelligence platform covering all five NYC boroughs with 12+ data sources and 6–18 month lead-time signal generation.",
    achievement: "500K+ properties indexed across 5 boroughs",
    highlight: false,
  },
  {
    year: "2025",
    event: "Portfolio at full operating capacity",
    role: "Founder & CEO",
    company: "SZL Holdings",
    logoInitials: "SZL",
    logoColor: "#c4a97e",
    detail:
      "Six platforms live. Shared infrastructure compounding across all products. Alloy absorbed as internal execution engine. Carlota Jo native mobile launched.",
    achievement: "6 platforms live · 150K+ LOC · Full compound architecture",
    highlight: true,
  },
];

const CASE_STUDIES_FALLBACK: CaseStudy[] = [
  {
    id: -1,
    title: "Maritime Sanctions Screening at Scale — Vessels",
    slug: "vessels-sanctions-screening",
    summary:
      "Designed and shipped a real-time OFAC/UN sanctions screening pipeline processing 2M+ AIS data points per day across 50K+ tracked vessels. Integrated automated exception management and voyage economics for enterprise logistics operators.",
    outcome: "Zero sanctions violations missed across 18 months of live production operation.",
  },
  {
    id: -2,
    title: "Unified SOC Command Surface — Aegis",
    slug: "aegis-soc-command",
    summary:
      "Converged three disparate security toolsets (Firestorm incident response, Aegis Operations MSP management, and Aegis Labs threat intelligence) into a single operator command surface mapped to the MITRE ATT&CK framework.",
    outcome: "Mean time to containment reduced from 18 minutes to under 60 seconds.",
  },
  {
    id: -3,
    title: "Distress-First Real Estate Intelligence — Terra",
    slug: "terra-distress-signals",
    summary:
      "Built a multi-factor distress scoring engine across all five NYC boroughs aggregating 12+ public data sources — including tax liens, foreclosure filings, HPD violations, and zoning changes — to surface acquisition targets 6–18 months before market-wide discovery.",
    outcome: "500K+ properties indexed. First-mover advantage on distress pipeline delivered to institutional clients.",
  },
];

const ARTICLES_FALLBACK: Article[] = [
  {
    id: -1,
    title: "Infrastructure First: Why I Build Shared Platforms Before Products",
    slug: "infrastructure-first",
    excerpt:
      "The conventional wisdom is to build an MVP and iterate. I do the opposite — I build the infrastructure layer first. Here's why that compound investment changes everything.",
    summary:
      "The conventional wisdom is to build an MVP and iterate. I do the opposite — I build the infrastructure layer first.",
    publishedAt: "2025-01-15T00:00:00Z",
    readingTime: 6,
    tags: ["architecture", "strategy"],
  },
  {
    id: -2,
    title: "Governed Autonomy: The AI Governance Model That Actually Works in Enterprise",
    slug: "governed-autonomy",
    excerpt:
      "AI agents that act without approval are a liability. AI agents that require approval for everything are useless. The answer is a tiered guardian model — and it's the core of how CORTEX operates.",
    summary:
      "AI agents that act without approval are a liability. AI agents that require approval for everything are useless. The answer is a tiered guardian model.",
    publishedAt: "2025-03-01T00:00:00Z",
    readingTime: 8,
    tags: ["AI", "governance"],
  },
  {
    id: -3,
    title: "What Maritime Intelligence Taught Me About Enterprise Data Architecture",
    slug: "maritime-intelligence-data",
    excerpt:
      "Tracking 50,000 vessels in real time across global shipping lanes is a data architecture problem before it's anything else. Here's what I learned building Vessels.",
    summary:
      "Tracking 50,000 vessels in real time across global shipping lanes is a data architecture problem before it's anything else.",
    publishedAt: "2024-11-10T00:00:00Z",
    readingTime: 7,
    tags: ["data", "maritime"],
  },
];

const THESIS_FALLBACK = [
  {
    label: "Infrastructure First",
    content:
      "Every platform in the SZL portfolio is built on shared, composable infrastructure. Authentication, logging, payments, AI routing — built once, deployed everywhere. The marginal cost of each new platform approaches zero.",
  },
  {
    label: "Domain Depth",
    content:
      "I don't build horizontal SaaS. Each platform goes deep into a specific domain: maritime regulations, cybersecurity frameworks, real estate distress signals. Depth creates defensibility.",
  },
  {
    label: "Operator Mindset",
    content:
      "I build what I would use myself. Every feature in the portfolio solves a problem I've personally encountered running enterprise infrastructure. No guesswork — just solutions to real pain points.",
  },
  {
    label: "Compound Architecture",
    content:
      "The real moat is the compounding nature of the portfolio. Data from Vessels informs Aegis. Lyte observes all of them. The whole is exponentially more valuable than the sum of its parts.",
  },
];

const CONTACT_PURPOSE_OPTIONS: { label: string; type: string }[] = [
  { label: "Investment", type: "investment" },
  { label: "Partnership", type: "partnership" },
  { label: "Advisory", type: "consultation" },
  { label: "Media", type: "other" },
];

const SECTIONS: Section[] = [
  { id: "card", label: "Card" },
  { id: "portfolio", label: "Portfolio" },
  { id: "case-studies", label: "Work" },
  { id: "thesis", label: "Thesis" },
  { id: "writing", label: "Writing" },
  { id: "career", label: "Career" },
  { id: "contact", label: "Contact" },
];

const VENTURE_CARD_WIDTH = Math.min(SCREEN_WIDTH - 56, 300);
const THESIS_CARD_WIDTH = Math.min(SCREEN_WIDTH - 40, 320);
const CONTENT_CARD_WIDTH = Math.min(SCREEN_WIDTH - 40, 320);

type CaseStudy = {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  outcome?: string | null;
};

type Article = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  summary?: string | null;
  publishedAt?: string | null;
  readingTime?: number | null;
  tags?: string[] | null;
};

type ContentBlock = {
  id: number;
  type: string;
  title?: string | null;
  body?: string | null;
  sortOrder?: number | null;
};

function useApiBase() {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
}

function useCaseStudies() {
  const base = useApiBase();
  return useQuery<CaseStudy[]>({
    queryKey: ["cms-case-studies"],
    queryFn: async () => {
      const res = await fetch(`${base}/api/cms/case-studies?limit=10`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return (json.data ?? json) as CaseStudy[];
    },
    retry: 1,
  });
}

function useArticles() {
  const base = useApiBase();
  return useQuery<Article[]>({
    queryKey: ["cms-articles"],
    queryFn: async () => {
      const res = await fetch(`${base}/api/cms/articles?limit=10`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return (json.data ?? json) as Article[];
    },
    retry: 1,
  });
}

function useThesisBlocks() {
  const base = useApiBase();
  return useQuery<ContentBlock[]>({
    queryKey: ["stephen-thesis-blocks"],
    queryFn: async () => {
      const res = await fetch(`${base}/api/stephen/content-blocks?type=thesis`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return (json.data ?? json) as ContentBlock[];
    },
    retry: 1,
  });
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollY = useSharedValue(0);
  const [activeSection, setActiveSection] = useState("card");
  const [activeVentureIdx, setActiveVentureIdx] = useState(0);
  const [activeThesisIdx, setActiveThesisIdx] = useState(0);
  const [activePurposeIdx, setActivePurposeIdx] = useState(0);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const sectionRefs = useRef<{ [key: string]: number }>({});

  const { data: caseStudies, isLoading: csLoading } = useCaseStudies();
  const { data: articles, isLoading: artLoading } = useArticles();
  const { data: thesisBlocks } = useThesisBlocks();

  const base = useApiBase();

  const { data: holdingsKpis } = useQuery<{
    platforms?: {
      vessels?: { trackedVessels?: number };
      terra?: { distressProperties?: number; activeDeals?: number };
    };
  }>({
    queryKey: ["founder-holdings-kpis"],
    queryFn: async () => {
      const res = await fetch(`${base}/api/holdings/kpis`, { credentials: "include" });
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: 120_000,
    retry: false,
    enabled: !!base,
  });

  const liveVesselCount = holdingsKpis?.platforms?.vessels?.trackedVessels;

  const ventures = VENTURES.map((v) => {
    if (v.slug === "vessels" && liveVesselCount != null) {
      return { ...v, metrics: v.metrics.map(m => m.label === "Vessels tracked" ? { ...m, value: liveVesselCount.toLocaleString() } : m) };
    }
    const liveDistress = holdingsKpis?.platforms?.terra?.distressProperties;
    if (v.slug === "terra" && liveDistress != null) {
      return { ...v, metrics: v.metrics.map(m => m.label === "Properties" ? { ...m, value: liveDistress.toLocaleString() } : m) };
    }
    return v;
  });

  const thesisItems =
    thesisBlocks && thesisBlocks.length > 0
      ? thesisBlocks.map((b) => ({ label: b.title ?? "", content: b.body ?? "" }))
      : THESIS_FALLBACK;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      "worklet";
      scrollY.value = event.contentOffset.y;
    },
  });

  const updateActiveSectionFromScroll = useCallback((y: number) => {
    const refs = sectionRefs.current;
    const keys = Object.keys(refs);
    if (keys.length === 0) return;
    let active = keys[0];
    for (const key of keys) {
      if (refs[key] <= y + 120) active = key;
    }
    setActiveSection(active);
  }, []);

  const navStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [0, 1], Extrapolation.CLAMP),
  }));

  const heroSubtitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 120], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, 120], [0, -16], Extrapolation.CLAMP),
      },
    ],
  }));

  const scrollToSection = useCallback((sectionId: string) => {
    const offset = sectionRefs.current[sectionId];
    if (offset !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({ y: offset, animated: true });
      setActiveSection(sectionId);
      Haptics.selectionAsync();
    }
  }, []);

  const handleSectionLayout = useCallback(
    (sectionId: string) =>
      (event: { nativeEvent: { layout: { y: number } } }) => {
        sectionRefs.current[sectionId] = event.nativeEvent.layout.y;
      },
    []
  );

  const handleEmail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`mailto:${PROFILE.email}`);
  };

  const handleLinkedIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(PROFILE.linkedin);
  };

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${PROFILE.phone}`);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const vCard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${PROFILE.name}`,
      `N:Lutar;Stephen;;;`,
      `ORG:${PROFILE.company}`,
      `TITLE:${PROFILE.title}`,
      `EMAIL;TYPE=WORK:${PROFILE.email}`,
      `TEL;TYPE=WORK:${PROFILE.phone}`,
      `URL:https://stephenlutar.com`,
      `URL:${PROFILE.linkedin}`,
      `ADR;TYPE=WORK:;;Washington D.C. Metro;;;;US`,
      `NOTE:Founder & CEO, SZL Holdings — Maritime Intelligence · Cybersecurity · Real Estate · AI Ops`,
      "END:VCARD",
    ].join("\n");

    const shareText = [
      `${PROFILE.name}`,
      `${PROFILE.title} · ${PROFILE.company}`,
      "",
      `Email: ${PROFILE.email}`,
      `Phone: ${PROFILE.phone}`,
      `LinkedIn: ${PROFILE.linkedin}`,
      `Web: https://stephenlutar.com`,
      "",
      "SZL Holdings Portfolio:",
      "• Vessels — Maritime Fleet Intelligence",
      "• Aegis — Cybersecurity Command",
      "• Terra — Real Estate Intelligence",
      "• Lyte — AI Operations Platform",
      "• Carlota Jo — Private Advisory",
    ].join("\n");

    try {
      if (Platform.OS === "web") {
        Alert.alert(
          "Stephen Lutar — Founder Card",
          shareText,
          [{ text: "Copy to Clipboard", onPress: () => {} }, { text: "Done" }]
        );
        return;
      }
      await Share.share({
        title: `${PROFILE.name} — Founder Card`,
        message: Platform.OS === "ios" ? vCard : shareText,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      /* ignore cancel */
    }
  };

  const handleViewLive = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
  };

  const handleVentureDetail = (slug: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/venture/[slug]", params: { slug } } as any);
  };

  const handleArticleDetail = (slug: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/article/[slug]", params: { slug } } as any);
  };

  const handleContactSubmit = async () => {
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    if (!contactEmail.includes("@")) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitting(true);
    try {
      const purpose = CONTACT_PURPOSE_OPTIONS[activePurposeIdx];
      const res = await fetch(`${base}/api/stephen/booking-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName.trim(),
          email: contactEmail.trim(),
          type: purpose.type,
          message: contactMessage.trim(),
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setContactName("");
        setContactEmail("");
        setContactMessage("");
      } else {
        Alert.alert("Error", "Failed to send message. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const navHeight = 44;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.navFixed,
          navStyle,
          { top: topPad, borderBottomColor: colors.border },
        ]}
      >
        {isIOS ? (
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(10,10,10,0.92)" }]}
          />
        )}
        <SectionNav
          sections={SECTIONS}
          activeSection={activeSection}
          onSectionPress={scrollToSection}
        />
      </Animated.View>

      <Animated.ScrollView
        ref={scrollRef}
        onScroll={scrollHandler}
        onScrollEndDrag={(e) => updateActiveSectionFromScroll(e.nativeEvent.contentOffset.y)}
        onMomentumScrollEnd={(e) => updateActiveSectionFromScroll(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: (isWeb ? 34 : insets.bottom) + 100 }}
        nestedScrollEnabled
      >
        <View
          onLayout={handleSectionLayout("card")}
          style={[styles.heroSection, { paddingTop: topPad + navHeight + 12 }]}
        >
          <LinearGradient
            colors={["rgba(196,169,126,0.08)", "transparent"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />

          <HeroPulseRings colors={colors} />

          <View style={styles.avatarContainer}>
            <View style={[styles.avatarRing, { borderColor: colors.silverBorder }]}>
              <FounderAvatar colors={colors} />
            </View>
            <View
              style={[styles.statusDot, { backgroundColor: "#10b981", borderColor: colors.background }]}
            />
          </View>

          <Text style={[styles.heroName, { color: colors.foreground }]}>{PROFILE.name}</Text>
          <Text style={[styles.heroTitle, { color: colors.silver }]}>
            {PROFILE.title} — {PROFILE.company}
          </Text>
          <Text style={[styles.heroLocation, { color: colors.mutedForeground }]}>
            {PROFILE.location}
          </Text>

          <Animated.View style={heroSubtitleStyle}>
            <Text style={[styles.heroThesis, { color: colors.mutedForeground }]}>
              {PROFILE.thesis}
            </Text>
          </Animated.View>

          <View style={styles.actionRow}>
            <ActionButton icon="mail-outline" label="Email" onPress={handleEmail} primary colors={colors} />
            <ActionButton icon="logo-linkedin" label="LinkedIn" onPress={handleLinkedIn} colors={colors} />
            <ActionButton icon="call-outline" label="Call" onPress={handleCall} colors={colors} />
            <ActionButton icon="share-outline" label="vCard" onPress={handleShare} colors={colors} />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.statRow}>
            {[
              { value: "6", label: "Platforms" },
              { value: "150k+", label: "Lines of code" },
              { value: "2yr", label: "Build time" },
            ].map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.silver }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View onLayout={handleSectionLayout("portfolio")} style={styles.section}>
          <SectionHeader label="Portfolio" subtitle="Six platforms. One architecture." colors={colors} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
            decelerationRate="fast"
            snapToInterval={VENTURE_CARD_WIDTH + 16}
            snapToAlignment="start"
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / (VENTURE_CARD_WIDTH + 16)
              );
              setActiveVentureIdx(Math.max(0, Math.min(idx, ventures.length - 1)));
            }}
            nestedScrollEnabled
          >
            {ventures.map((venture) => (
              <VentureCard
                key={venture.slug}
                venture={venture}
                colors={colors}
                onViewLive={handleViewLive}
                onDetail={handleVentureDetail}
              />
            ))}
          </ScrollView>
          <View style={styles.dotIndicatorRow}>
            {ventures.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dotIndicator,
                  {
                    backgroundColor: i === activeVentureIdx ? colors.silver : colors.border,
                    width: i === activeVentureIdx ? 16 : 6,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <View onLayout={handleSectionLayout("case-studies")} style={styles.section}>
          <SectionHeader label="Work" subtitle="Case studies" colors={colors} />
          {csLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.silver} />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
              decelerationRate="fast"
              snapToInterval={CONTENT_CARD_WIDTH + 16}
              snapToAlignment="start"
              nestedScrollEnabled
            >
              {(caseStudies && caseStudies.length > 0 ? caseStudies : CASE_STUDIES_FALLBACK).map((cs) => (
                <CaseStudyCard
                  key={cs.id}
                  study={cs}
                  colors={colors}
                  onPress={() => handleArticleDetail(cs.slug)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        <View onLayout={handleSectionLayout("thesis")} style={styles.section}>
          <SectionHeader label="Thesis" subtitle="The SZL Doctrine" colors={colors} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
            decelerationRate="fast"
            snapToInterval={THESIS_CARD_WIDTH + 16}
            snapToAlignment="start"
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / (THESIS_CARD_WIDTH + 16)
              );
              setActiveThesisIdx(Math.max(0, Math.min(idx, thesisItems.length - 1)));
            }}
            nestedScrollEnabled
          >
            {thesisItems.map((point) => (
              <ThesisCard key={point.label} point={point} colors={colors} />
            ))}
          </ScrollView>
          <View style={styles.dotIndicatorRow}>
            {thesisItems.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dotIndicator,
                  {
                    backgroundColor: i === activeThesisIdx ? colors.silver : colors.border,
                    width: i === activeThesisIdx ? 16 : 6,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <View onLayout={handleSectionLayout("writing")} style={styles.section}>
          <SectionHeader label="Writing" subtitle="Thought leadership" colors={colors} />
          {artLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.silver} />
            </View>
          ) : (
            <View style={{ paddingHorizontal: 20, gap: 12 }}>
              {(articles && articles.length > 0 ? articles : ARTICLES_FALLBACK).slice(0, 5).map((article) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  colors={colors}
                  onPress={() => handleArticleDetail(article.slug)}
                />
              ))}
            </View>
          )}
        </View>

        <View onLayout={handleSectionLayout("career")} style={styles.section}>
          <SectionHeader label="Career" subtitle="Builder timeline" colors={colors} />
          <View style={{ paddingHorizontal: 20 }}>
            {MILESTONES.map((milestone, i) => (
              <AnimatedMilestoneItem
                key={milestone.year + milestone.event}
                milestone={milestone}
                isLast={i === MILESTONES.length - 1}
                index={i}
                colors={colors}
              />
            ))}
          </View>
        </View>

        <View onLayout={handleSectionLayout("contact")} style={styles.section}>
          <SectionHeader label="Contact" subtitle="Let's connect" colors={colors} />

          {submitted ? (
            <View
              style={[
                styles.successBox,
                { backgroundColor: colors.card, borderColor: colors.silverBorder },
              ]}
            >
              <Ionicons name="checkmark-circle" size={32} color={colors.silver} style={{ marginBottom: 12 }} />
              <Text style={[styles.successTitle, { color: colors.foreground }]}>
                Message received
              </Text>
              <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                I'll be in touch within 48 hours.
              </Text>
              <TouchableOpacity
                style={[styles.resetBtn, { borderColor: colors.border }]}
                onPress={() => setSubmitted(false)}
              >
                <Text style={[styles.resetBtnText, { color: colors.mutedForeground }]}>
                  Send another
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 20 }}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Purpose</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.purposeRow}>
                  {CONTACT_PURPOSE_OPTIONS.map((p, idx) => (
                    <TouchableOpacity
                      key={p.label}
                      onPress={() => {
                        setActivePurposeIdx(idx);
                        Haptics.selectionAsync();
                      }}
                      style={[
                        styles.purposeChip,
                        {
                          borderColor: activePurposeIdx === idx ? colors.silver : colors.border,
                          backgroundColor: activePurposeIdx === idx ? colors.silverDim : colors.card,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.purposeText,
                          {
                            color: activePurposeIdx === idx ? colors.silver : colors.mutedForeground,
                          },
                        ]}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Name</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border },
                ]}
                value={contactName}
                onChangeText={setContactName}
                placeholder="Your name"
                placeholderTextColor={colors.mutedForeground}
              />

              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border },
                ]}
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder="your@email.com"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Message</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border },
                ]}
                value={contactMessage}
                onChangeText={setContactMessage}
                placeholder="Tell me about your project or inquiry..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: colors.silver, opacity: submitting ? 0.7 : 1 },
                ]}
                onPress={handleContactSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={[styles.submitBtnText, { color: colors.background }]}>
                    Send message
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareRow} onPress={handleShare}>
                <Feather name="share-2" size={14} color={colors.mutedForeground} />
                <Text style={[styles.shareText, { color: colors.mutedForeground }]}>
                  Share vCard
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      <LinearGradient
        colors={["rgba(10,10,10,1)", "transparent"]}
        style={[styles.topFade, { height: topPad + 8 }]}
        pointerEvents="none"
      />
    </View>
  );
}

function HeroPulseRings({ colors }: { colors: ReturnType<typeof useColors> }) {
  const pulse1 = useSharedValue(0.7);
  const pulse2 = useSharedValue(0.5);

  useEffect(() => {
    pulse1.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    pulse2.value = withRepeat(
      withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const ring1Style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse1.value, [0.7, 1], [0.06, 0.14], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(pulse1.value, [0.7, 1], [0.95, 1.05], Extrapolation.CLAMP) }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse2.value, [0.5, 1], [0.04, 0.10], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(pulse2.value, [0.5, 1], [0.9, 1.1], Extrapolation.CLAMP) }],
  }));

  return (
    <View style={styles.pulseContainer} pointerEvents="none">
      <Animated.View style={[styles.pulseRing, styles.pulseRing1, { borderColor: colors.silver }, ring1Style]} />
      <Animated.View style={[styles.pulseRing, styles.pulseRing2, { borderColor: colors.silver }, ring2Style]} />
    </View>
  );
}

function FounderAvatar({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [imgError, setImgError] = useState(false);
  if (!imgError) {
    return (
      <Image
        source={{ uri: "https://stephenlutar.com/opengraph.jpg" }}
        style={styles.avatarPlaceholder}
        resizeMode="cover"
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <LinearGradient
      colors={[colors.silver, "rgba(196,169,126,0.3)"]}
      style={styles.avatarPlaceholder}
    >
      <Text style={[styles.avatarInitials, { color: colors.background }]}>SL</Text>
    </LinearGradient>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  primary,
  colors,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  primary?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPressIn={() => { scale.value = withSpring(0.93, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        onPress={onPress}
        style={[
          styles.actionBtn,
          primary
            ? { backgroundColor: colors.silver }
            : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
        ]}
      >
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={18}
          color={primary ? colors.background : colors.foreground}
        />
        <Text style={[styles.actionBtnText, { color: primary ? colors.background : colors.foreground }]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function VentureScreenshot({
  venture,
  colors,
}: {
  venture: (typeof VENTURES)[0];
  colors: ReturnType<typeof useColors>;
}) {
  const mockRows = [
    { w: "70%", h: 8 },
    { w: "90%", h: 6 },
    { w: "55%", h: 6 },
  ];
  const mockStats = venture.metrics.slice(0, 2);
  return (
    <View style={[styles.screenshotFrame, { backgroundColor: "#0a0a0a", borderColor: venture.color + "30" }]}>
      <View style={[styles.screenshotChrome, { backgroundColor: venture.color + "15" }]}>
        <View style={[styles.screenshotDot, { backgroundColor: venture.color }]} />
        <View style={[styles.screenshotUrlBar, { backgroundColor: venture.color + "20" }]}>
          <Text style={[styles.screenshotUrl, { color: venture.color + "99" }]}>
            {venture.slug}.szlholdings.com
          </Text>
        </View>
      </View>
      <View style={styles.screenshotContent}>
        <View style={styles.screenshotSidebar}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.screenshotSidebarItem,
                { backgroundColor: i === 0 ? venture.color + "30" : venture.color + "10" },
              ]}
            />
          ))}
        </View>
        <View style={{ flex: 1, paddingLeft: 8 }}>
          {mockRows.map((r, i) => (
            <View
              key={i}
              style={[
                styles.screenshotRow,
                { width: r.w as `${number}%`, height: r.h, backgroundColor: venture.color + "20" },
              ]}
            />
          ))}
          <View style={styles.screenshotStatRow}>
            {mockStats.map((m) => (
              <View
                key={m.label}
                style={[styles.screenshotStat, { backgroundColor: venture.color + "15", borderColor: venture.color + "25" }]}
              >
                <Text style={[styles.screenshotStatVal, { color: venture.color }]}>{m.value}</Text>
                <Text style={[styles.screenshotStatLabel, { color: venture.color + "80" }]}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function VentureCard({
  venture,
  colors,
  onViewLive,
  onDetail,
}: {
  venture: (typeof VENTURES)[0];
  colors: ReturnType<typeof useColors>;
  onViewLive: (url: string) => void;
  onDetail: (slug: string) => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => onDetail(venture.slug)}
      activeOpacity={0.85}
      style={[styles.ventureCard, { backgroundColor: colors.card, borderColor: colors.border, width: VENTURE_CARD_WIDTH }]}
    >
      <VentureScreenshot venture={venture} colors={colors} />
      <View style={styles.ventureCardInner}>
        <View style={styles.ventureHeader}>
          <View style={[styles.ventureDot, { backgroundColor: venture.color }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.ventureName, { color: colors.foreground }]}>{venture.name}</Text>
            <Text style={[styles.ventureTagline, { color: venture.color }]}>{venture.tagline}</Text>
          </View>
        </View>
        <Text style={[styles.ventureDesc, { color: colors.mutedForeground }]}>{venture.description}</Text>
        <View style={styles.metricsRow}>
          {venture.metrics.map((m) => (
            <View key={m.label} style={[styles.metricItem, { borderColor: colors.border }]}>
              <Text style={[styles.metricValue, { color: colors.foreground }]}>{m.value}</Text>
              <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.ventureActions}>
          <TouchableOpacity
            style={[styles.viewDetailBtn, { borderColor: colors.silverBorder }]}
            onPress={() => onDetail(venture.slug)}
          >
            <Text style={[styles.viewDetailText, { color: colors.silver }]}>View Detail</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewLiveIconBtn} onPress={() => onViewLive(venture.url)}>
            <Feather name="external-link" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function CaseStudyCard({
  study,
  colors,
  onPress,
}: {
  study: CaseStudy;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.contentCard, { backgroundColor: colors.card, borderColor: colors.border, width: CONTENT_CARD_WIDTH }]}
    >
      <View style={[styles.csBadge, { backgroundColor: colors.silverDim }]}>
        <Text style={[styles.csBadgeText, { color: colors.silver }]}>Case Study</Text>
      </View>
      <Text style={[styles.csTitle, { color: colors.foreground }]} numberOfLines={2}>{study.title}</Text>
      {study.summary ? (
        <Text style={[styles.csSummary, { color: colors.mutedForeground }]} numberOfLines={4}>{study.summary}</Text>
      ) : null}
      {study.outcome ? (
        <View style={[styles.outcomeRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.outcomeLabel, { color: colors.silver }]}>Outcome</Text>
          <Text style={[styles.outcomeText, { color: colors.mutedForeground }]} numberOfLines={2}>{study.outcome}</Text>
        </View>
      ) : null}
      <View style={styles.readMoreRow}>
        <Text style={[styles.readMoreText, { color: colors.silver }]}>Read more</Text>
        <Feather name="arrow-right" size={12} color={colors.silver} />
      </View>
    </TouchableOpacity>
  );
}

function ArticleRow({
  article,
  colors,
  onPress,
}: {
  article: Article;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.articleRow, { borderColor: colors.border, backgroundColor: colors.card }]}
    >
      <View style={styles.articleContent}>
        <Text style={[styles.articleTitle, { color: colors.foreground }]} numberOfLines={2}>{article.title}</Text>
        {(article.excerpt ?? article.summary) ? (
          <Text style={[styles.articleExcerpt, { color: colors.mutedForeground }]} numberOfLines={2}>
            {article.excerpt ?? article.summary}
          </Text>
        ) : null}
        {article.readingTime ? (
          <Text style={[styles.articleMetaText, { color: colors.mutedForeground }]}>{article.readingTime} min read</Text>
        ) : null}
      </View>
      <Feather name="arrow-right" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

function ThesisCard({
  point,
  colors,
}: {
  point: { label: string; content: string };
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.thesisCard, { backgroundColor: colors.card, borderColor: colors.border, width: THESIS_CARD_WIDTH }]}>
      <View style={[styles.thesisAccent, { backgroundColor: colors.silver }]} />
      <Text style={[styles.thesisLabel, { color: colors.silver }]}>{point.label}</Text>
      <Text style={[styles.thesisContent, { color: colors.mutedForeground }]}>{point.content}</Text>
    </View>
  );
}

function AnimatedMilestoneItem({
  milestone,
  isLast,
  index,
  colors,
}: {
  milestone: (typeof MILESTONES)[0];
  isLast: boolean;
  index: number;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()} style={styles.milestoneRow}>
      <View style={styles.milestoneLeft}>
        <View
          style={[
            styles.milestoneDot,
            milestone.highlight
              ? { backgroundColor: colors.silver }
              : { backgroundColor: "transparent", borderColor: colors.border, borderWidth: 1 },
          ]}
        />
        {!isLast && <View style={[styles.milestoneLine, { backgroundColor: colors.border }]} />}
      </View>
      <View style={styles.milestoneContent}>
        <View style={styles.milestoneYearRow}>
          <Text style={[styles.milestoneYear, { color: colors.silver }]}>{milestone.year}</Text>
          <View style={[styles.milestoneRoleBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.milestoneRoleText, { color: colors.mutedForeground }]} numberOfLines={1}>
              {milestone.role}
            </Text>
          </View>
        </View>
        <View style={styles.milestoneCompanyRow}>
          <View
            style={[
              styles.companyLogoBadge,
              { backgroundColor: milestone.logoColor + "20", borderColor: milestone.logoColor + "50" },
            ]}
          >
            <Text style={[styles.companyLogoText, { color: milestone.logoColor }]}>{milestone.logoInitials}</Text>
          </View>
          <Text style={[styles.milestoneCompany, { color: colors.silverSubtle }]}>{milestone.company}</Text>
        </View>
        <Text style={[styles.milestoneEvent, { color: colors.foreground }]}>{milestone.event}</Text>
        <Text style={[styles.milestoneDetail, { color: colors.mutedForeground }]}>{milestone.detail}</Text>
        <View style={[styles.achievementBadge, { backgroundColor: colors.silverDim, borderColor: colors.silverBorder }]}>
          <Feather name="award" size={10} color={colors.silver} />
          <Text style={[styles.achievementText, { color: colors.silver }]} numberOfLines={1}>
            {milestone.achievement}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

function SectionHeader({
  label,
  subtitle,
  colors,
}: {
  label: string;
  subtitle: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionLabel, { color: colors.silverSubtle }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.sectionSubtitle, { color: colors.foreground }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  navFixed: { position: "absolute", left: 0, right: 0, height: 44, zIndex: 100, borderBottomWidth: 1 },
  topFade: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 50 },
  heroSection: { alignItems: "center", paddingBottom: 40, paddingHorizontal: 24, position: "relative", overflow: "hidden" },
  pulseContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" },
  pulseRing: { position: "absolute", borderRadius: 9999, borderWidth: 1 },
  pulseRing1: { width: 220, height: 220 },
  pulseRing2: { width: 320, height: 320 },
  avatarContainer: { position: "relative", marginBottom: 16 },
  avatarRing: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, padding: 3, justifyContent: "center", alignItems: "center" },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center" },
  avatarInitials: { fontSize: 28, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  statusDot: { position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  heroName: { fontSize: 26, fontFamily: "Inter_600SemiBold", letterSpacing: -0.5, marginBottom: 4, textAlign: "center" },
  heroTitle: { fontSize: 13, fontFamily: "Inter_500Medium", letterSpacing: 0.5, marginBottom: 4, textAlign: "center" },
  heroLocation: { fontSize: 11, fontFamily: "Inter_400Regular", letterSpacing: 1, marginBottom: 16, textAlign: "center" },
  heroThesis: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, textAlign: "center", marginBottom: 24, paddingHorizontal: 8 },
  actionRow: { flexDirection: "row", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 28 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8 },
  actionBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  divider: { height: 1, width: "100%", marginBottom: 20 },
  statRow: { flexDirection: "row", gap: 24, justifyContent: "center" },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 20, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 0.8, textTransform: "uppercase" },
  section: { paddingTop: 40, paddingBottom: 12 },
  sectionHeader: { paddingHorizontal: 20, marginBottom: 20 },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 2, marginBottom: 6 },
  sectionSubtitle: { fontSize: 22, fontFamily: "Inter_600SemiBold", letterSpacing: -0.3 },
  loadingRow: { alignItems: "center", paddingVertical: 32 },
  emptyState: { marginHorizontal: 20, borderWidth: 1, borderRadius: 12, paddingVertical: 32, alignItems: "center", borderStyle: "dashed" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  ventureCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  ventureCardInner: { padding: 20 },
  ventureHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  ventureDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  ventureName: { fontSize: 20, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  ventureTagline: { fontSize: 10, fontFamily: "Inter_500Medium", letterSpacing: 1, textTransform: "uppercase" },
  ventureDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 16 },
  metricsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  metricItem: { flex: 1, borderWidth: 1, borderRadius: 6, padding: 8, alignItems: "center" },
  metricValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  metricLabel: { fontSize: 9, fontFamily: "Inter_400Regular", letterSpacing: 0.5, textAlign: "center" },
  ventureActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  viewDetailBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 14, flex: 1, justifyContent: "center" },
  viewDetailText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  viewLiveIconBtn: { borderRadius: 6, padding: 9 },
  contentCard: { borderRadius: 12, borderWidth: 1, padding: 20 },
  csBadge: { alignSelf: "flex-start", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 10 },
  csBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  csTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginBottom: 8, lineHeight: 22 },
  csSummary: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 12 },
  outcomeRow: { borderTopWidth: 1, paddingTop: 12, marginBottom: 12 },
  outcomeLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 4 },
  outcomeText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  readMoreRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  readMoreText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  articleRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, padding: 14, gap: 12 },
  articleContent: { flex: 1 },
  articleTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 4, lineHeight: 20 },
  articleExcerpt: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 6 },
  articleMetaText: { fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 0.5 },
  thesisCard: { borderRadius: 12, borderWidth: 1, padding: 24, position: "relative", overflow: "hidden" },
  thesisAccent: { position: "absolute", top: 0, left: 0, width: 3, bottom: 0, borderRadius: 1.5 },
  thesisLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 12, letterSpacing: 0.3 },
  thesisContent: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  dotIndicatorRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, paddingTop: 16 },
  dotIndicator: { height: 6, borderRadius: 3 },
  milestoneRow: { flexDirection: "row", gap: 16 },
  milestoneLeft: { alignItems: "center", width: 14 },
  milestoneDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  milestoneLine: { width: 1, flex: 1, marginTop: 6, minHeight: 24 },
  milestoneContent: { flex: 1, paddingBottom: 28 },
  milestoneYearRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  milestoneYear: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  milestoneRoleBadge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, maxWidth: 200 },
  milestoneRoleText: { fontSize: 9, fontFamily: "Inter_400Regular", letterSpacing: 0.3 },
  milestoneCompany: { fontSize: 10, fontFamily: "Inter_500Medium", letterSpacing: 0.8, marginBottom: 4, textTransform: "uppercase" },
  milestoneEvent: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 6, lineHeight: 20 },
  milestoneDetail: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 10 },
  milestoneCompanyRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  companyLogoBadge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  companyLogoText: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  achievementBadge: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", borderRadius: 4, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3 },
  achievementText: { fontSize: 10, fontFamily: "Inter_500Medium", letterSpacing: 0.3 },
  screenshotFrame: { borderRadius: 8, borderWidth: 1, margin: 16, marginBottom: 0, overflow: "hidden" },
  screenshotChrome: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 5, gap: 6 },
  screenshotDot: { width: 6, height: 6, borderRadius: 3 },
  screenshotUrlBar: { flex: 1, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2 },
  screenshotUrl: { fontSize: 8 },
  screenshotContent: { flexDirection: "row", padding: 8, gap: 6, height: 70 },
  screenshotSidebar: { width: 20, gap: 4 },
  screenshotSidebarItem: { height: 8, borderRadius: 2 },
  screenshotRow: { borderRadius: 2, marginBottom: 4 },
  screenshotStatRow: { flexDirection: "row", gap: 4, marginTop: 4 },
  screenshotStat: { flex: 1, borderRadius: 4, borderWidth: 1, padding: 3, alignItems: "center" },
  screenshotStatVal: { fontSize: 7, fontWeight: "700" },
  screenshotStatLabel: { fontSize: 5 },
  successBox: { marginHorizontal: 20, borderRadius: 16, borderWidth: 1, padding: 28, alignItems: "center" },
  successTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  successSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 20 },
  resetBtn: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 10 },
  resetBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  inputLabel: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 0.5, marginBottom: 6, marginTop: 16 },
  purposeRow: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  purposeChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  purposeText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  textArea: { height: 100, paddingTop: 12 },
  submitBtn: { marginTop: 20, borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  submitBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  shareRow: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 16, paddingBottom: 8 },
  shareText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  ventureAccentStrip: { height: 3 },
});
