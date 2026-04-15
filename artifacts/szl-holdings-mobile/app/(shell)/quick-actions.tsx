import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { QuickActionDeck } from "@/components/QuickActionDeck";

const ACCENT = "#c9a84c";

export default function QuickActionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Quick Actions</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Swipe right to approve · Swipe left to deny
          </Text>
        </View>
        <View style={[styles.accentDot, { backgroundColor: `${ACCENT}20`, borderColor: `${ACCENT}40` }]}>
          <Text style={[styles.accentDotText, { color: ACCENT }]}>⬡</Text>
        </View>
      </View>

      <View style={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
        <QuickActionDeck />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    letterSpacing: 0.2,
  },
  accentDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  accentDotText: { fontSize: 18 },
  body: {
    flex: 1,
    paddingTop: 20,
  },
});
