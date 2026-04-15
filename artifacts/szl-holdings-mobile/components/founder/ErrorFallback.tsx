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
    backgroundColor: "#0a0a0a",
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#c4a97e",
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: "#858585",
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: "#c4a97e",
  },
  buttonText: {
    color: "#0a0a0a",
    fontSize: 14,
    fontWeight: "600",
  },
});
