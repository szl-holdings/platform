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
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import * as Crypto from "expo-crypto";

const VAULT_MEMOS_KEY = "cj_vault_memos_encrypted";
const VAULT_MEMO_KEY_KEY = "cj_vault_memo_key";

type Memo = { id: string; content: string; time: string };

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return bytes;
}
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}
function uint8ToBase64(bytes: Uint8Array): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "", i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i++] ?? 0, b1 = bytes[i++] ?? 0, b2 = bytes[i++] ?? 0;
    result += chars[b0 >> 2];
    result += chars[((b0 & 3) << 4) | (b1 >> 4)];
    result += i - 2 < bytes.length ? chars[((b1 & 15) << 2) | (b2 >> 6)] : "=";
    result += i - 1 < bytes.length ? chars[b2 & 63] : "=";
  }
  return result;
}
function base64ToUint8(b64: string): Uint8Array {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  const cleaned = b64.replace(/=/g, "");
  const outLen = Math.floor((cleaned.length * 3) / 4);
  const out = new Uint8Array(outLen);
  let idx = 0;
  for (let i = 0; i < cleaned.length; i += 4) {
    const c0 = lookup[cleaned.charCodeAt(i)] ?? 0, c1 = lookup[cleaned.charCodeAt(i + 1)] ?? 0;
    const c2 = lookup[cleaned.charCodeAt(i + 2)] ?? 0, c3 = lookup[cleaned.charCodeAt(i + 3)] ?? 0;
    out[idx++] = (c0 << 2) | (c1 >> 4);
    if (i + 2 < cleaned.length) out[idx++] = ((c1 & 15) << 4) | (c2 >> 2);
    if (i + 3 < cleaned.length) out[idx++] = ((c2 & 3) << 6) | c3;
  }
  return out;
}
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
function hasCryptoSubtle(): boolean {
  return typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined";
}

async function getOrCreateMemoKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(VAULT_MEMO_KEY_KEY, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  if (!key) {
    const bytes = await Crypto.getRandomBytesAsync(32);
    key = bytesToHex(bytes);
    await SecureStore.setItemAsync(VAULT_MEMO_KEY_KEY, key, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }
  return key;
}

async function importAesKey(keyHex: string): Promise<CryptoKey> {
  if (!hasCryptoSubtle()) throw new Error("AES-GCM unavailable: crypto.subtle not present");
  return crypto.subtle.importKey("raw", toArrayBuffer(hexToBytes(keyHex)), { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptAndStoreMemos(memos: Memo[], keyHex: string): Promise<void> {
  if (!hasCryptoSubtle()) throw new Error("Cannot encrypt vault memos: crypto.subtle unavailable");
  const plain = JSON.stringify(memos);
  const iv = await Crypto.getRandomBytesAsync(12);
  const key = await importAesKey(keyHex);
  const plainBytes = new TextEncoder().encode(plain);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, toArrayBuffer(plainBytes));
  const encoded = `${uint8ToBase64(iv)}:${uint8ToBase64(new Uint8Array(ct))}`;
  await SecureStore.setItemAsync(VAULT_MEMOS_KEY, encoded, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

async function loadAndDecryptMemos(): Promise<Memo[]> {
  if (!hasCryptoSubtle()) throw new Error("Cannot decrypt vault memos: crypto.subtle unavailable");
  const keyHex = await getOrCreateMemoKey();
  const raw = await SecureStore.getItemAsync(VAULT_MEMOS_KEY, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  if (!raw) return [];
  const colonIdx = raw.indexOf(":");
  if (colonIdx === -1) throw new Error("Invalid vault ciphertext format");
  const iv = base64ToUint8(raw.slice(0, colonIdx));
  const ct = base64ToUint8(raw.slice(colonIdx + 1));
  const key = await importAesKey(keyHex);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, toArrayBuffer(ct));
  return JSON.parse(new TextDecoder().decode(pt)) as Memo[];
}

async function biometricAuth(reason: string): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: "Use PIN",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });
    return result.success;
  } catch { return false; }
}

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
  const [biometricAuthed, setBiometricAuthed] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [voiceMemoMode, setVoiceMemoMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [memoText, setMemoText] = useState("");
  const [memos, setMemos] = useState<{ id: string; content: string; time: string }[]>([]);
  const shakeAnim = useRef(new RNAnimated.Value(0)).current;
  const phraseIndex = useRef(0);
  const [phrase, setPhrase] = useState(VAULT_PHRASES[0]);
  const memoKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setBiometricAuthed(false);
      setAuthError(false);
      setVoiceMemoMode(false);
      setMemos([]);
      memoKeyRef.current = null;
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }

    biometricAuth("Authenticate to access Encrypted Vault").then(async authed => {
      if (authed) {
        if (!hasCryptoSubtle()) {
          setAuthError(true);
          setTimeout(() => { setAuthError(false); onExit(); }, 3000);
          return;
        }
        setBiometricAuthed(true);
        const key = await getOrCreateMemoKey();
        memoKeyRef.current = key;
        try {
          const saved = await loadAndDecryptMemos();
          setMemos(saved);
        } catch {
          setMemos([]);
        }
      } else {
        setAuthError(true);
        setTimeout(() => { setAuthError(false); onExit(); }, 2000);
      }
    }).catch(() => {
      setAuthError(true);
      setTimeout(() => { setAuthError(false); onExit(); }, 2000);
    });

    const interval = setInterval(() => {
      phraseIndex.current = (phraseIndex.current + 1) % VAULT_PHRASES.length;
      setPhrase(VAULT_PHRASES[phraseIndex.current]);
    }, 3000);

    return () => clearInterval(interval);
  }, [visible]);

  const handleExit = useCallback(async () => {
    const authed = await biometricAuth("Authenticate to exit Vault Mode");
    if (authed) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      setBiometricAuthed(false);
      onExit();
    } else {
      RNAnimated.sequence([
        RNAnimated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        RNAnimated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        RNAnimated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
        RNAnimated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    }
  }, [onExit]);

  const saveMemo = useCallback(async () => {
    if (!memoText.trim()) return;
    const memo = {
      id: Date.now().toString(),
      content: memoText.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const updated = [memo, ...memos];
    setMemos(updated);
    onVoiceMemo?.(memoText.trim());
    setMemoText("");
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    if (memoKeyRef.current) {
      await encryptAndStoreMemos(updated, memoKeyRef.current).catch(() => {});
    }
  }, [memoText, memos, onVoiceMemo]);

  const toggleRecording = useCallback(() => {
    setRecording(prev => {
      if (Platform.OS !== "web") {
        if (!prev) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        }
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
              <View key={i} style={[styles.patternLine, { top: (i * 8.5).toFixed(1) + "%" as `${number}%` }]} />
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
                    {authError && (
                      <Text style={styles.authError}>Authentication failed</Text>
                    )}
                    {!biometricAuthed && !authError && (
                      <Text style={styles.authPending}>Authenticating…</Text>
                    )}
                  </RNAnimated.View>

                  {biometricAuthed && (
                    <Pressable style={styles.exitBtn} onPress={handleExit}>
                      <Feather name="unlock" size={14} color="#fff" />
                      <Text style={styles.exitBtnText}>Exit Vault</Text>
                    </Pressable>
                  )}

                  {biometricAuthed && (
                    <Pressable
                      style={styles.memoBtn}
                      onPress={() => setVoiceMemoMode(true)}
                    >
                      <Feather name="edit-3" size={14} color="rgba(255,255,255,0.4)" />
                      <Text style={styles.memoBtnText}>Field Notes</Text>
                    </Pressable>
                  )}
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
  authPending: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.3)",
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
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
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
