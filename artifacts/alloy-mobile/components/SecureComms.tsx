import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

interface CommsMessage {
  id: string;
  from: string;
  content: string;
  timestamp: string;
  type: "analyst" | "command" | "system";
}

interface SecureCommsProps {
  visible: boolean;
  onClose: () => void;
  incidentId?: number | string;
}

const INITIAL_MESSAGES: CommsMessage[] = [
  {
    id: "1",
    from: "SYSTEM",
    content: "Secure channel established. End-to-end encrypted.",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    type: "system",
  },
  {
    id: "2",
    from: "SOC Commander",
    content: "All analysts on standby. Awaiting incident brief.",
    timestamp: new Date(Date.now() - 240000).toISOString(),
    type: "analyst",
  },
  {
    id: "3",
    from: "IR Lead",
    content: "Network isolation initiated on affected segment. Monitoring lateral movement.",
    timestamp: new Date(Date.now() - 120000).toISOString(),
    type: "analyst",
  },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function SecureComms({ visible, onClose, incidentId }: SecureCommsProps) {
  const [messages, setMessages] = useState<CommsMessage[]>(INITIAL_MESSAGES);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const send = useCallback(() => {
    const content = text.trim();
    if (!content) return;
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    const msg: CommsMessage = {
      id: Date.now().toString(),
      from: "You (Field Command)",
      content,
      timestamp: new Date().toISOString(),
      type: "command",
    };
    setMessages((prev) => [...prev, msg]);
    setText("");
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [text]);

  useEffect(() => {
    if (!visible) return;
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 200);
  }, [visible]);

  const renderItem = ({ item }: { item: CommsMessage }) => {
    const isMe = item.type === "command";
    const isSystem = item.type === "system";

    if (isSystem) {
      return (
        <View style={styles.systemMsg}>
          <Feather name="lock" size={10} color="#22c55e" />
          <Text style={styles.systemText}>{item.content}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          {!isMe && <Text style={styles.msgFrom}>{item.from}</Text>}
          <Text style={[styles.msgContent, isMe && styles.msgContentMe]}>
            {item.content}
          </Text>
          <Text style={[styles.msgTime, isMe && { color: "rgba(255,255,255,0.5)" }]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          style={styles.panel}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.lockIcon}>
                <Feather name="shield" size={14} color="#ef4444" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Secure Comms</Text>
                <Text style={styles.headerSub}>
                  INC-{incidentId} · E2E Encrypted
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={18} color="rgba(255,255,255,0.4)" />
            </Pressable>
          </View>

          <View style={styles.channelRow}>
            <View style={styles.activeDot} />
            <Text style={styles.channelText}>IR Response Channel — 3 analysts online</Text>
          </View>

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TextInput
              style={styles.input}
              placeholder="Type secure message…"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={send}
            />
            <Pressable
              style={[styles.sendBtn, !text.trim() && { opacity: 0.4 }]}
              onPress={send}
              disabled={!text.trim()}
            >
              <Feather name="send" size={16} color="#090810" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  panel: {
    height: "80%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(239,68,68,0.1)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  lockIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  headerSub: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.4)",
  },
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(34,197,94,0.05)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(34,197,94,0.1)",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22c55e",
  },
  channelText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(34,197,94,0.8)",
  },
  list: { flex: 1 },
  listContent: {
    padding: 16,
    gap: 12,
  },
  systemMsg: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  systemText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(34,197,94,0.6)",
    textAlign: "center",
  },
  msgRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  msgRowMe: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  bubbleThem: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderTopLeftRadius: 4,
  },
  bubbleMe: {
    backgroundColor: "#ef4444",
    borderTopRightRadius: 4,
  },
  msgFrom: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  msgContent: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
  },
  msgContentMe: { color: "#fff" },
  msgTime: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.3)",
    alignSelf: "flex-end",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#fff",
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
});
