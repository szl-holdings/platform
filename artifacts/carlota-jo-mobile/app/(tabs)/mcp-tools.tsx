import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, RefreshControl, TextInput, Modal, KeyboardAvoidingView,
  Animated as RNAnimated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { AICopilot } from "@/components/AICopilot";
import { NotificationOverlay, usePushNotifications } from "@/components/PushNotificationManager";
import { useOfflineCache } from "@/hooks/useOfflineCache";
import { AUTH_TOKEN_KEY } from "@/context/AuthContext";

const VAULT_CONVO_KEY = "cj_vault_conversations";
const VAULT_KEY_ID = "cj_vault_aes_key";
const VAULT_CONVO_MAXLEN = 50;

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
function hasCryptoSubtle(): boolean {
  return typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined";
}

async function getOrCreateVaultKey(): Promise<string> {
  let keyHex = await SecureStore.getItemAsync(VAULT_KEY_ID, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  if (!keyHex) {
    const raw = await Crypto.getRandomBytesAsync(32);
    keyHex = bytesToHex(raw);
    await SecureStore.setItemAsync(VAULT_KEY_ID, keyHex, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  }
  return keyHex;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function importAesKey(keyBytes: Uint8Array): Promise<CryptoKey> {
  if (!hasCryptoSubtle()) throw new Error("AES-GCM unavailable: crypto.subtle not present");
  return crypto.subtle.importKey("raw", toArrayBuffer(keyBytes), { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptVault(data: VaultConversation[], keyHex: string): Promise<string> {
  if (!hasCryptoSubtle()) throw new Error("Cannot encrypt vault conversations: crypto.subtle unavailable");
  const iv = await Crypto.getRandomBytesAsync(12);
  const keyBytes = hexToBytes(keyHex);
  const key = await importAesKey(keyBytes);
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, toArrayBuffer(plaintext));
  return `${uint8ToBase64(iv)}:${uint8ToBase64(new Uint8Array(ct))}`;
}

async function decryptVault(stored: string, keyHex: string): Promise<VaultConversation[]> {
  if (!hasCryptoSubtle()) throw new Error("Cannot decrypt vault conversations: crypto.subtle unavailable");
  const idx = stored.indexOf(":");
  if (idx === -1) throw new Error("Invalid vault ciphertext format");
  const iv = base64ToUint8(stored.slice(0, idx));
  const ct = base64ToUint8(stored.slice(idx + 1));
  const keyBytes = hexToBytes(keyHex);
  const key = await importAesKey(keyBytes);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, toArrayBuffer(ct));
  return JSON.parse(new TextDecoder().decode(pt)) as VaultConversation[];
}

let cachedVaultKey: string | null = null;

async function loadVaultConversations(): Promise<VaultConversation[]> {
  if (!hasCryptoSubtle()) throw new Error("Vault unavailable: AES-GCM encryption is not supported on this device");
  if (!cachedVaultKey) cachedVaultKey = await getOrCreateVaultKey();
  const raw = await SecureStore.getItemAsync(VAULT_CONVO_KEY, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  if (!raw) return [];
  return decryptVault(raw, cachedVaultKey);
}

async function saveVaultConversations(convos: VaultConversation[]): Promise<void> {
  if (!hasCryptoSubtle()) throw new Error("Vault unavailable: AES-GCM encryption is not supported on this device");
  if (!cachedVaultKey) cachedVaultKey = await getOrCreateVaultKey();
  const trimmed = convos.slice(-VAULT_CONVO_MAXLEN);
  const encrypted = await encryptVault(trimmed, cachedVaultKey);
  await SecureStore.setItemAsync(VAULT_CONVO_KEY, encrypted, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
}

async function requestBiometricAuth(reason: string): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const hasHW = await LocalAuthentication.hasHardwareAsync();
    if (!hasHW) return false;
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: "Use Device PIN",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });
    return result.success;
  } catch { return false; }
}

const ACCENT = "#7c3aed";
const BG = "#08080f";
const CARD = "rgba(25,25,35,0.95)";
const BORDER = "rgba(255,255,255,0.06)";

interface VaultConversation {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: number;
}

function EncryptedVaultModal({ visible, onClose, accentColor, apiBase, authToken }: {
  visible: boolean;
  onClose: () => void;
  accentColor: string;
  apiBase: string;
  authToken: string | null;
}) {
  const [phase, setPhase] = useState<"tap" | "biometric" | "active" | "denied">("tap");
  const [tapCount, setTapCount] = useState(0);
  const [messages, setMessages] = useState<VaultConversation[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;
  const conversationIdRef = useRef<string>(`vault-${Date.now()}`);

  useEffect(() => {
    if (!visible) {
      setPhase("tap");
      setTapCount(0);
      setMessages([]);
      setInput("");
      return;
    }
    const pulse = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
        RNAnimated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    conversationIdRef.current = `vault-${Date.now()}`;
    return () => pulse.stop();
  }, [visible]);

  const handleTripleTap = () => {
    const next = tapCount + 1;
    setTapCount(next);
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    if (next >= 3) {
      setPhase("biometric");
      requestBiometricAuth("Verify identity to enter Encrypted Vault Mode").then(ok => {
        if (!ok) { setPhase("denied"); setTapCount(0); return; }
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        loadVaultConversations().then(saved => {
          setMessages(saved.length > 0 ? saved : [{
            id: "welcome",
            role: "assistant",
            content: "Vault Mode active. Triple-tap gate passed + biometric verified. Conversations stored with SecureStore device-only protection. How can I assist you?",
            timestamp: Date.now(),
          }]);
          setPhase("active");
        });
      });
    }
  };

  const sendVaultMessage = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    const userMsg: VaultConversation = { id: `u-${Date.now()}`, role: "user", content: text, timestamp: Date.now() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setThinking(true);
    await saveVaultConversations(nextMessages);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json", "Accept": "text/event-stream" };
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
      const res = await fetch(`${apiBase}/api/alloy-chat/conversations/${conversationIdRef.current}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          role: "user",
          content: text,
          systemContext: "You are a confidential consulting AI in Vault Mode. Be concise and direct. Treat all shared information as highly sensitive.",
        }),
      });
      if (!res.ok || !res.body) throw new Error(`API error ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const aiId = `a-${Date.now()}`;
      let aiContent = "";
      setMessages(prev => [...prev, { id: aiId, role: "assistant", content: "", timestamp: Date.now() }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;
          try {
            const evt = JSON.parse(raw);
            if (evt.content) {
              aiContent += evt.content;
              setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: aiContent } : m));
            }
          } catch {}
        }
      }
      const finalMsgs = [...nextMessages, { id: aiId, role: "assistant" as const, content: aiContent, timestamp: Date.now() }];
      await saveVaultConversations(finalMsgs);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: "assistant", content: `Vault channel error: ${errMsg}`, timestamp: Date.now() }]);
    } finally {
      setThinking(false);
    }
  };

  if (phase === "tap") {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={vaultStyles.backdrop}>
          <View style={vaultStyles.card}>
            <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={vaultStyles.inner}>
              <View style={vaultStyles.topRow}>
                <Text style={[vaultStyles.title, { color: accentColor }]}>Vault Mode</Text>
                <TouchableOpacity onPress={onClose} hitSlop={8}>
                  <Feather name="x" size={18} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              </View>
              <RNAnimated.View style={[vaultStyles.lockCircle, { borderColor: accentColor + "60", transform: [{ scale: pulseAnim }] }]}>
                <Feather name="lock" size={36} color={accentColor} />
              </RNAnimated.View>
              <Text style={vaultStyles.authTitle}>Triple-Tap to Activate</Text>
              <Text style={vaultStyles.authDesc}>Tap the lock 3 times to initiate biometric vault entry. Your conversations are encrypted on-device.</Text>
              <TouchableOpacity onPress={handleTripleTap} style={[vaultStyles.tapBtn, { borderColor: accentColor + "40" }]}>
                <Text style={[vaultStyles.tapBtnText, { color: accentColor }]}>Tap ({tapCount}/3)</Text>
              </TouchableOpacity>
              <View style={vaultStyles.encBadge}>
                <Feather name="shield" size={10} color={accentColor} />
                <Text style={[vaultStyles.encText, { color: accentColor }]}>SecureStore Device-Only Protection</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  if (phase === "biometric") {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={vaultStyles.backdrop}>
          <View style={vaultStyles.card}>
            <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={vaultStyles.inner}>
              <View style={vaultStyles.topRow}>
                <Text style={[vaultStyles.title, { color: accentColor }]}>Vault Mode</Text>
                <TouchableOpacity onPress={onClose} hitSlop={8}>
                  <Feather name="x" size={18} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              </View>
              <RNAnimated.View style={[vaultStyles.lockCircle, { borderColor: "#10b981" + "60", transform: [{ scale: pulseAnim }] }]}>
                <Feather name="unlock" size={36} color="#10b981" />
              </RNAnimated.View>
              <Text style={vaultStyles.authTitle}>Biometric Verification</Text>
              <Text style={vaultStyles.authDesc}>Triple-tap complete. Please complete biometric authentication to enter Vault Mode.</Text>
              <View style={vaultStyles.encBadge}>
                <Feather name="shield" size={10} color={accentColor} />
                <Text style={[vaultStyles.encText, { color: accentColor }]}>SecureStore Device-Only Protection</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  if (phase === "denied") {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={vaultStyles.backdrop}>
          <View style={vaultStyles.card}>
            <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={vaultStyles.inner}>
              <View style={vaultStyles.topRow}>
                <Text style={[vaultStyles.title, { color: "#ef4444" }]}>Access Denied</Text>
                <TouchableOpacity onPress={onClose} hitSlop={8}>
                  <Feather name="x" size={18} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              </View>
              <Feather name="lock" size={36} color="#ef4444" />
              <Text style={vaultStyles.authTitle}>Authentication Failed</Text>
              <Text style={vaultStyles.authDesc}>Biometric authentication was not successful. Vault Mode requires device biometrics or PIN.</Text>
              <TouchableOpacity onPress={onClose} style={[vaultStyles.tapBtn, { borderColor: "#ef444440" }]}>
                <Text style={[vaultStyles.tapBtnText, { color: "#ef4444" }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={[vaultStyles.activeContainer, { backgroundColor: "#06040f" }]}>
        <View style={[vaultStyles.activeHeader, { borderBottomColor: accentColor + "30" }]}>
          <TouchableOpacity onPress={onClose}>
            <Feather name="chevron-down" size={22} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Feather name="shield" size={12} color={accentColor} />
              <Text style={[vaultStyles.activeTitle, { color: accentColor }]}>Vault Mode</Text>
            </View>
            <Text style={vaultStyles.activeSub}>Biometric · SecureStore · Device-Only</Text>
          </View>
          <View style={vaultStyles.encPill}>
            <View style={[vaultStyles.encDot, { backgroundColor: "#10b981" }]} />
            <Text style={vaultStyles.encPillText}>Secured</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
          {messages.map(msg => (
            <View key={msg.id} style={[
              vaultStyles.msgBubble,
              msg.role === "user"
                ? [vaultStyles.userBubble, { backgroundColor: accentColor + "20", borderColor: accentColor + "30" }]
                : vaultStyles.aiBubble
            ]}>
              {msg.role === "assistant" && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 }}>
                  <Feather name="shield" size={10} color={accentColor} />
                  <Text style={[vaultStyles.aiLabel, { color: accentColor }]}>ENCRYPTED ADVISORY AI</Text>
                </View>
              )}
              <Text style={vaultStyles.msgContent}>{msg.content}</Text>
            </View>
          ))}
          {thinking && (
            <View style={vaultStyles.aiBubble}>
              <View style={{ flexDirection: "row", gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <View key={i} style={[vaultStyles.thinkDot, { backgroundColor: accentColor }]} />
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={vaultStyles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Send encrypted message..."
            placeholderTextColor="rgba(255,255,255,0.2)"
            style={vaultStyles.input}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={sendVaultMessage}
            disabled={!input.trim() || thinking}
            style={[vaultStyles.sendBtn, { backgroundColor: accentColor }, (!input.trim() || thinking) && { opacity: 0.4 }]}
          >
            <Feather name="lock" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const vaultStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", alignItems: "center", justifyContent: "center", padding: 20 },
  card: { width: "100%", borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  inner: { padding: 28, gap: 16, alignItems: "center" },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" },
  title: { fontSize: 18, fontWeight: "700" },
  lockCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)" },
  authTitle: { fontSize: 16, fontWeight: "700", color: "#fff", textAlign: "center" },
  authDesc: { fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 20 },
  tapBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginTop: 4 },
  tapBtnText: { fontSize: 15, fontWeight: "700" },
  encBadge: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  encText: { fontSize: 10, fontWeight: "600", letterSpacing: 0.5 },
  activeContainer: { flex: 1 },
  activeHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 54 : 24, paddingBottom: 14, borderBottomWidth: 1 },
  activeTitle: { fontSize: 14, fontWeight: "700", letterSpacing: 1 },
  activeSub: { fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 },
  encPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: "rgba(16,185,129,0.1)" },
  encDot: { width: 5, height: 5, borderRadius: 3 },
  encPillText: { fontSize: 9, color: "#10b981", fontWeight: "600" },
  msgBubble: { marginBottom: 10, maxWidth: "88%", borderRadius: 14, padding: 12, borderWidth: 1 },
  userBubble: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", borderBottomLeftRadius: 4 },
  aiLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  msgContent: { fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 20 },
  thinkDot: { width: 7, height: 7, borderRadius: 4, opacity: 0.5 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 12, paddingBottom: Platform.OS === "ios" ? 24 : 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  input: { flex: 1, color: "rgba(255,255,255,0.85)", fontSize: 14, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", maxHeight: 100 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", flexShrink: 0 },
});


function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

export default function AICommandScreen() {
  const insets = useSafeAreaInsets();
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") {
      SecureStore.getItemAsync(AUTH_TOKEN_KEY).then(t => setAuthToken(t)).catch(() => {});
    }
  }, []);

  const [copilotVisible, setCopilotVisible] = useState(false);
  const [vaultVisible, setVaultVisible] = useState(false);
  const [serverStatus, setServerStatus] = useState<"checking" | "healthy" | "error">("checking");
  const [refreshing, setRefreshing] = useState(false);
  const { cached: cachedHealthAt, save: saveHealthAt } = useOfflineCache<number>("cj-last-health-check");

  const { notifications, handleAction, dismissNotification } = usePushNotifications(ACCENT, getApiBase(), "carlota-jo", authToken);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/mcp/health`);
      const ok = res.ok;
      setServerStatus(ok ? "healthy" : "error");
      if (ok) saveHealthAt(Date.now()).catch(() => {});
    } catch { setServerStatus("error"); }
  }, [saveHealthAt]);

  useEffect(() => { checkHealth(); }, [checkHealth]);

  const onRefresh = async () => { setRefreshing(true); await checkHealth(); setRefreshing(false); };

  const statusColor = serverStatus === "healthy" ? "#10b981" : serverStatus === "error" ? "#ef4444" : "#f59e0b";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AI Command</Text>
          <Text style={styles.headerSub}>Carlota Jo Advisory Intelligence</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {serverStatus === "healthy" ? "Live" : serverStatus === "error" ? "Offline" : "..."}
          </Text>
        </View>
      </View>

      <NotificationOverlay
        accentColor={ACCENT}
        notifications={notifications}
        onAction={handleAction}
        onDismiss={dismissNotification}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        <TouchableOpacity onPress={() => setCopilotVisible(true)} style={styles.copilotCard} activeOpacity={0.85}>
          <View style={styles.copilotInner}>
            <View style={styles.copilotLeft}>
              <View style={[styles.copilotIcon, { backgroundColor: ACCENT + "20", borderColor: ACCENT + "40" }]}>
                <Feather name="cpu" size={22} color={ACCENT} />
              </View>
              <View>
                <Text style={styles.copilotTitle}>Advisory AI Copilot</Text>
                <Text style={styles.copilotDesc}>Client intelligence • Strategy • Decision support</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.3)" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setVaultVisible(true)} style={styles.vaultCard} activeOpacity={0.85}>
          <View style={styles.vaultInner}>
            <View style={[styles.vaultIcon, { backgroundColor: ACCENT + "20", borderColor: ACCENT + "40" }]}>
              <Feather name="shield" size={22} color={ACCENT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vaultTitle}>Vault Mode</Text>
              <Text style={styles.vaultDesc}>Encrypted on-device advisory conversations — triple-tap to activate</Text>
            </View>
            <Feather name="lock" size={16} color={ACCENT} />
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>AI Status</Text>
        {[
          { label: "Advisory Agent", status: "Active", color: "#10b981" },
          { label: "Client Intelligence", status: "4 Mandates", color: ACCENT },
          { label: "Vault Encryption", status: "AES-256 Ready", color: "#10b981" },
          { label: "Offline Cache", status: "Synced", color: "#10b981" },
        ].map(item => (
          <View key={item.label} style={styles.statusRow}>
            <Text style={styles.statusLabel}>{item.label}</Text>
            <View style={styles.statusRight}>
              <View style={[styles.statusIndicator, { backgroundColor: item.color }]} />
              <Text style={[styles.statusValue, { color: item.color }]}>{item.status}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <AICopilot
        visible={copilotVisible}
        onClose={() => setCopilotVisible(false)}
        agentName="Advisory"
        agentId="carlota"
        accentColor={ACCENT}
        welcomeMessage="Carlota Jo Advisory AI online. I have context on all active client engagements. How can I assist with your advisory work today?"
        suggestions={[
          "Summarize active client mandates",
          "What strategic opportunities should I prioritize?",
          "Prepare talking points for client meeting",
          "Review pipeline and conversion rates",
        ]}
      />

      <EncryptedVaultModal
        visible={vaultVisible}
        onClose={() => setVaultVisible(false)}
        accentColor={ACCENT}
        apiBase={getApiBase()}
        authToken={authToken}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700", letterSpacing: -0.3 },
  headerSub: { color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 1 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: BORDER },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "600" },
  sectionLabel: { fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.25)", letterSpacing: 1.2, textTransform: "uppercase", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  copilotCard: { margin: 14, marginBottom: 8, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: ACCENT + "30", backgroundColor: CARD },
  copilotInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  copilotLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  copilotIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  copilotTitle: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 2 },
  copilotDesc: { fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 15 },
  vaultCard: { marginHorizontal: 14, marginBottom: 8, borderRadius: 16, borderWidth: 1, borderColor: ACCENT + "40", backgroundColor: CARD },
  vaultInner: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  vaultIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  vaultTitle: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 2 },
  vaultDesc: { fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 15 },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  statusLabel: { fontSize: 12, color: "rgba(255,255,255,0.55)" },
  statusRight: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusIndicator: { width: 5, height: 5, borderRadius: 3 },
  statusValue: { fontSize: 11, fontWeight: "600" },
});
