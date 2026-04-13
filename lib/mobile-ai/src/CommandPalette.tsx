import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  FlatList,
  Platform,
  Keyboard,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

export interface CommandItem {
  id: string;
  label: string;
  subtitle?: string;
  icon: string;
  action: () => void;
  tags?: string[];
}

export interface CommandPaletteProps {
  visible: boolean;
  onClose: () => void;
  commands: CommandItem[];
  accentColor?: string;
  placeholder?: string;
}

export function CommandPalette({
  visible,
  onClose,
  commands,
  accentColor = "#c9a84c",
  placeholder = "Search commands, data, screens\u2026",
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 100);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    }
  }, [visible]);

  const filtered = query.trim()
    ? commands.filter((c) => {
        const q = query.toLowerCase();
        return (
          c.label.toLowerCase().includes(q) ||
          c.subtitle?.toLowerCase().includes(q) ||
          c.tags?.some((t) => t.toLowerCase().includes(q))
        );
      })
    : commands.slice(0, 8);

  const handleSelect = useCallback(
    (item: CommandItem) => {
      if (Platform.OS !== "web") {
        Haptics.selectionAsync().catch(() => {});
      }
      Keyboard.dismiss();
      onClose();
      setTimeout(() => item.action(), 50);
    },
    [onClose]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View
          style={[styles.panel, { marginTop: insets.top + 8 }]}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.inner}>
            <View style={[styles.searchRow, { borderColor: `${accentColor}40` }]}>
              <Feather name="search" size={16} color={accentColor} />
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery("")} hitSlop={8}>
                  <Feather name="x-circle" size={14} color="rgba(255,255,255,0.3)" />
                </Pressable>
              )}
            </View>

            {filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No results for "{query}"</Text>
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="always"
                style={styles.list}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [
                      styles.item,
                      pressed && { backgroundColor: `${accentColor}15` },
                    ]}
                    onPress={() => handleSelect(item)}
                  >
                    <View style={[styles.iconBox, { borderColor: `${accentColor}30` }]}>
                      <Feather name={item.icon as React.ComponentProps<typeof Feather>["name"]} size={14} color={accentColor} />
                    </View>
                    <View style={styles.itemText}>
                      <Text style={styles.itemLabel}>{item.label}</Text>
                      {item.subtitle && (
                        <Text style={styles.itemSub}>{item.subtitle}</Text>
                      )}
                    </View>
                    <Feather
                      name="arrow-right"
                      size={12}
                      color="rgba(255,255,255,0.2)"
                    />
                  </Pressable>
                )}
              />
            )}

            <View style={styles.footer}>
              <Text style={styles.footerHint}>
                Shake phone or pull down to open
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  panel: {
    marginHorizontal: 12,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    maxHeight: 520,
  },
  inner: {
    flex: 1,
    gap: 0,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderBottomWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#fff",
    height: 22,
  },
  list: {
    maxHeight: 380,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  itemText: {
    flex: 1,
    gap: 2,
  },
  itemLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.9)",
  },
  itemSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.4)",
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.3)",
  },
  footer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },
  footerHint: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.2)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
