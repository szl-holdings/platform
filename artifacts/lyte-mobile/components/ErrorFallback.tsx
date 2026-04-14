import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { ErrorFallbackProps } from "@szl-holdings/mobile-shared";

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>System Error</Text>
      {error && <Text style={styles.message}>{error.message}</Text>}
      <TouchableOpacity style={styles.button} onPress={resetError}>
        <Text style={styles.buttonText}>Restart</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#070c14",
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#00d4ff",
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: "rgba(0,212,255,0.5)",
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: "#00d4ff",
  },
  buttonText: {
    color: "#070c14",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
