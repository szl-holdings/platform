import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useBiometric } from "../context/BiometricContext";

export interface BiometricLockScreenConfig {
  appName: string;
  subtitle?: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor?: string;
  mutedColor?: string;
}

export function BiometricLockScreen({ config }: { config: BiometricLockScreenConfig }) {
  const {
    appName,
    subtitle,
    accentColor,
    backgroundColor,
    foregroundColor = "#ffffff",
    mutedColor = "rgba(255,255,255,0.5)",
  } = config;

  const { unlock } = useBiometric();
  const [unlocking, setUnlocking] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleUnlock = async () => {
    setUnlocking(true);
    setFailed(false);
    const success = await unlock();
    if (!success) {
      setFailed(true);
    }
    setUnlocking(false);
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.inner}>
        <View
          style={[
            styles.iconWrap,
            { borderColor: accentColor + "40", backgroundColor: accentColor + "15" },
          ]}
        >
          <Text style={{ fontSize: 40 }}>🔒</Text>
        </View>

        <Text style={[styles.title, { color: foregroundColor }]}>
          {appName} Locked
        </Text>
        <Text style={[styles.subtitle, { color: mutedColor }]}>
          {subtitle ?? `Authenticate to access ${appName}`}
        </Text>

        {failed && (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: "#ef444420", borderColor: "#ef444440" },
            ]}
          >
            <Text style={[styles.errorText, { color: "#ef4444" }]}>
              Authentication failed — try again
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.unlockBtn,
            { backgroundColor: accentColor, opacity: unlocking ? 0.7 : 1 },
          ]}
          onPress={handleUnlock}
          disabled={unlocking}
          activeOpacity={0.8}
        >
          {unlocking ? (
            <ActivityIndicator color={backgroundColor} size="small" />
          ) : (
            <Text style={[styles.unlockText, { color: backgroundColor }]}>
              Unlock with Biometrics
            </Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.secNoteText, { color: mutedColor }]}>
          {appName}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  inner: {
    width: "100%",
    maxWidth: 380,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: "700", letterSpacing: 2, marginBottom: 8 },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 28,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    width: "100%",
    marginBottom: 16,
  },
  errorText: { fontSize: 12, flex: 1, textAlign: "center" },
  unlockBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    height: 52,
    borderRadius: 12,
    marginBottom: 16,
  },
  unlockText: { fontSize: 15, fontWeight: "600" },
  secNoteText: { fontSize: 11 },
});
