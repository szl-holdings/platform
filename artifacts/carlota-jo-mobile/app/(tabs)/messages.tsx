import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface Message {
  id: string;
  body: string;
  from: "rosa" | "client";
  time: string;
  date?: string;
  readStatus?: "sent" | "delivered" | "read";
}

function ReadReceipt({ status }: { status?: "sent" | "delivered" | "read" }) {
  const colors = useColors();
  if (!status) return null;
  const isRead = status === "read";
  const color = isRead ? colors.gold : colors.mutedForeground;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 1, marginTop: 2, alignSelf: "flex-end" }}>
      {status === "sent" ? (
        <Feather name="check" size={9} color={color} />
      ) : (
        <>
          <Feather name="check" size={9} color={color} />
          <Feather name="check" size={9} color={color} style={{ marginLeft: -4 }} />
        </>
      )}
      {isRead && (
        <Text style={{ fontSize: 8, fontFamily: "Inter_300Light", color: colors.gold, marginLeft: 2 }}>Read</Text>
      )}
    </View>
  );
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    body: "Good afternoon. I hope this finds you well. I've just shared the March operations summary — it covers the Oxfordshire condition report and vendor recommendations. Please do review at your convenience and let me know if you have any questions before our April session.",
    from: "rosa",
    time: "9:41 AM",
    date: "Today",
  },
  {
    id: "2",
    body: "Thank you, Rosa. I'll review this afternoon. The Oxfordshire report is the priority — I want to understand the timeline for the vendor changes.",
    from: "client",
    time: "11:23 AM",
    readStatus: "read",
  },
  {
    id: "3",
    body: "Of course. I've included a detailed rationale in the vendor document. The proposed transition would be phased over April and May, with no disruption to day-to-day operations. I'll elaborate further in our April 7th session.",
    from: "rosa",
    time: "11:47 AM",
  },
  {
    id: "4",
    body: "Perfect. I'd also like to discuss the Mayfair schedule for May — we'll have guests from the 12th.",
    from: "client",
    time: "12:05 PM",
    readStatus: "read",
  },
  {
    id: "5",
    body: "Noted. I'll prepare a briefing on Mayfair staffing and vendor coverage for that period. We can go through it on the 7th. Is there anything specific you'd like me to prepare in advance?",
    from: "rosa",
    time: "2:18 PM",
    date: "Yesterday",
  },
];

function MessageBubble({ msg }: { msg: Message }) {
  const colors = useColors();
  const isClient = msg.from === "client";

  return (
    <View style={[styles.bubbleRow, isClient && styles.bubbleRowRight]}>
      {!isClient && (
        <View style={[styles.avatarDot, { borderColor: colors.goldBorder }]}>
          <Text style={[styles.avatarText, { color: colors.gold }]}>R</Text>
        </View>
      )}
      <View style={[styles.bubbleWrap, isClient && styles.bubbleWrapRight]}>
        {msg.date && (
          <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>
            {msg.date}
          </Text>
        )}
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isClient ? colors.goldDim : colors.surfaceElevated,
              borderColor: isClient ? colors.goldBorder : colors.creamFaint,
              alignSelf: isClient ? "flex-end" : "flex-start",
            },
          ]}
        >
          <Text style={[styles.bubbleText, { color: colors.cream }]}>{msg.body}</Text>
          <Text
            style={[
              styles.bubbleTime,
              { color: colors.mutedForeground, textAlign: isClient ? "right" : "left" },
            ]}
          >
            {msg.time}
          </Text>
          {isClient && <ReadReceipt status={msg.readStatus} />}
        </View>
      </View>
    </View>
  );
}

export default function MessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSend = async () => {
    if (!draft.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMsg: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      body: draft.trim(),
      from: "client",
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      readStatus: "sent",
    };
    setMessages((prev) => [...prev, newMsg]);
    setDraft("");
    setSending(true);

    setTimeout(() => {
      const reply: Message = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        body: "Thank you — I'll look into this and come back to you shortly. For anything urgent, you can always reach me directly at rosa@carlotajo.com.",
        from: "rosa",
        time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, reply]);
      setSending(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2000);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(200,169,106,0.05)", "transparent"]}
        style={[styles.headerGradient, { height: topPad + 60 }]}
      />

      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.goldSubtle }]}>
            DIRECT LINE
          </Text>
          <Text style={[styles.title, { color: colors.cream }]}>Rosa</Text>
        </View>
        <View style={[styles.onlineIndicator, { borderColor: colors.goldBorder }]}>
          <View style={[styles.onlineDot, { backgroundColor: "#5a9e6b" }]} />
          <Text style={[styles.onlineText, { color: colors.creamDim }]}>Usually replies same day</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble msg={item} />}
          contentContainerStyle={[styles.listContent, { paddingBottom: 16 }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          scrollEnabled={messages.length > 0}
        />

        {sending && (
          <View style={[styles.typingRow, { paddingLeft: 20 }]}>
            <View style={[styles.avatarDot, { borderColor: colors.goldBorder }]}>
              <Text style={[styles.avatarText, { color: colors.gold }]}>R</Text>
            </View>
            <View style={[styles.typingBubble, { backgroundColor: colors.surfaceElevated, borderColor: colors.creamFaint }]}>
              <ActivityIndicator size="small" color={colors.gold} />
            </View>
          </View>
        )}

        <View
          style={[
            styles.inputRow,
            {
              borderTopColor: colors.creamFaint,
              backgroundColor: colors.background,
              paddingBottom: bottomInset + 90,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.creamFaint,
                color: colors.cream,
              },
            ]}
            placeholder="Message Rosa…"
            placeholderTextColor={colors.mutedForeground}
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={1000}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <Pressable
            onPress={handleSend}
            disabled={!draft.trim() || sending}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: draft.trim() ? colors.gold : colors.goldDim,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Feather
              name="arrow-up"
              size={16}
              color={draft.trim() ? colors.inkDeep : colors.goldSubtle}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  eyebrow: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 3,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: "CormorantGaramond_400Regular",
  },
  onlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  onlineText: {
    fontSize: 9,
    fontFamily: "Inter_300Light",
    letterSpacing: 0.3,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  bubbleRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 10,
    alignItems: "flex-end",
  },
  bubbleRowRight: {
    justifyContent: "flex-end",
  },
  bubbleWrap: {
    flex: 1,
    maxWidth: "82%",
  },
  bubbleWrapRight: {
    alignItems: "flex-end",
  },
  dateLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1.5,
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 4,
  },
  avatarDot: {
    width: 28,
    height: 28,
    borderRadius: 0,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 11,
    fontFamily: "CormorantGaramond_500Medium",
    letterSpacing: 1,
  },
  bubble: {
    borderWidth: 1,
    padding: 12,
    maxWidth: "100%",
  },
  bubbleText: {
    fontSize: 13,
    fontFamily: "Inter_300Light",
    lineHeight: 20,
    marginBottom: 4,
  },
  bubbleTime: {
    fontSize: 9,
    fontFamily: "Inter_300Light",
    letterSpacing: 0.3,
  },
  typingRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  typingBubble: {
    borderWidth: 1,
    padding: 12,
    minWidth: 56,
    alignItems: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_300Light",
    maxHeight: 100,
    minHeight: 44,
  },
  sendBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
