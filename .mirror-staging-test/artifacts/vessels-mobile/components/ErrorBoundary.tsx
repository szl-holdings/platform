import React, { Component, type ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error?.message}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
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
    fontWeight: "700" as const,
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
    backgroundColor: "rgba(14,165,233,0.15)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(14,165,233,0.25)",
  },
  buttonText: {
    color: "#0ea5e9",
    fontSize: 14,
    fontWeight: "600" as const,
  },
});
