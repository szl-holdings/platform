import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { ErrorFallbackProps } from "@szl-holdings/mobile-shared";

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{error?.message}</Text>
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
    backgroundColor: "#020d18",
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e0f2fe",
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: "rgba(224,242,254,0.5)",
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#0ea5e9",
  },
  buttonText: {
    color: "#020d18",
    fontSize: 14,
    fontWeight: "600",
  },
});
