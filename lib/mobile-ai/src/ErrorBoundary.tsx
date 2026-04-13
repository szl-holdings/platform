import React, { Component, type ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  accentColor?: string;
  backgroundColor?: string;
  onReload?: () => void;
}

function ErrorFallback({
  error,
  accentColor,
  backgroundColor,
  onReload,
}: {
  error: Error | null;
  accentColor: string;
  backgroundColor: string;
  onReload: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <Text style={styles.title}>Something went wrong</Text>
      {error && <Text style={styles.message}>{error.message}</Text>}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: accentColor }]}
        onPress={onReload}
      >
        <Text style={[styles.buttonText, { color: backgroundColor }]}>Reload App</Text>
      </TouchableOpacity>
    </View>
  );
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("[ErrorBoundary]", error);
  }

  handleReload = () => {
    if (this.props.onReload) {
      this.props.onReload();
    } else {
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          accentColor={this.props.accentColor ?? "#c9a84c"}
          backgroundColor={this.props.backgroundColor ?? "#0a0a0a"}
          onReload={this.handleReload}
        />
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: "#E8EAF0",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  message: {
    color: "rgba(232,234,240,0.5)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
