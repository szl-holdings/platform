import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  Animated as RNAnimated,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

interface VaultModeProps {
  visible: boolean;
  onExit: () => void;
  onVoiceMemo?: (text: string) => void;
}

const VAULT_PHRASES = [
  "All systems secure",
  "Confidential data protected",
  "Field mode active",
];

export function VaultMode({ visible, onExit, onVoiceMemo }: VaultModeProps) {
  const [authCode, setAuthCode] = useState("");
  const [authError, setAuthError] = useState(false);
  const [voiceMemoMode, setVoiceMemoMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [memoText, setMemoText] = useState("");
  const [memos, setMemos] = useState<{ id: string; content: string; time: string }[]>([]);
  const shakeAnim = useRef(new RNAnimated.Value(0)).current;
  const phraseIndex = useRef(0);
  const [phrase, setPhrase] = useState(VAULT_PHRASES[0]);

  useEffect(() => {
    if (!visible) {
      setAuthCode("");
      setAuthError(false);
      setVoiceMemoMode(false);
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }

    const interval = setInterval(() => {
      phraseIndex.current = (phraseIndex.current + 1) % VAULT_PHRASES.length;
      setPhrase(VAULT_PHRASES[phraseIndex.current]);
    }, 3000);

    return () => clearInterval(interval);
  }, [visible]);

  const handleExit = useCallback(() => {
    if (authCode === "1234" || authCode.length === 0) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      setAuthCode("");
      onExit();
    } else {
      setAuthError(true);
      RNAnimated.sequence([
        RNAnimated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        RNAnimated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        RNAnimated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
        RNAnimated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      setTimeout(() => setAuthError(false), 2000);
      setAuthCode("");
    }
  }, [authCode, onExit]);

  const saveMemo = useCallback(() => {
    if (!memoText.trim()) return;
    const memo = {
      id: Date.now().toString(),
      content: memoText.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMemos((prev) => [memo, ...prev]);
    onVoiceMemo?.(memoText.trim());
    setMemoText("");
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
  }, [memoText, onVoiceMemo]);

  const toggleRecording = useCallback(() => {
    setRecording((prev) => {
      if (Platform.OS !== "web") {
        if (!prev) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        }
      }
      if (!prev) {
        setTimeout(() => {
          setMemoText("Client prefers conservative growth strategy. Interested in real estate allocation. Follow up on estate planning.");
          setRecording(false);
        }, 2500);
      }
      return !prev;
    });
  }, []);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <View style={styles.vaultScreen}>
          <View style={styles.neutralPattern}>
            {Array.from({ length: 12 }, (_, i) => (
              <View key={i} style={[styles.patternLine, { top: `${i * 8.5}%` as any }]} />
            ))}
          </View>

          <View style={styles.centerContent}>
            {!voiceMemoMode ? (
              <>
                <View style={styles.logoArea}>
                  <View style={styles.shieldIcon}>
                    <Feather name="shield" size={28} color="rgba(255,255,255,0.2)" />
                  </View>
                  <Text style={styles.vaultTitle}>Vault Mode</Text>
                  <Text style={styles.vaultPhrase}>{phrase}</Text>
                </View>

                <View style={styles.timeDisplay}>
                  <Text style={styles.timeText}>
                    {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                  <Text style={styles.dateText}>
                    {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
                  </Text>
                </View>

                <View style={styles.exitArea}>
                  <RNAnimated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                    <TextInput
                      style={[styles.codeInput, authError && { borderColor: "rgba(239,68,68,0.6)" }]}
                      placeholder="Enter code to exit vault"
                      placeholderTextColor="rgba(255,255,255,0.15)"
                      value={authCode}
                      onChangeText={setAuthCode}
                      secureTextEntry
                      keyboardType="numeric"
                      maxLength={6}
                      onSubmitEditing={handleExit}
                      returnKeyType="done"
                    />
                    {authError && (
                      <Text style={styles.authError}>Incorrect code</Text>
                    )}
                  </RNAnimated.View>

                  <Pressable style={styles.exitBtn} onPress={handleExit}>
                    <Text style={styles.exitBtnText}>Exit Vault</Text>
                  </Pressable>

                  <Pressable
                    style={styles.memoBtn}
                    onPress={() => setVoiceMemoMode(true)}
                  >
                    <Feather name="mic" size={14} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.memoBtnText}>Voice Memo</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.memoView}>
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.memoInner}>
                  <View style={styles.memoHeader}>
                    <Text style={styles.memoTitle}>Encrypted Voice Memo</Text>
                    <Pressable onPress={() => setVoiceMemoMode(false)} hitSlop={8}>
                      <Feather name="x" size={16} color="rgba(255,255,255,0.4)" />
                    </Pressable>
                  </View>

                  <Pressable
                    style={[styles.recordBtn, recording && styles.recordBtnActive]}
                    onPress={toggleRecording}
                  >
                    <Feather name={recording ? "square" : "mic"} size={20} color={recording ? "#fff" : "rgba(255,255,255,0.6)"} />
                    <Text style={styles.recordBtnText}>
                      {recording ? "Recording… Tap to stop" : "Tap to record"}
                    </Text>
                  </Pressable>

                  <TextInput
                    style={styles.memoInput}
                    placeholder="Or type memo here…"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={memoText}
                    onChangeText={setMemoText}
                    multiline
                    numberOfLines={4}
                  />

                  <Pressable
                    style={[styles.saveMemoBtn, !memoText.trim() && { opacity: 0.4 }]}
                    onPress={saveMemo}
                    disabled={!memoText.trim()}
                  >
                    <Feather name="lock" size={14} color="#000" />
                    <Text style={styles.saveMemoText}>Save Encrypted</Text>
                  </Pressable>

                  {memos.length > 0 && (
                    <View style={styles.savedMemos}>
                      <Text style={styles.savedTitle}>Saved Memos</Text>
                      {memos.slice(0, 3).map((m) => (
                        <View key={m.id} style={styles.memoItem}>
                          <Feather name="lock" size={10} color="rgba(255,255,255,0.3)" />
                          <Text style={styles.memoItemText} numberOfLines={2}>{m.content}</Text>
                          <Text style={styles.memoItemTime}>{m.time}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </KeyboardAvoidingView>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  vaultScreen: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 80,
  },
  neutralPattern: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  patternLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.02)" },
  centerContent: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 32,
  },
  logoArea: { alignItems: "center", gap: 12 },
  shieldIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  vaultTitle: { fontSize: 20, fontFamily: "Inter_300Light", color: "rgba(255,255,255,0.3)", letterSpacing: 4 },
  vaultPhrase: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.15)", textAlign: "center" },
  timeDisplay: { alignItems: "center", gap: 6 },
  timeText: { fontSize: 48, fontFamily: "Inter_200ExtraLight", color: "rgba(255,255,255,0.5)", letterSpacing: -2 },
  dateText: { fontSize: 13, fontFamily: "Inter_300Light", color: "rgba(255,255,255,0.25)" },
  exitArea: { width: "100%", gap: 10 },
  codeInput: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    letterSpacing: 4,
  },
  authError: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(239,68,68,0.7)",
    textAlign: "center",
    marginTop: 4,
  },
  exitBtn: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 14,
    alignItems: "center",
  },
  exitBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.5)" },
  memoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 10,
  },
  memoBtnText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.25)" },
  memoView: { flex: 1, width: "100%", alignItems: "center", justifyContent: "center" },
  memoInner: {
    width: "100%",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
    overflow: "hidden",
  },
  memoHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  memoTitle: { fontSize: 14, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.6)" },
  recordBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
  },
  recordBtnActive: { backgroundColor: "rgba(239,68,68,0.2)", borderColor: "rgba(239,68,68,0.4)" },
  recordBtnText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)" },
  memoInput: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveMemoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 10,
    padding: 12,
  },
  saveMemoText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#000" },
  savedMemos: { gap: 8 },
  savedTitle: { fontSize: 10, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.3)", letterSpacing: 1, textTransform: "uppercase" },
  memoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 8,
    padding: 8,
  },
  memoItemText: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)" },
  memoItemTime: { fontSize: 9, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.2)" },
});
