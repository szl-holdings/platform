import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  type SharedValue,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
  {
    icon: "flash" as const,
    title: "Alloy Intelligence",
    subtitle:
      "Your AI-native platform for orchestrating agents, automating workflows, and making real-time decisions — from anywhere.",
    accent: "#8B5CF6",
  },
  {
    icon: "finger-print" as const,
    title: "Secure by Default",
    subtitle:
      "Face ID and fingerprint authentication keep your intelligence command center private. Enable it any time in your profile.",
    accent: "#F59E0B",
  },
];

interface OnboardingCarouselProps {
  onComplete: () => void;
}

function SlideItem({
  slide,
  index,
  scrollX,
}: {
  slide: (typeof SLIDES)[0];
  index: number;
  scrollX: SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0], "clamp");
    const translateY = interpolate(scrollX.value, inputRange, [20, 0, 20], "clamp");
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <Animated.View style={[styles.slideContent, animatedStyle]}>
        <View style={[styles.iconContainer, { borderColor: `${slide.accent}40`, backgroundColor: `${slide.accent}15` }]}>
          <Ionicons name={slide.icon} size={52} color={slide.accent} />
        </View>
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
      </Animated.View>
    </View>
  );
}

export function OnboardingCarousel({ onComplete }: OnboardingCarouselProps) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      scrollX.value = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [currentIndex, scrollX],
  );

  const handleNext = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      onComplete();
    }
  }, [currentIndex, onComplete]);

  const handleSkip = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComplete();
  }, [onComplete]);

  const isLast = currentIndex === SLIDES.length - 1;
  const accent = SLIDES[currentIndex]?.accent ?? "#8B5CF6";

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.topBar}>
        <Text style={styles.wordmark}>ALLOY</Text>
        {!isLast && (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <SlideItem slide={item} index={index} scrollX={scrollX} />
        )}
        keyExtractor={(_, i) => String(i)}
        style={styles.list}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex && { ...styles.dotActive, backgroundColor: accent }]}
            />
          ))}
        </View>
        <TouchableOpacity style={[styles.nextButton, { backgroundColor: accent }]} onPress={handleNext}>
          <Text style={styles.nextButtonText}>{isLast ? "Get Started" : "Continue"}</Text>
          <Ionicons name={isLast ? "checkmark" : "arrow-forward"} size={18} color="#080B14" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080B14" },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  wordmark: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "rgba(139,92,246,0.6)", letterSpacing: 4 },
  skipText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "rgba(232,234,240,0.4)" },
  list: { flex: 1 },
  slide: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  slideContent: { alignItems: "center", gap: 20 },
  iconContainer: { width: 100, height: 100, borderRadius: 28, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  slideTitle: { fontSize: 26, fontFamily: "SpaceGrotesk_700Bold", color: "#E8EAF0", textAlign: "center", lineHeight: 34 },
  slideSubtitle: { fontSize: 15, fontFamily: "Inter_400Regular", color: "rgba(232,234,240,0.55)", textAlign: "center", lineHeight: 23 },
  footer: { paddingHorizontal: 32, gap: 24, alignItems: "center" },
  dots: { flexDirection: "row", gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(232,234,240,0.2)" },
  dotActive: { width: 20, borderRadius: 3 },
  nextButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, width: "100%" },
  nextButtonText: { color: "#080B14", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
