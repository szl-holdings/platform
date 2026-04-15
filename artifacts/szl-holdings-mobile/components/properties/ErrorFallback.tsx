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
    backgroundColor: "#0d0b08",
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#b8943c",
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: "rgba(184,148,60,0.5)",
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: "#b8943c",
  },
  buttonText: {
    color: "#0d0b08",
    fontSize: 14,
    fontWeight: "600",
  },
});
