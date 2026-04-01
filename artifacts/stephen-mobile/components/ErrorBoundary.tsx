import React, { Component, ComponentType, PropsWithChildren } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { reloadAppAsync } from "expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{error.message}</Text>
      <TouchableOpacity style={styles.button} onPress={() => reloadAppAsync()}>
        <Text style={styles.buttonText}>Restart App</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.resetButton} onPress={resetError}>
        <Text style={styles.resetText}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: "#f5f5f5",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#858585",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#c4a97e",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#0a0a0a",
  },
  resetButton: {
    paddingVertical: 8,
  },
  resetText: {
    fontSize: 13,
    color: "#858585",
  },
});

export type ErrorBoundaryProps = PropsWithChildren<{
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, stackTrace: string) => void;
}>;

type ErrorBoundaryState = { error: Error | null };

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static defaultProps: { FallbackComponent: ComponentType<ErrorFallbackProps> } = {
    FallbackComponent: ErrorFallback,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    if (typeof this.props.onError === "function") {
      this.props.onError(error, info.componentStack);
    }
  }

  resetError = (): void => {
    this.setState({ error: null });
  };

  render() {
    const { FallbackComponent } = this.props;
    return this.state.error && FallbackComponent ? (
      <FallbackComponent error={this.state.error} resetError={this.resetError} />
    ) : (
      this.props.children
    );
  }
}
