/**
 * AppModeBanner (React Native) — APEX Mobile
 *
 * Reads EXPO_PUBLIC_APP_MODE to show a persistent environment banner.
 *
 * - demo      → amber strip "DEMO MODE — no live data", non-dismissible
 * - sandbox   → teal strip "SANDBOX — staging environment", dismissible
 * - production → renders nothing
 */

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type AppMode = 'demo' | 'sandbox' | 'production' | 'local-dev';

function resolveAppMode(): AppMode {
  const raw = (process.env.EXPO_PUBLIC_APP_MODE ?? '').toLowerCase().trim();
  if (raw === 'demo') return 'demo';
  if (raw === 'sandbox') return 'sandbox';
  if (raw === 'production') return 'production';
  return 'local-dev';
}

const APP_MODE = resolveAppMode();

export interface AppModeBannerProps {
  onResetDemo?: () => void;
}

export function AppModeBanner({ onResetDemo }: AppModeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (APP_MODE !== 'demo' && APP_MODE !== 'sandbox') return null;
  if (APP_MODE === 'sandbox' && dismissed) return null;

  const isDemo = APP_MODE === 'demo';

  return (
    <View style={[styles.container, isDemo ? styles.demoBg : styles.sandboxBg]}>
      <View style={styles.row}>
        <View style={[styles.dot, isDemo ? styles.demoDot : styles.sandboxDot]} />
        <Text style={[styles.label, isDemo ? styles.demoLabel : styles.sandboxLabel]}>
          {isDemo ? 'DEMO MODE' : 'SANDBOX'}
        </Text>
        <Text style={styles.separator}>·</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {isDemo ? 'No live data — writes intercepted' : 'Staging environment — not production'}
        </Text>
      </View>

      <View style={styles.actions}>
        {isDemo && onResetDemo && (
          <Pressable
            onPress={onResetDemo}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.demoActionBtn,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Reset demo data"
          >
            <Text style={[styles.actionText, styles.demoActionText]}>Reset</Text>
          </Pressable>
        )}
        {!isDemo && (
          <Pressable
            onPress={() => setDismissed(true)}
            style={({ pressed }) => [styles.dismissBtn, pressed && styles.pressed]}
            accessibilityLabel="Dismiss sandbox banner"
          >
            <Text style={styles.dismissText}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  demoBg: {
    backgroundColor: 'rgba(212,100,40,0.18)',
    borderBottomColor: 'rgba(212,100,40,0.35)',
  },
  sandboxBg: {
    backgroundColor: 'rgba(20,184,166,0.12)',
    borderBottomColor: 'rgba(20,184,166,0.25)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  demoDot: {
    backgroundColor: '#e8884a',
  },
  sandboxDot: {
    backgroundColor: '#2dd4bf',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  demoLabel: {
    color: '#e8884a',
  },
  sandboxLabel: {
    color: '#2dd4bf',
  },
  separator: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
  },
  subtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },
  demoActionBtn: {
    backgroundColor: 'rgba(232,136,74,0.15)',
    borderColor: 'rgba(232,136,74,0.40)',
  },
  actionText: {
    fontSize: 10,
    fontWeight: '600',
  },
  demoActionText: {
    color: '#e8884a',
  },
  dismissBtn: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: 'rgba(255,255,255,0.40)',
    fontSize: 12,
  },
  pressed: {
    opacity: 0.6,
  },
});
