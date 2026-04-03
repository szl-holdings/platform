import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { reloadAppAsync } from "expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LYTE_COLORS } from "@/constants/colors";

function ErrorFallback({ error }: { error: Error }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, backgroundColor: LYTE_COLORS.background }]}>
      <Text style={styles.icon}>⚡</Text>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{error.message}</Text>
      <Pressable style={styles.button} onPress={() => reloadAppAsync()}>
        <Text style={styles.buttonText}>Restart App</Text>
      </Pressable>
    </View>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Lyte Mobile error:", error, info);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "600", color: "#fff", marginBottom: 8, textAlign: "center" },
  message: { fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 32, textAlign: "center", lineHeight: 20 },
  button: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: "rgba(0,212,255,0.15)", borderRadius: 8, borderWidth: 1, borderColor: "rgba(0,212,255,0.3)" },
  buttonText: { fontSize: 14, color: "#00d4ff", fontWeight: "600" },
});
