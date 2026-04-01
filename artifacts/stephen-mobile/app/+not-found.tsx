import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export default function NotFoundScreen() {
  const colors = useColors();
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Page not found</Text>
        <Link href="/" style={[styles.link, { color: colors.silver }]}>
          Go to home
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  title: { fontSize: 20, fontFamily: "Inter_600SemiBold", marginBottom: 16 },
  link: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
