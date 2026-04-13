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
import { AICopilot } from "./AICopilot";
import type { CopilotConfig } from "./AICopilot";

export interface AICopilotModalProps {
  visible: boolean;
  onClose: () => void;
  agentName: string;
  agentId: string;
  accentColor: string;
  systemContext: string;
  authTokenKey: string;
  welcomeMessage?: string;
  suggestions?: string[];
}

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
  }
  return process.env.EXPO_PUBLIC_API_URL ?? "";
}

async function getStoredToken(tokenKey: string): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return typeof window !== "undefined" ? window.localStorage.getItem(tokenKey) : null;
    }
    return await SecureStore.getItemAsync(tokenKey);
  } catch {
    return null;
  }
}

export function AICopilotModal({
  visible,
  onClose,
  agentName,
  agentId,
  accentColor,
  systemContext,
  authTokenKey,
  welcomeMessage,
  suggestions,
}: AICopilotModalProps) {
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    getStoredToken(authTokenKey).then(t => setAuthToken(t ?? undefined));
  }, [authTokenKey]);

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
        <AICopilot config={config} />
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
