import { View, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";

export default function NotFound() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Not Found</Text>
      <Link href="/(tabs)" style={styles.link}>
        <Text style={styles.linkText}>Go Home</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090810",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: "#f0eeff",
    fontSize: 18,
    fontFamily: "Inter_500Medium",
    marginBottom: 16,
  },
  link: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  linkText: {
    color: "#c9a84c",
    fontSize: 14,
  },
});
