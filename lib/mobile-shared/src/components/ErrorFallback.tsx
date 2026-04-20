import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ErrorFallbackProps } from './ErrorBoundary';

export type ErrorFallbackMode = 'reset' | 'reload';

export interface BrandedErrorFallbackProps extends ErrorFallbackProps {
  mode?: ErrorFallbackMode;
  accentColor?: string;
  appName?: string;
  backgroundColor?: string;
}

export function BrandedErrorFallback({
  error,
  resetError,
  mode = 'reload',
  accentColor = '#334155',
  appName,
  backgroundColor = '#080B12',
}: BrandedErrorFallbackProps) {
  const insets = useSafeAreaInsets();
  const [devModalVisible, setDevModalVisible] = useState(false);

  const monoFont = Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  });

  const handlePrimaryAction = async () => {
    if (mode === 'reload') {
      try {
        const { reloadAppAsync } = await import('expo');
        await reloadAppAsync();
      } catch {
        resetError();
      }
    } else {
      resetError();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingTop: insets.top || 24,
          paddingBottom: insets.bottom || 24,
        },
      ]}
    >
      {__DEV__ ? (
        <Pressable
          onPress={() => setDevModalVisible(true)}
          accessibilityLabel="View error details"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.devButton,
            { top: (insets.top || 0) + 16, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={styles.devButtonText}>!</Text>
        </Pressable>
      ) : null}

      <View style={styles.content}>
        <View style={[styles.iconCircle, { borderColor: `${accentColor}44` }]}>
          <Text style={styles.iconText}>⚡</Text>
        </View>

        <Text style={styles.title}>Something went wrong</Text>

        {appName ? (
          <Text style={styles.appName}>{appName} encountered an unexpected error.</Text>
        ) : null}

        <Text style={styles.message}>
          {mode === 'reload' ? 'Please reload the app to continue.' : 'Tap below to try again.'}
        </Text>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: accentColor }]}
          onPress={handlePrimaryAction}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>
            {mode === 'reload' ? 'Reload App' : 'Try Again'}
          </Text>
        </TouchableOpacity>

        {mode === 'reload' ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={resetError} activeOpacity={0.7}>
            <Text style={styles.secondaryButtonText}>Dismiss</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {__DEV__ ? (
        <Modal
          visible={devModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setDevModalVisible(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Error Details</Text>
              <Pressable
                onPress={() => setDevModalVisible(false)}
                style={({ pressed }) => [styles.closeButton, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
              showsVerticalScrollIndicator
            >
              <View style={styles.errorBox}>
                <Text style={[styles.errorText, { fontFamily: monoFont }]} selectable>
                  {`Error: ${error.message}\n\nStack:\n${error.stack ?? '(no stack)'}`}
                </Text>
              </View>
            </ScrollView>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  devButton: {
    position: 'absolute',
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,100,100,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  devButtonText: {
    color: '#f87171',
    fontWeight: '700',
    fontSize: 18,
  },
  content: {
    alignItems: 'center',
    gap: 12,
    maxWidth: 320,
    width: '100%',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    backgroundColor: 'rgba(196,90,74,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconText: {
    fontSize: 24,
  },
  title: {
    color: '#E8EAF0',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  appName: {
    color: 'rgba(232,234,240,0.5)',
    fontSize: 13,
    textAlign: 'center',
  },
  message: {
    color: 'rgba(232,234,240,0.5)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  primaryButton: {
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 10,
    minWidth: 160,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#E8EAF0',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  secondaryButtonText: {
    color: 'rgba(232,234,240,0.4)',
    fontSize: 13,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232,234,240,0.08)',
  },
  modalTitle: {
    color: '#E8EAF0',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: 'rgba(232,234,240,0.5)',
    fontSize: 18,
  },
  modalScroll: {
    flex: 1,
  },
  errorBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    padding: 16,
  },
  errorText: {
    color: 'rgba(232,234,240,0.6)',
    fontSize: 11,
    lineHeight: 17,
  },
});
