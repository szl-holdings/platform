import type { ErrorFallbackProps } from '@szl-holdings/mobile-shared';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { giColors, giProductAccent, palette } from '@/lib/gi-bridge';

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      {error && <Text style={styles.message}>{error.message}</Text>}
      <TouchableOpacity style={styles.button} onPress={resetError}>
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: giColors.bg.base,
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: giProductAccent.holdings,
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: giColors.text.muted,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: giProductAccent.holdings,
  },
  buttonText: {
    color: giColors.bg.base,
    fontSize: 14,
    fontWeight: '600',
  },
});
