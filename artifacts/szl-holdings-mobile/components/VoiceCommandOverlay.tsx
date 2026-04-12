import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
  Animated as RNAnimated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useVoiceCommand } from "@/hooks/useVoiceCommand";

interface VoiceCommandOverlayProps {
  visible: boolean;
  onClose: () => void;
  onCommand: (text: string) => void;
  appName?: string;
  accentColor?: string;
  suggestions?: string[];
}

export function VoiceCommandOverlay({
  visible,
  onClose,
  onCommand,
  appName = "Alloy",
  accentColor = "#c9a84c",
  suggestions = [
    "Show critical alerts",
    "Open command palette",
    "Show recent activity",
    "Go to portfolio",
  ],
}: VoiceCommandOverlayProps) {
  const pulseAnim = React.useRef(new RNAnimated.Value(1)).current;

  const { state, transcript, startListening, stopListening } = useVoiceCommand({
    appName,
    onResult: ({ transcript: text }) => {
      onCommand(text);
      setTimeout(() => {
        onClose();
      }, 800);
    },
  });

  useEffect(() => {
    if (!visible) {
      stopListening();
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    startListening();
  }, [visible]);

  useEffect(() => {
    if (state === "listening") {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          RNAnimated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [state]);

  const stateLabel = {
    idle: `Say "Hey ${appName}…"`,
    listening: "Listening…",
    processing: "Processing…",
    error: "Try again",
  }[state];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.card}>
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.inner}>
            <View style={styles.header}>
              <Text style={[styles.appName, { color: accentColor }]}>
                {appName} Voice
              </Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Feather name="x" size={18} color="rgba(255,255,255,0.4)" />
              </Pressable>
            </View>

            <View style={styles.micContainer}>
              <RNAnimated.View
                style={[
                  styles.ripple,
                  {
                    borderColor: accentColor,
                    transform: [{ scale: pulseAnim }],
                    opacity:
                      state === "listening"
                        ? pulseAnim.interpolate({
                            inputRange: [1, 1.3],
                            outputRange: [0.3, 0],
                          })
                        : 0,
                  },
                ]}
              />
              <Pressable
                style={[
                  styles.micBtn,
                  { backgroundColor: state === "listening" ? accentColor : "rgba(255,255,255,0.08)" },
                ]}
                onPress={state === "listening" ? stopListening : startListening}
              >
                <Feather
                  name={state === "listening" ? "mic" : "mic-off"}
                  size={28}
                  color={state === "listening" ? "#000" : accentColor}
                />
              </Pressable>
            </View>

            <Text style={styles.stateLabel}>{stateLabel}</Text>

            {transcript ? (
              <View style={styles.transcriptBox}>
                <Text style={styles.transcriptText}>"{transcript}"</Text>
              </View>
            ) : (
              <View style={styles.suggestions}>
                {suggestions.slice(0, 3).map((s) => (
                  <Pressable
                    key={s}
                    style={styles.suggestion}
                    onPress={() => {
                      onCommand(s);
                      onClose();
                    }}
                  >
                    <Feather name="chevron-right" size={12} color={accentColor} />
                    <Text style={styles.suggestionText}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 40,
  },
  card: {
    width: "90%",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  inner: {
    padding: 24,
    gap: 16,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  appName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  micContainer: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  ripple: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
  },
  micBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  stateLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
  },
  transcriptBox: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    padding: 12,
    width: "100%",
  },
  transcriptText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    fontStyle: "italic",
  },
  suggestions: {
    width: "100%",
    gap: 8,
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 8,
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
  },
});
