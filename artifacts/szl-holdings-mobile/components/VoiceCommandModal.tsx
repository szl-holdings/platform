import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Easing,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useVoiceCommand, type VoiceResultCard } from "@/hooks/useVoiceCommand";
import { WORKSPACES } from "@/context/WorkspaceContext";

const ACCENT = "#c9a84c";

interface VoiceCommandModalProps {
  visible: boolean;
  onClose: () => void;
}

function PulseRing({ active }: { active: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;
  const anim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (active) {
      anim.current = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(scale, { toValue: 1.5, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
            Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.6, duration: 800, useNativeDriver: true }),
          ]),
        ])
      );
      anim.current.start();
    } else {
      anim.current?.stop();
      scale.setValue(1);
      opacity.setValue(0.6);
    }
    return () => anim.current?.stop();
  }, [active]);

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        { transform: [{ scale }], opacity },
      ]}
    />
  );
}

function ProcessingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.stagger(200, [
        Animated.sequence([
          Animated.timing(dot1, { toValue: -8, duration: 300, useNativeDriver: true }),
          Animated.timing(dot1, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dot2, { toValue: -8, duration: 300, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dot3, { toValue: -8, duration: 300, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={styles.dotsRow}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[styles.dot, { transform: [{ translateY: dot }] }]}
        />
      ))}
    </View>
  );
}

function ResultCard({ card, colors }: { card: VoiceResultCard; colors: ReturnType<typeof useColors> }) {
  const trendColor =
    card.trend === "up"
      ? colors.green
      : card.trend === "down"
      ? colors.red
      : colors.mutedForeground;

  const sevColor =
    card.severity === "critical"
      ? colors.red
      : card.severity === "high"
      ? colors.amber
      : card.severity === "medium"
      ? "#f59e0b"
      : card.severity === "low"
      ? colors.blue
      : undefined;

  return (
    <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.resultCardLabel, { color: colors.mutedForeground }]}>{card.label}</Text>
      <Text style={[styles.resultCardValue, { color: sevColor ?? colors.foreground }]}>{card.value}</Text>
      {card.change && (
        <Text style={[styles.resultCardChange, { color: trendColor }]}>
          {card.trend === "up" ? "▲" : card.trend === "down" ? "▼" : "◉"} {card.change}
        </Text>
      )}
    </View>
  );
}

const SUGGESTED_QUERIES = [
  "What's the threat level?",
  "Fleet status overview",
  "Portfolio performance today",
  "Active critical signals",
  "Client sessions this week",
];

export function VoiceCommandModal({ visible, onClose }: VoiceCommandModalProps) {
  const colors = useColors();
  const { state, transcript, result, startListening, submitQuery, stopSpeaking, reset } = useVoiceCommand();
  const [textInput, setTextInput] = useState("");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      startListening();
      setTimeout(() => inputRef.current?.focus(), 400);
    } else {
      reset();
      setTextInput("");
    }
  }, [visible]);

  const handleClose = () => {
    stopSpeaking();
    reset();
    setTextInput("");
    onClose();
  };

  const handleSubmit = () => {
    if (textInput.trim()) {
      submitQuery(textInput.trim());
      setTextInput("");
    }
  };

  const handleSuggestion = (q: string) => {
    submitQuery(q);
  };

  const handleGoToResult = () => {
    if (result) {
      const ws = WORKSPACES.find((w) => w.id === result.domain);
      if (ws) {
        handleClose();
        router.navigate(ws.route as never);
      }
    }
  };

  const isListening = state === "listening";
  const isProcessing = state === "processing";
  const hasResult = state === "result" && result;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

          <View style={[styles.sheet, { backgroundColor: "#111018", borderColor: "rgba(201,168,76,0.15)" }]}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.micContainer}>
                <PulseRing active={isListening} />
                <View style={[styles.micCircle, { backgroundColor: isListening ? `${ACCENT}20` : "rgba(255,255,255,0.05)" }]}>
                  <Feather
                    name={isListening ? "mic" : isProcessing ? "cpu" : "mic-off"}
                    size={22}
                    color={isListening ? ACCENT : "#aaa"}
                  />
                </View>
              </View>
              <View style={styles.sheetTitleBlock}>
                <Text style={styles.sheetTitle}>Voice Command</Text>
                <Text style={styles.sheetSubtitle}>
                  {isListening
                    ? "Listening — type or speak your query"
                    : isProcessing
                    ? "Processing across domains…"
                    : hasResult
                    ? `Routed to ${result!.domain}`
                    : "Type a command to get started"}
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Feather name="x" size={18} color="#aaa" />
              </TouchableOpacity>
            </View>

            {isProcessing && (
              <View style={styles.processingRow}>
                <ProcessingDots />
                <Text style={styles.processingText}>Routing query across ecosystem…</Text>
              </View>
            )}

            {hasResult && (
              <View style={styles.resultSection}>
                <View style={[styles.queryBubble, { backgroundColor: "rgba(201,168,76,0.08)" }]}>
                  <Text style={styles.queryText}>"{result!.query}"</Text>
                </View>
                <View style={[styles.domainChip, { borderColor: `${WORKSPACES.find((w) => w.id === result!.domain)?.accent ?? ACCENT}40` }]}>
                  <Text style={styles.domainChipText}>
                    {WORKSPACES.find((w) => w.id === result!.domain)?.icon}{" "}
                    {WORKSPACES.find((w) => w.id === result!.domain)?.label}
                  </Text>
                </View>
                <Text style={styles.responseText}>{result!.response}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsRow}>
                  {result!.cards.map((card) => (
                    <ResultCard key={card.id} card={card} colors={colors} />
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.goBtn} onPress={handleGoToResult}>
                  <Text style={styles.goBtnText}>Open {WORKSPACES.find((w) => w.id === result!.domain)?.label}</Text>
                  <Feather name="arrow-right" size={14} color="#090810" />
                </TouchableOpacity>
              </View>
            )}

            {(isListening || state === "idle") && !hasResult && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.suggestLabel}>Suggested queries</Text>
                <View style={styles.suggestionsGrid}>
                  {SUGGESTED_QUERIES.map((q) => (
                    <TouchableOpacity
                      key={q}
                      style={[styles.suggestionChip, { borderColor: "rgba(201,168,76,0.2)" }]}
                      onPress={() => handleSuggestion(q)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.suggestionText}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={[styles.inputRow, { borderColor: "rgba(201,168,76,0.2)", backgroundColor: "rgba(255,255,255,0.04)" }]}>
              <Feather name="search" size={16} color="#666" style={{ marginRight: 8 }} />
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                value={textInput}
                onChangeText={setTextInput}
                placeholder='Try "What needs my attention?"'
                placeholderTextColor="#555"
                returnKeyType="send"
                onSubmitEditing={handleSubmit}
                editable={!isProcessing}
              />
              <TouchableOpacity onPress={handleSubmit} disabled={!textInput.trim() || isProcessing}>
                <Feather name="send" size={16} color={textInput.trim() ? ACCENT : "#444"} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 20,
    gap: 16,
    minHeight: 360,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  micContainer: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: ACCENT,
  },
  micCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitleBlock: { flex: 1 },
  sheetTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#f0eeff",
  },
  sheetSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(240,238,255,0.5)",
    marginTop: 2,
  },
  closeBtn: { padding: 4 },
  processingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 10,
    backgroundColor: "rgba(201,168,76,0.06)",
  },
  dotsRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT,
  },
  processingText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(240,238,255,0.6)",
  },
  resultSection: { gap: 10 },
  queryBubble: {
    padding: 10,
    borderRadius: 8,
  },
  queryText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: ACCENT,
    fontStyle: "italic",
  },
  domainChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  domainChipText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#f0eeff",
  },
  responseText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(240,238,255,0.85)",
    lineHeight: 20,
  },
  cardsRow: { gap: 8, paddingBottom: 4 },
  resultCard: {
    width: 120,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  resultCardLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  resultCardValue: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  resultCardChange: { fontSize: 10, fontFamily: "Inter_500Medium" },
  goBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: ACCENT,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  goBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#090810",
  },
  suggestionsSection: { gap: 8 },
  suggestLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(240,238,255,0.4)",
    letterSpacing: 1,
  },
  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  suggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(240,238,255,0.6)",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#f0eeff",
  },
});
