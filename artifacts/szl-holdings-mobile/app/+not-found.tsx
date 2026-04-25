import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { giColors, giProductAccent } from '@/lib/gi-bridge';

export default function NotFound() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Not Found</Text>
      <Link href={'/(shell)' as any} style={styles.link}>
        <Text style={styles.linkText}>Go Home</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: giColors.bg.base,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: giColors.text.primary,
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
    marginBottom: 16,
  },
  link: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  linkText: {
    color: giProductAccent.holdings,
    fontSize: 14,
  },
});
