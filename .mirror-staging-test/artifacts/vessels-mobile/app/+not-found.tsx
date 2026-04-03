import { Link, Stack } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

export default function NotFoundScreen() {
  const colors = useColors();
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={[styles.text, { color: colors.text }]}>Screen not found</Text>
        <Link href="/" style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary }}>Go home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
});
