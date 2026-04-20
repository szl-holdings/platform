import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

export interface EcosystemTabBarConfig {
  accentColor: string;
  inactiveColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  blurIntensity?: number;
}

export function useEcosystemTabBarScreenOptions({
  accentColor,
  inactiveColor = 'rgba(255,255,255,0.22)',
  backgroundColor,
  borderColor,
  blurIntensity = 85,
}: EcosystemTabBarConfig) {
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  const derivedBg = backgroundColor ?? (isIOS ? 'transparent' : '#080c14');
  const derivedBorder = borderColor ?? `${accentColor}15`;

  return {
    headerShown: false,
    tabBarActiveTintColor: accentColor,
    tabBarInactiveTintColor: inactiveColor,
    tabBarStyle: {
      position: 'absolute' as const,
      backgroundColor: derivedBg,
      borderTopWidth: 1,
      borderTopColor: derivedBorder,
      elevation: 0,
      ...(isWeb ? { height: 84 } : {}),
    },
    tabBarBackground: () =>
      isIOS ? (
        <BlurView intensity={blurIntensity} tint="dark" style={StyleSheet.absoluteFill} />
      ) : isWeb ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: derivedBg }]} />
      ) : null,
    tabBarLabelStyle: {
      fontSize: 9,
      fontFamily: 'Inter_500Medium',
      letterSpacing: 1,
      textTransform: 'uppercase' as const,
    },
  };
}

export interface EcosystemTabBarBackgroundProps {
  accentColor: string;
  blurIntensity?: number;
  backgroundColor?: string;
}

export function EcosystemTabBarBackground({
  accentColor: _accentColor,
  blurIntensity = 85,
  backgroundColor = '#080c14',
}: EcosystemTabBarBackgroundProps) {
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  if (isIOS) {
    return <BlurView intensity={blurIntensity} tint="dark" style={StyleSheet.absoluteFill} />;
  }
  if (isWeb) {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor }]} />;
  }
  return null;
}
