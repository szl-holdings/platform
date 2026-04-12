import React, { useState, useEffect } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { AICopilot as SharedAICopilot } from "@szl-holdings/mobile-ai";
import type { CopilotConfig } from "@szl-holdings/mobile-ai";

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
  toolStatus?: "running" | "success" | "error";
  timestamp: number;
}

export interface PendingAction {
  id: string;
  description: string;
  type: string;
  payload?: Record<string, unknown>;
}

const AUTH_TOKEN_KEY = "szl_auth_token";
const ACCENT = "#c9a84c";
const DEFAULT_SYSTEM_CONTEXT = "You are an SZL Holdings executive portfolio AI assistant with access to portfolio analytics, market intelligence, and investment decision tools.";
const DEFAULT_AGENT_ID = "szl";
const DEFAULT_AGENT_NAME = "SZL Holdings";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
  }
  return process.env.EXPO_PUBLIC_API_URL ?? "";
}

async function getStoredToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return typeof window !== "undefined" ? window.localStorage.getItem(AUTH_TOKEN_KEY) : null;
    }
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

interface AICopilotProps {
  visible: boolean;
  onClose: () => void;
  agentName?: string;
  agentId?: string;
  accentColor?: string;
  systemContext?: string;
  welcomeMessage?: string;
  suggestions?: string[];
}

export function AICopilot({
  visible,
  onClose,
  agentName = DEFAULT_AGENT_NAME,
  agentId = DEFAULT_AGENT_ID,
  accentColor = ACCENT,
  systemContext = DEFAULT_SYSTEM_CONTEXT,
  welcomeMessage,
  suggestions,
}: AICopilotProps) {
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    getStoredToken().then(t => setAuthToken(t ?? undefined));
  }, []);

  const config: CopilotConfig = {
    accentColor,
    agentId,
    placeholder: `Ask ${agentName} anything\u2026`,
    systemContext,
    apiBaseUrl: getApiBase(),
    authToken,
    welcomeMessage,
    suggestions,
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.header, { borderBottomColor: accentColor + "40" }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.dot, { backgroundColor: accentColor }]} />
            <Text style={[styles.title, { color: accentColor }]}>{agentName}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
            <Feather name="x" size={22} color="#aaa" />
          </TouchableOpacity>
        </View>
        <SharedAICopilot config={config} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
  closeBtn: { padding: 4 },
});
