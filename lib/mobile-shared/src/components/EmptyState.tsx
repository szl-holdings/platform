import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from "react-native";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  accentColor?: string;
  style?: ViewStyle;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  accentColor = "#C8A96A",
  style,
  compact = false,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, compact ? styles.containerCompact : styles.containerFull, style]}>
      {icon && (
        <View
          style={[
            styles.iconWrap,
            compact ? styles.iconWrapCompact : styles.iconWrapFull,
            { backgroundColor: `${accentColor}14`, borderColor: `${accentColor}22` },
          ]}
        >
          {icon}
        </View>
      )}

      <Text style={[styles.title, compact ? styles.titleCompact : styles.titleFull]}>
        {title}
      </Text>

      {description ? (
        <Text style={[styles.description, compact ? styles.descriptionCompact : styles.descriptionFull]}>
          {description}
        </Text>
      ) : null}

      {(action || secondaryAction) ? (
        <View style={styles.actions}>
          {action ? (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: accentColor }]}
              onPress={action.onPress}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>{action.label}</Text>
            </TouchableOpacity>
          ) : null}
          {secondaryAction ? (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={secondaryAction.onPress}
              activeOpacity={0.7}
            >
              <Text style={[styles.secondaryButtonText, { color: `${accentColor}CC` }]}>
                {secondaryAction.label}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  containerFull: {
    paddingVertical: 56,
    paddingHorizontal: 32,
  },
  containerCompact: {
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  iconWrap: {
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconWrapFull: {
    width: 64,
    height: 64,
    borderRadius: 20,
  },
  iconWrapCompact: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  title: {
    color: "rgba(232,234,240,0.75)",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  titleFull: {
    fontSize: 17,
  },
  titleCompact: {
    fontSize: 14,
  },
  description: {
    color: "rgba(232,234,240,0.4)",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  descriptionFull: {
    fontSize: 13,
    maxWidth: 280,
  },
  descriptionCompact: {
    fontSize: 12,
    maxWidth: 240,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: "#080B12",
    fontSize: 13,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
