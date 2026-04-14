import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { ErrorFallbackProps } from "@szl-holdings/mobile-shared";

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      {error && <Text style={styles.message}>{error.message}</Text>}
      <TouchableOpacity style={styles.button} onPress={resetError}>
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#090810",
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#c9a84c",
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: "rgba(240,238,255,0.35)",
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: "#c9a84c",
  },
  buttonText: {
    color: "#090810",
    fontSize: 14,
    fontWeight: "600",
  },
});
