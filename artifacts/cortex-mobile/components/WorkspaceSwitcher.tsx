import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWorkspace } from "@/context/WorkspaceContext";
import { WORKSPACES, type WorkspaceId } from "@/constants/workspaces";
import { CORTEX_COLORS } from "@/constants/colors";

interface Props {
  onClose: () => void;
}

export function WorkspaceSwitcher({ onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { activeWorkspace, setActiveWorkspace, badges } = useWorkspace();

  const handleSelect = (id: WorkspaceId) => {
    setActiveWorkspace(id);
    onClose();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.header}>
        <Text style={styles.logoText}>CORTEX</Text>
        <Text style={styles.subtitle}>Workspace Switcher</Text>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {WORKSPACES.map((ws) => {
          const isActive = ws.id === activeWorkspace;
          const badge = badges[ws.id] ?? 0;
          return (
            <Pressable
              key={ws.id}
              style={[styles.item, isActive && { backgroundColor: `${ws.accentColor}15`, borderColor: `${ws.accentColor}40` }]}
              onPress={() => handleSelect(ws.id)}
            >
              <View style={[styles.iconContainer, { backgroundColor: isActive ? ws.accentColor : `${ws.accentColor}20` }]}>
                <Text style={styles.icon}>{ws.icon}</Text>
              </View>
              <View style={styles.itemText}>
                <Text style={[styles.itemLabel, isActive && { color: ws.accentColor }]}>{ws.label}</Text>
                <Text style={styles.itemDescription}>{ws.description}</Text>
              </View>
              <View style={styles.itemRight}>
                {badge > 0 && (
                  <View style={[styles.badge, { backgroundColor: ws.accentColor }]}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                )}
                <View style={[styles.healthDot, { backgroundColor: badge > 2 ? CORTEX_COLORS.warning : CORTEX_COLORS.success }]} />
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeText}>Close</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORTEX_COLORS.bg, paddingHorizontal: 20 },
  header: { marginBottom: 24, alignItems: "center" },
  logoText: { fontSize: 28, fontWeight: "800", color: CORTEX_COLORS.gold, letterSpacing: 6 },
  subtitle: { fontSize: 12, color: CORTEX_COLORS.textMuted, marginTop: 4, letterSpacing: 2, textTransform: "uppercase" },
  list: { flex: 1 },
  item: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: CORTEX_COLORS.borderLight, backgroundColor: CORTEX_COLORS.bgCard },
  iconContainer: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 22 },
  itemText: { flex: 1, marginLeft: 14 },
  itemLabel: { fontSize: 16, fontWeight: "600", color: CORTEX_COLORS.text },
  itemDescription: { fontSize: 12, color: CORTEX_COLORS.textMuted, marginTop: 2 },
  itemRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#080B12" },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  closeButton: { alignItems: "center", paddingVertical: 16, borderTopWidth: 1, borderTopColor: CORTEX_COLORS.borderLight },
  closeText: { fontSize: 15, fontWeight: "600", color: CORTEX_COLORS.textSecondary },
});
