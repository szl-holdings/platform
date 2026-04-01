import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error?.message ?? "An unexpected error occurred."}</Text>
          <Pressable style={styles.button} onPress={() => this.setState({ hasError: false })}>
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090810",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  title: {
    color: "#f0eeff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  message: {
    color: "rgba(240,238,255,0.5)",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.3)",
  },
  buttonText: {
    color: "#c9a84c",
    fontSize: 13,
    fontWeight: "600",
  },
});
