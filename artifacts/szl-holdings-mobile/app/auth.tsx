import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { consumePendingReturnPath, useAuth } from '@/context/AuthContext';
import { useBiometricSignIn } from '@/context/BiometricSignInContext';
import { useColors } from '@/hooks/useColors';

const DEFAULT_POST_LOGIN_HREF = '/(shell)';

function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return '';
}

export default function AuthScreen() {
  const {
    isAuthenticated,
    isLoading,
    login,
    loginWithTokens,
    sessionRevocation,
    dismissSessionRevocation,
  } = useAuth();
  const { status: biometricStatus, isAvailable, signIn: biometricSignIn } = useBiometricSignIn();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);

  const postLoginHrefRef = useRef<string | null>(null);
  if (isAuthenticated && postLoginHrefRef.current === null) {
    postLoginHrefRef.current = consumePendingReturnPath() ?? DEFAULT_POST_LOGIN_HREF;
  }

  if (isAuthenticated) {
    return <Redirect href={(postLoginHrefRef.current ?? DEFAULT_POST_LOGIN_HREF) as any} />;
  }

  const handleBiometricSignIn = useCallback(async () => {
    setBiometricLoading(true);
    setBiometricError(null);
    try {
      const result = await biometricSignIn(getApiBaseUrl());
      if (!result) {
        setBiometricError('Biometric sign-in failed. Please sign in with your account.');
        return;
      }
      await loginWithTokens({
        token: result.token,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresAt,
        refreshTokenExpiresAt: result.refreshTokenExpiresAt,
      });
    } catch {
      setBiometricError('Something went wrong. Please sign in with your account.');
    } finally {
      setBiometricLoading(false);
    }
  }, [biometricSignIn, loginWithTokens]);

  const showBiometricOption = biometricStatus.isEnrolled && isAvailable;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(201,168,76,0.08)', 'transparent']}
        style={[styles.gradient, { height: 300 }]}
      />

      <View
        style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}
      >
        <View style={styles.brand}>
          <View style={styles.logoMark}>
            <Text style={[styles.logoText, { color: colors.gold }]}>SZL</Text>
          </View>
          <Text style={[styles.companyName, { color: colors.cream }]}>SZL Holdings</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Mobile Command · SZL Platform
          </Text>
        </View>

        <View style={styles.divider} />

        {sessionRevocation ? (
          <View
            style={[
              styles.revocationNotice,
              { backgroundColor: 'rgba(201,168,76,0.08)', borderColor: colors.goldBorder },
            ]}
            accessibilityRole="alert"
          >
            <Text style={[styles.revocationLabel, { color: colors.gold }]}>Session ended</Text>
            <Text style={[styles.revocationMessage, { color: colors.cream }]}>
              {sessionRevocation.message}
            </Text>
            <Pressable
              onPress={dismissSessionRevocation}
              accessibilityRole="button"
              hitSlop={8}
              style={styles.revocationDismiss}
            >
              <Text style={[styles.revocationDismissText, { color: colors.mutedForeground }]}>
                Dismiss
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.features}>
          {[
            'Unified signals across all domain packs',
            'Governed approvals — confirm from anywhere',
            'Counsel workflow orchestration',
            'Full audit trail — every action attributed',
          ].map((f) => (
            <View key={f} style={styles.featureRow}>
              <View style={[styles.featureDot, { backgroundColor: colors.gold }]} />
              <Text style={[styles.featureText, { color: colors.creamDim }]}>{f}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          {biometricError ? (
            <View
              style={[
                styles.errorBanner,
                {
                  borderColor: 'rgba(239,68,68,0.3)',
                  backgroundColor: 'rgba(239,68,68,0.08)',
                },
              ]}
            >
              <Feather name="alert-circle" size={13} color="#ef4444" />
              <Text style={styles.errorText}>{biometricError}</Text>
            </View>
          ) : null}

          {isLoading || biometricLoading ? (
            <ActivityIndicator color={colors.gold} />
          ) : (
            <>
              {showBiometricOption && (
                <Pressable
                  onPress={handleBiometricSignIn}
                  style={({ pressed }) => [
                    styles.biometricBtn,
                    {
                      backgroundColor: pressed
                        ? 'rgba(201,168,76,0.2)'
                        : 'rgba(201,168,76,0.12)',
                      borderColor: colors.goldBorder,
                    },
                  ]}
                  accessibilityLabel="Sign in with Face ID or Touch ID"
                  accessibilityRole="button"
                >
                  <Feather name="unlock" size={16} color={colors.gold} />
                  <Text style={[styles.biometricBtnText, { color: colors.gold }]}>
                    Sign In with Face ID / Touch ID
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={login}
                style={({ pressed }) => [
                  styles.loginBtn,
                  {
                    backgroundColor: pressed
                      ? 'rgba(201,168,76,0.15)'
                      : 'rgba(201,168,76,0.1)',
                    borderColor: colors.goldBorder,
                  },
                ]}
                accessibilityRole="button"
              >
                <Text style={[styles.loginBtnText, { color: colors.gold }]}>
                  {showBiometricOption ? 'Sign In with Account' : 'Sign In'}
                </Text>
              </Pressable>
            </>
          )}
          <Text style={[styles.disclaimer, { color: 'rgba(240,238,255,0.2)' }]}>
            Restricted access · SZL Holdings principals only
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  brand: {
    alignItems: 'center',
    gap: 12,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 3,
  },
  companyName: {
    fontSize: 28,
    fontFamily: 'Inter_300Light',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(201,168,76,0.1)',
    marginVertical: 8,
  },
  features: {
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter_300Light',
    letterSpacing: 0.2,
  },
  footer: {
    gap: 12,
    alignItems: 'center',
  },
  biometricBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  biometricBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
  },
  loginBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  loginBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  disclaimer: {
    fontSize: 11,
    fontFamily: 'Inter_300Light',
    textAlign: 'center',
  },
  revocationNotice: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  revocationLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  revocationMessage: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
  },
  revocationDismiss: {
    alignSelf: 'flex-end',
    paddingTop: 4,
  },
  revocationDismissText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#ef4444',
    flex: 1,
    lineHeight: 16,
  },
});
