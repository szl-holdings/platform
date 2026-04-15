import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CORTEX_COLORS } from "@/constants/colors";

interface Props {
  error: Error;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{error.message}</Text>
      <Pressable style={styles.button} onPress={resetError}>
        <Text style={styles.buttonText}>Try Again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: CORTEX_COLORS.bg },
  title: { color: CORTEX_COLORS.text, fontSize: 20, fontWeight: "600", marginBottom: 8 },
  message: { color: CORTEX_COLORS.textMuted, fontSize: 14, textAlign: "center", marginBottom: 24 },
  button: { backgroundColor: "#334155", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: CORTEX_COLORS.text, fontSize: 14, fontWeight: "600" },
});
