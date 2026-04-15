import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Link, Stack } from "expo-router";
import { CORTEX_COLORS } from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Screen not found</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Return to Command</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: CORTEX_COLORS.bg },
  title: { fontSize: 20, fontWeight: "600", color: CORTEX_COLORS.text },
  link: { marginTop: 16 },
  linkText: { fontSize: 16, color: CORTEX_COLORS.gold },
});
