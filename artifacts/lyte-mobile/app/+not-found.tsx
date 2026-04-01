import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { LYTE_COLORS } from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={styles.container}>
        <Text style={styles.title}>404</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: LYTE_COLORS.background },
  title: { fontSize: 24, color: LYTE_COLORS.textPrimary, marginBottom: 16 },
  link: {},
  linkText: { color: LYTE_COLORS.electricBlue, fontSize: 16 },
});
