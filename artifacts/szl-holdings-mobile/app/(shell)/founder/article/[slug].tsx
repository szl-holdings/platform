import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { formatInUserTimeZone, useUserPreferences } from "@szl-holdings/mobile-shared";

const { width: W } = Dimensions.get("window");

type Article = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  summary?: string | null;
  content?: string | null;
  publishedAt?: string | null;
  readingTime?: number | null;
  tags?: string[] | null;
};

type CaseStudy = {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  content?: string | null;
  outcome?: string | null;
};

type ReaderItem = (Article | CaseStudy) & { _type: "article" | "case-study" };

function useApiBase() {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
}

function useAllArticles() {
  const base = useApiBase();
  return useQuery<Article[]>({
    queryKey: ["all-articles"],
    queryFn: async () => {
      const res = await fetch(`${base}/api/cms/articles?limit=20`);
      if (!res.ok) return [];
      const json = await res.json();
      return (json.data ?? json) as Article[];
    },
    retry: 1,
  });
}

function useAllCaseStudies() {
  const base = useApiBase();
  return useQuery<CaseStudy[]>({
    queryKey: ["all-case-studies"],
    queryFn: async () => {
      const res = await fetch(`${base}/api/stephen/portfolio-case-studies`);
      if (!res.ok) return [];
      const json = await res.json();
      return (json.data ?? json) as CaseStudy[];
    },
    retry: 1,
  });
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  const formatted = formatInUserTimeZone(dateStr, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return formatted || null;
}

function isArticleType(item: ReaderItem): item is Article & { _type: "article" } {
  return item._type === "article";
}

function ReaderPage({
  item,
  colors,
  onOpenExternal,
}: {
  item: ReaderItem;
  colors: ReturnType<typeof useColors>;
  onOpenExternal: (item: ReaderItem) => void;
}) {
  const art = item as Article;
  const cs = item as CaseStudy;
  const body = art.content ?? art.excerpt ?? art.summary ?? cs.summary ?? cs.content;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{ width: W }}
      contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
    >
      <View style={[styles.typeBadge, { backgroundColor: colors.silverDim }]}>
        <Text style={[styles.typeBadgeText, { color: colors.silver }]}>
          {isArticleType(item) ? "Article" : "Case Study"}
        </Text>
      </View>

      <Text style={[styles.articleTitle, { color: colors.foreground }]}>{item.title}</Text>

      {isArticleType(item) ? (
        <View style={styles.metaRow}>
          {formatDate(item.publishedAt) ? (
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {formatDate(item.publishedAt)}
            </Text>
          ) : null}
          {item.readingTime ? (
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              · {item.readingTime} min read
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {body ? (
        <Text style={[styles.bodyText, { color: colors.mutedForeground }]}>{body}</Text>
      ) : (
        <Text style={[styles.bodyText, { color: colors.mutedForeground }]}>
          Full content is available on the web.
        </Text>
      )}

      {!isArticleType(item) && cs.outcome ? (
        <View
          style={[
            styles.outcomeBox,
            { backgroundColor: colors.card, borderColor: colors.silverBorder },
          ]}
        >
          <Text style={[styles.outcomeLabel, { color: colors.silver }]}>OUTCOME</Text>
          <Text style={[styles.outcomeText, { color: colors.foreground }]}>{cs.outcome}</Text>
        </View>
      ) : null}

      {isArticleType(item) && item.tags && item.tags.length > 0 ? (
        <View style={styles.tagsRow}>
          {item.tags.map((tag) => (
            <View
              key={tag}
              style={[styles.tagChip, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.webBtn, { borderColor: colors.border }]}
        onPress={() => onOpenExternal(item)}
      >
        <Text style={[styles.webBtnText, { color: colors.silver }]}>
          Read on stephenlutar.com
        </Text>
        <Feather name="external-link" size={14} color={colors.silver} />
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function ArticleReaderScreen() {
  // Subscribe so the article re-renders when the user changes time zone.
  useUserPreferences();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const { data: allArticles = [], isLoading: artLoading } = useAllArticles();
  const { data: allCaseStudies = [], isLoading: csLoading } = useAllCaseStudies();

  const isLoading = artLoading || csLoading;

  const allItems: ReaderItem[] = [
    ...allArticles.map((a) => ({ ...a, _type: "article" as const })),
    ...allCaseStudies.map((c) => ({ ...c, _type: "case-study" as const })),
  ];

  const [pageIndex, setPageIndex] = useState(0);
  const pagerRef = useRef<ScrollView>(null);

  const progressVal = useSharedValue(0);
  const progressStyle = useAnimatedStyle(() => ({
    width: withSpring(progressVal.value, { damping: 20 }),
  }));

  const updateProgress = (idx: number, total: number) => {
    progressVal.value = total > 1 ? ((idx + 1) / total) * W : W;
  };

  // Once data finishes loading, sync pageIndex to the requested slug and scroll pager to it
  useEffect(() => {
    if (!isLoading && allItems.length > 0) {
      const idx = allItems.findIndex((i) => i.slug === slug);
      const target = idx >= 0 ? idx : 0;
      setPageIndex(target);
      pagerRef.current?.scrollTo({ x: target * W, animated: false });
      updateProgress(target, allItems.length);
    }
  }, [isLoading, slug]);

  const currentItem = allItems[pageIndex];

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const handleOpenExternal = (item: ReaderItem) => {
    const base = "https://stephenlutar.com";
    const url =
      item._type === "article"
        ? `${base}/writing/${item.slug}`
        : `${base}/work/${item.slug}`;
    Linking.openURL(url);
  };

  const handlePrev = () => {
    if (pageIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const next = pageIndex - 1;
      setPageIndex(next);
      pagerRef.current?.scrollTo({ x: next * W, animated: true });
      updateProgress(next, allItems.length);
    }
  };

  const handleNext = () => {
    if (pageIndex < allItems.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const next = pageIndex + 1;
      setPageIndex(next);
      pagerRef.current?.scrollTo({ x: next * W, animated: true });
      updateProgress(next, allItems.length);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            { paddingTop: insets.top + 8, borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.silver} />
        </View>
      </View>
    );
  }

  if (!currentItem) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            { paddingTop: insets.top + 8, borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Feather name="alert-circle" size={36} color={colors.border} style={{ marginBottom: 12 }} />
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
            Content not found
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { borderColor: colors.border }]}
            onPress={handleBack}
          >
            <Text style={[styles.retryText, { color: colors.mutedForeground }]}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.silver }]}>
            {currentItem._type === "article" ? "ARTICLE" : "CASE STUDY"}
          </Text>
          {allItems.length > 1 ? (
            <Text style={[styles.headerCount, { color: colors.mutedForeground }]}>
              {pageIndex + 1} / {allItems.length}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() => handleOpenExternal(currentItem)}
          style={styles.externalBtn}
        >
          <Feather name="external-link" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      {allItems.length > 1 ? (
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[styles.progressBar, progressStyle, { backgroundColor: colors.silver }]}
          />
        </View>
      ) : null}

      {/* Horizontal pager — gesture swipe + button navigation */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled
        style={{ flex: 1 }}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / W);
          const target = Math.max(0, Math.min(idx, allItems.length - 1));
          if (target !== pageIndex) {
            setPageIndex(target);
            updateProgress(target, allItems.length);
          }
        }}
      >
        {allItems.map((item) => (
          <ReaderPage
            key={item.slug + item._type}
            item={item}
            colors={colors}
            onOpenExternal={handleOpenExternal}
          />
        ))}
      </ScrollView>

      {/* Prev/Next navigation bar */}
      {allItems.length > 1 ? (
        <View
          style={[
            styles.navBar,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.background,
              paddingBottom: insets.bottom + 4,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handlePrev}
            disabled={pageIndex === 0}
            style={[
              styles.navBtn,
              {
                opacity: pageIndex === 0 ? 0.3 : 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
              },
            ]}
          >
            <Feather name="chevron-left" size={18} color={colors.foreground} />
            <Text style={[styles.navBtnText, { color: colors.foreground }]}>Previous</Text>
          </TouchableOpacity>

          <View style={styles.navDots}>
            {allItems.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.navDot,
                  {
                    backgroundColor: i === pageIndex ? colors.silver : colors.border,
                    width: i === pageIndex ? 12 : 6,
                  },
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={handleNext}
            disabled={pageIndex === allItems.length - 1}
            style={[
              styles.navBtn,
              {
                opacity: pageIndex === allItems.length - 1 ? 0.3 : 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
              },
            ]}
          >
            <Text style={[styles.navBtnText, { color: colors.foreground }]}>Next</Text>
            <Feather name="chevron-right" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      ) : null}
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
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  headerCount: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
  externalBtn: { padding: 4 },
  progressTrack: { height: 2 },
  progressBar: { height: 2 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  errorText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 16,
  },
  retryBtn: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 16, paddingVertical: 8 },
  retryText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  typeBadge: {
    alignSelf: "flex-start",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 14,
  },
  typeBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  articleTitle: {
    fontSize: 26,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 34,
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  metaRow: { flexDirection: "row", gap: 4, marginBottom: 16 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  divider: { height: 1, marginBottom: 20 },
  bodyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 28,
    marginBottom: 24,
  },
  outcomeBox: { borderWidth: 1, borderRadius: 10, padding: 18, marginBottom: 24 },
  outcomeLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  outcomeText: { fontSize: 15, fontFamily: "Inter_500Medium", lineHeight: 22 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  tagChip: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  webBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  webBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  navBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  navDots: { flexDirection: "row", gap: 5, alignItems: "center" },
  navDot: { height: 6, borderRadius: 3 },
});
