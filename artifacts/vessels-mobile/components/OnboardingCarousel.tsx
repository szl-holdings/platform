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
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
  {
    icon: "map" as const,
    title: "Live Fleet Intelligence",
    subtitle:
      "Track every vessel in real time. Monitor position, speed, course, and anomalies across your entire maritime portfolio.",
    accent: "#0EA5E9",
  },
  {
    icon: "alert-triangle" as const,
    title: "Deviation Alerts",
    subtitle:
      "Receive instant push notifications when vessels deviate from route, enter exclusion zones, or flag suspicious behavior.",
    accent: "#F59E0B",
  },
  {
    icon: "trending-up" as const,
    title: "Economics & Analytics",
    subtitle:
      "Fuel consumption, charter performance, and voyage P&L — all analyzed and surfaced where you need them.",
    accent: "#10B981",
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
  scrollX: Animated.SharedValue<number>;
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
        <View
          style={[
            styles.iconContainer,
            { borderColor: `${slide.accent}40`, backgroundColor: `${slide.accent}15` },
          ]}
        >
          <Feather name={slide.icon} size={48} color={slide.accent} />
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
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    },
    [currentIndex, scrollX],
  );

  const handleNext = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      onComplete();
    }
  }, [currentIndex, onComplete]);

  const handleSkip = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onComplete();
  }, [onComplete]);

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <SlideItem slide={item} index={index} scrollX={scrollX} />
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>{isLast ? "Get Started" : "Next"}</Text>
          <Feather name={isLast ? "check" : "arrow-right"} size={18} color="#020d18" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020d18",
  },
  skipButton: {
    position: "absolute",
    top: 60,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    color: "rgba(224,242,254,0.4)",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  slideContent: {
    alignItems: "center",
    gap: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  slideTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#E0F2FE",
    textAlign: "center",
    lineHeight: 34,
  },
  slideSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "rgba(224,242,254,0.5)",
    textAlign: "center",
    lineHeight: 23,
  },
  footer: {
    paddingHorizontal: 32,
    gap: 24,
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(224,242,254,0.2)",
  },
  dotActive: {
    backgroundColor: "#0EA5E9",
    width: 20,
    borderRadius: 3,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0EA5E9",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
  },
  nextButtonText: {
    color: "#020d18",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
