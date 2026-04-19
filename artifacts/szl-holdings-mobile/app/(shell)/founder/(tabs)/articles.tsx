import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { formatDate as formatSharedDate } from "@szl-holdings/mobile-shared/utils";

const ACCENT = "#6366f1";
const BG = "#0a0a0a";
const BORDER = "rgba(255,255,255,0.06)";
const TEXT = "#e8e8f0";
const TEXT_DIM = "rgba(255,255,255,0.45)";

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

function useApiBase() {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
}

function useArticles() {
  const base = useApiBase();
  return useQuery<Article[]>({
    queryKey: ["cms-articles"],
    queryFn: async () => {
      const res = await fetch(`${base}/api/cms/articles?limit=20`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return (json.data ?? json) as Article[];
    },
    retry: 1,
  });
}

const ARTICLES_FALLBACK: Article[] = [
  {
    id: -1,
    title: "Infrastructure First: Why I Build Shared Platforms Before Products",
    slug: "infrastructure-first",
    excerpt:
      "The conventional wisdom is to build an MVP and iterate. I do the opposite — I build the infrastructure layer first. Here's why that compound investment changes everything.",
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
    publishedAt: "2024-11-10T00:00:00Z",
    readingTime: 7,
    tags: ["data", "maritime"],
  },
  {
    id: -4,
    title: "The Compound Architecture Thesis: One Platform, Six Products",
    slug: "compound-architecture-thesis",
    excerpt:
      "When you build the authentication layer once and deploy it six times, the math changes. This is the thesis behind SZL Holdings and why every platform we ship gets cheaper to build.",
    publishedAt: "2024-08-20T00:00:00Z",
    readingTime: 5,
    tags: ["strategy", "architecture"],
  },
];

function formatDate(iso?: string | null) {
  if (!iso) return "";
  try {
    return formatSharedDate(new Date(iso));
  } catch {
    return "";
  }
}

export default function ArticlesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: articles, isLoading } = useArticles();

  const displayArticles = articles && articles.length > 0 ? articles : ARTICLES_FALLBACK;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={["rgba(99,102,241,0.08)", "transparent"]}
        style={styles.headerGradient}
        pointerEvents="none"
      />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Articles</Text>
        <Text style={styles.headerSub}>Thought leadership & writing</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && (
          <View style={styles.centerState}>
            <ActivityIndicator color={ACCENT} size="small" />
            <Text style={styles.stateText}>Loading articles…</Text>
          </View>
        )}
        {!isLoading &&
          displayArticles.map((article, i) => (
            <TouchableOpacity
              key={article.id}
              activeOpacity={0.85}
              style={[styles.articleRow, i === displayArticles.length - 1 && styles.lastRow]}
              onPress={() => router.push({ pathname: "/article/[slug]", params: { slug: article.slug } } as any)}
            >
              <View style={styles.articleContent}>
                <Text style={styles.articleTitle} numberOfLines={2}>
                  {article.title}
                </Text>
                {(article.excerpt || article.summary) ? (
                  <Text style={styles.articleExcerpt} numberOfLines={2}>
                    {article.excerpt ?? article.summary}
                  </Text>
                ) : null}
                <View style={styles.articleMeta}>
                  {article.publishedAt ? (
                    <Text style={styles.metaText}>{formatDate(article.publishedAt)}</Text>
                  ) : null}
                  {article.readingTime ? (
                    <Text style={styles.metaText}>{article.readingTime} min read</Text>
                  ) : null}
                  {article.tags && article.tags.length > 0
                    ? article.tags.slice(0, 2).map((tag) => (
                        <View key={tag} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))
                    : null}
                </View>
              </View>
              <Feather name="chevron-right" size={16} color={TEXT_DIM} />
            </TouchableOpacity>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  headerGradient: { ...StyleSheet.absoluteFillObject, height: 200 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle: { fontSize: 28, fontWeight: "700", color: TEXT, fontFamily: Platform.OS === "ios" ? "System" : "Inter_700Bold" },
  headerSub: { fontSize: 13, color: TEXT_DIM, marginTop: 2 },
  scroll: { flex: 1 },
  centerState: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 10 },
  stateText: { fontSize: 14, color: TEXT_DIM, marginTop: 4 },
  retryBtn: { marginTop: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: ACCENT + "50" },
  retryText: { color: ACCENT, fontSize: 13, fontWeight: "600" },
  articleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 12,
  },
  lastRow: { borderBottomWidth: 0 },
  articleContent: { flex: 1, gap: 4 },
  articleTitle: { fontSize: 15, fontWeight: "600", color: TEXT, lineHeight: 22 },
  articleExcerpt: { fontSize: 13, color: TEXT_DIM, lineHeight: 19 },
  articleMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" },
  metaText: { fontSize: 11, color: TEXT_DIM },
  tag: { backgroundColor: ACCENT + "18", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontSize: 10, color: ACCENT, fontWeight: "500" },
});
