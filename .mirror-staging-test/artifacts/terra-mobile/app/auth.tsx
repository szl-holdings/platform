import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AUTH_TOKEN_KEY, useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

import * as SecureStore from "expo-secure-store";

async function restoreTokenBiometric(): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof window !== "undefined"
      ? window.localStorage.getItem(AUTH_TOKEN_KEY)
      : null;
  }
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    if (Platform.OS !== "web") {
      LocalAuthentication.hasHardwareAsync().then((has) => {
        if (has) {
          LocalAuthentication.isEnrolledAsync().then(async (enrolled) => {
            if (enrolled) {
              const existing = await restoreTokenBiometric();
              setHasBiometrics(enrolled && !!existing);
            }
          });
        }
      });
    }
  }, []);

  const handleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSigningIn(true);
    try {
      await login();
    } finally {
      setSigningIn(false);
    }
  };

  const handleBiometricAuth = async () => {
    if (Platform.OS === "web") return;
    setBiometricLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Access Terra",
        fallbackLabel: "Use passcode",
      });
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      }
    } catch (err) {
      console.log("[Auth] Biometric auth error:", err);
    } finally {
      setBiometricLoading(false);
    }
  };

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(200,169,106,0.04)", "transparent", "transparent"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />

      <View
        style={[
          styles.content,
          { paddingTop: topInset + 40, paddingBottom: bottomInset + 24 },
        ]}
      >
        <Animated.View
          style={[
            styles.logoSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: logoScale }],
            },
          ]}
        >
          <View
            style={[styles.monogram, { borderColor: colors.goldBorder }]}
          >
            <Text style={[styles.monogramText, { color: colors.gold }]}>
              T
            </Text>
          </View>
          <Text style={[styles.brandName, { color: colors.cream }]}>
            Terra
          </Text>
          <Text style={[styles.brandSub, { color: colors.goldSubtle }]}>
            PRIVATE CLIENT PORTAL
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.formSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={[styles.heading, { color: colors.creamDim }]}>
            Strictly private access for{"\n"}registered clients.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: colors.gold,
                opacity: pressed || signingIn ? 0.85 : 1,
              },
            ]}
            onPress={handleSignIn}
            disabled={signingIn}
          >
            {signingIn ? (
              <ActivityIndicator color={colors.inkDeep} size="small" />
            ) : (
              <Text
                style={[styles.primaryButtonText, { color: colors.inkDeep }]}
              >
                SIGN IN SECURELY
              </Text>
            )}
          </Pressable>

          {hasBiometrics && (
            <Pressable
              style={styles.biometricBtn}
              onPress={handleBiometricAuth}
              disabled={biometricLoading}
            >
              {biometricLoading ? (
                <ActivityIndicator size="small" color={colors.goldSubtle} />
              ) : (
                <>
                  <Feather name="smartphone" size={16} color={colors.goldSubtle} />
                  <Text style={[styles.biometricText, { color: colors.goldSubtle }]}>
                    Continue with Face ID / Touch ID
                  </Text>
                </>
              )}
            </Pressable>
          )}

          <View style={styles.privacyRow}>
            <Feather name="lock" size={10} color={colors.creamDim} />
            <Text style={[styles.privacyText, { color: colors.creamDim }]}>
              Strictly private. Your information is never shared.
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "space-between",
  },
  logoSection: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 32,
  },
  monogram: {
    width: 72,
    height: 72,
    borderRadius: 0,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  monogramText: {
    fontSize: 24,
    fontFamily: "Inter_500Medium",
    letterSpacing: 4,
  },
  brandName: {
    fontSize: 24,
    fontFamily: "Inter_400Regular",
    letterSpacing: 2,
    marginBottom: 6,
  },
  brandSub: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 4,
  },
  formSection: {
    paddingBottom: 8,
  },
  heading: {
    fontSize: 14,
    fontFamily: "Inter_300Light",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 28,
    letterSpacing: 0.3,
  },
  primaryButton: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 3,
  },
  biometricBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginBottom: 8,
  },
  biometricText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
  },
  privacyText: {
    fontSize: 10,
    fontFamily: "Inter_300Light",
    letterSpacing: 0.3,
  },
});
