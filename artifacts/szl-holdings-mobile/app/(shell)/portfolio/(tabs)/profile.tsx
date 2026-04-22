import { Feather } from '@expo/vector-icons';
import { NotificationHub, useTheme } from '@szl-holdings/mobile-shared';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useBiometricLock } from '@/context/BiometricLockContext';
import { useColors } from '@/hooks/useColors';
import {
  registerForPushNotificationsAsync,
  usePushNotifications,
} from '@/hooks/usePushNotifications';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

const COMPLIANCE_FRAMEWORKS: Array<{
  name: string;
  status: string;
  scope: string;
  expiry: string;
  icon: FeatherIconName;
  color: string;
}> = [
  {
    name: 'ISO 27001',
    status: 'certified',
    scope: 'Information Security Management',
    expiry: 'Dec 2026',
    icon: 'shield',
    color: '#10b981',
  },
  {
    name: 'SOC 2 Type II',
    status: 'certified',
    scope: 'Security, Availability, Confidentiality',
    expiry: 'Mar 2027',
    icon: 'check-circle',
    color: '#10b981',
  },
  {
    name: 'GDPR',
    status: 'compliant',
    scope: 'EU Data Protection',
    expiry: 'Ongoing',
    icon: 'flag',
    color: '#3b82f6',
  },
  {
    name: 'FedRAMP',
    status: 'in-progress',
    scope: 'US Federal Cloud',
    expiry: 'Q3 2026',
    icon: 'clock',
    color: '#f59e0b',
  },
  {
    name: 'ITAR',
    status: 'compliant',
    scope: 'Defense Technology Controls',
    expiry: 'Ongoing',
    icon: 'lock',
    color: '#6366f1',
  },
];

const CERTIFICATIONS: Array<{
  name: string;
  date: string;
  icon: FeatherIconName;
  color: string;
}> = [
  { name: 'Pentest by Cobalt Strike', date: 'Jan 2026', icon: 'target', color: '#ef4444' },
  { name: 'AWS Security Partner Certified', date: 'Nov 2025', icon: 'cloud', color: '#f59e0b' },
  { name: 'Zero Trust Architecture', date: 'Sep 2025', icon: 'zap', color: '#8b5cf6' },
  { name: 'DISA STIGs Applied', date: 'Dec 2025', icon: 'lock', color: '#6366f1' },
];

function ComplianceCard({ framework }: { framework: (typeof COMPLIANCE_FRAMEWORKS)[0] }) {
  const colors = useColors();
  const isInProgress = framework.status === 'in-progress';

  return (
    <View
      style={[
        styles.complianceCard,
        {
          backgroundColor: colors.card,
          borderColor: isInProgress ? 'rgba(245,158,11,0.15)' : `${framework.color}15`,
        },
      ]}
    >
      <View style={[styles.complianceIcon, { backgroundColor: `${framework.color}15` }]}>
        <Feather name={framework.icon} size={14} color={framework.color} />
      </View>
      <View style={styles.complianceContent}>
        <View style={styles.complianceTop}>
          <Text style={[styles.complianceName, { color: colors.cream }]}>{framework.name}</Text>
          <View
            style={[
              styles.complianceBadge,
              {
                backgroundColor: isInProgress ? 'rgba(245,158,11,0.1)' : `${framework.color}10`,
              },
            ]}
          >
            <Text
              style={[
                styles.complianceBadgeText,
                { color: isInProgress ? '#f59e0b' : framework.color },
              ]}
            >
              {framework.status === 'certified'
                ? 'CERTIFIED'
                : framework.status === 'compliant'
                  ? 'COMPLIANT'
                  : 'IN PROGRESS'}
            </Text>
          </View>
        </View>
        <Text style={[styles.complianceScope, { color: colors.mutedForeground }]}>
          {framework.scope}
        </Text>
        <Text style={[styles.complianceExpiry, { color: colors.mutedForeground }]}>
          Valid through: {framework.expiry}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { biometricEnabled, setBiometricPreference } = useBiometricLock();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const { mode, toggle } = useTheme();
  const themeLabel = mode === 'dark' ? 'Dark' : mode === 'light' ? 'Light' : 'System';

  usePushNotifications(notificationsEnabled);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 + 84 : 90;

  const handleToggleBiometric = useCallback(
    async (value: boolean) => {
      try {
        await setBiometricPreference(value);
        if (value) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (msg === 'biometric_unavailable') {
          Alert.alert(
            'Biometric Unavailable',
            'This device does not have biometric authentication configured.',
            [{ text: 'OK' }],
          );
        }
      }
    },
    [setBiometricPreference],
  );

  const handleToggleNotifications = useCallback(async (value: boolean) => {
    Haptics.selectionAsync();
    if (value) {
      const token = await registerForPushNotificationsAsync();
      if (!token && Platform.OS !== 'web') {
        Alert.alert(
          'Permission Required',
          'Enable notifications in your device settings to receive push alerts from SZL Holdings.',
          [{ text: 'OK' }],
        );
        return;
      }
    }
    setNotificationsEnabled(value);
  }, []);

  const handleLogout = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Sign Out', 'Are you sure you want to sign out of SZL Holdings?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  }, [logout]);

  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'SZ';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(201,168,76,0.06)', 'transparent']}
        style={[styles.headerGradient, { height: topPad + 160 }]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPad + 16, paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <Text style={[styles.eyebrow, { color: colors.goldSubtle }]}>
              PROFILE & TRUST CENTER
            </Text>
            <NotificationHub
              fetchers={[
                {
                  domain: 'szl',
                  label: 'SZL',
                  color: colors.gold,
                  fetch: async () => {
                    try {
                      const base = process.env.EXPO_PUBLIC_DOMAIN
                        ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
                        : '';
                      const res = await fetch(`${base}/api/holdings/notifications`);
                      if (!res.ok) return [];
                      return res.json();
                    } catch {
                      return [];
                    }
                  },
                },
                {
                  domain: 'aegis',
                  label: 'PARAGON',
                  color: '#f59e0b',
                  fetch: async () => {
                    try {
                      const base = process.env.EXPO_PUBLIC_DOMAIN
                        ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
                        : '';
                      const res = await fetch(`${base}/api/aegis/notifications`);
                      if (!res.ok) return [];
                      return res.json();
                    } catch {
                      return [];
                    }
                  },
                },
                {
                  domain: 'lyte',
                  label: 'KORA',
                  color: '#00d4ff',
                  fetch: async () => {
                    try {
                      const base = process.env.EXPO_PUBLIC_DOMAIN
                        ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
                        : '';
                      const res = await fetch(`${base}/api/lyte/notifications`);
                      if (!res.ok) return [];
                      return res.json();
                    } catch {
                      return [];
                    }
                  },
                },
              ]}
              accentColor={colors.gold}
              backgroundColor={colors.background}
              surfaceColor={colors.surface}
              textColor={colors.cream}
              dimColor={colors.mutedForeground}
              borderColor={colors.borderSubtle}
              onDeepLink={(link) => router.push(link as Href)}
            />
          </View>

          <View style={styles.userCard}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.goldDim, borderColor: colors.goldBorder },
              ]}
            >
              <Text style={[styles.avatarText, { color: colors.gold }]}>{initials}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.cream }]}>
                {user?.displayName ?? 'Executive Principal'}
              </Text>
              <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
                {user?.email ?? 'Connected via Replit Auth'}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { borderTopColor: colors.borderSubtle }]}>
          <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>
            SECURITY PREFERENCES
          </Text>
          <View style={[styles.settingsList, { borderColor: colors.borderSubtle }]}>
            <View style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}>
              <View style={[styles.settingIcon, { backgroundColor: 'rgba(201,168,76,0.08)' }]}>
                <Feather name="eye" size={14} color={colors.gold} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.cream }]}>Biometric Lock</Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>
                  Require Face ID / Fingerprint on app resume
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleToggleBiometric}
                trackColor={{
                  false: 'rgba(240,238,255,0.1)',
                  true: 'rgba(201,168,76,0.4)',
                }}
                thumbColor={biometricEnabled ? colors.gold : 'rgba(240,238,255,0.4)'}
              />
            </View>
            <View style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}>
              <View style={[styles.settingIcon, { backgroundColor: 'rgba(59,130,246,0.08)' }]}>
                <Feather name="bell" size={14} color="#3b82f6" />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.cream }]}>
                  Push Notifications
                </Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>
                  Workflow updates and platform events
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{
                  false: 'rgba(240,238,255,0.1)',
                  true: 'rgba(59,130,246,0.4)',
                }}
                thumbColor={notificationsEnabled ? '#3b82f6' : 'rgba(240,238,255,0.4)'}
              />
            </View>
            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.settingIcon, { backgroundColor: 'rgba(239,68,68,0.08)' }]}>
                <Feather name="alert-triangle" size={14} color="#ef4444" />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.cream }]}>Critical Alerts</Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>
                  Platform degradation & incident notifications
                </Text>
              </View>
              <Switch
                value={alertsEnabled}
                onValueChange={(v) => {
                  Haptics.selectionAsync();
                  setAlertsEnabled(v);
                }}
                trackColor={{
                  false: 'rgba(240,238,255,0.1)',
                  true: 'rgba(239,68,68,0.4)',
                }}
                thumbColor={alertsEnabled ? '#ef4444' : 'rgba(240,238,255,0.4)'}
              />
            </View>
            <Pressable
              style={[styles.settingRow, { borderBottomWidth: 0 }]}
              onPress={() => {
                Haptics.selectionAsync();
                toggle();
              }}
            >
              <View style={[styles.settingIcon, { backgroundColor: 'rgba(201,168,76,0.08)' }]}>
                <Feather name="moon" size={14} color={colors.gold} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.cream }]}>Display Theme</Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>
                  {themeLabel} · Tap to cycle
                </Text>
              </View>
              <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.section, { borderTopColor: colors.borderSubtle }]}>
          <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>
            COMPLIANCE FRAMEWORKS
          </Text>
          <View style={{ gap: 8 }}>
            {COMPLIANCE_FRAMEWORKS.map((f) => (
              <ComplianceCard key={f.name} framework={f} />
            ))}
          </View>
        </View>

        <View style={[styles.section, { borderTopColor: colors.borderSubtle }]}>
          <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>CERTIFICATIONS</Text>
          <View style={[styles.certList, { borderColor: colors.borderSubtle }]}>
            {CERTIFICATIONS.map((cert, i) => (
              <View
                key={cert.name}
                style={[
                  styles.certRow,
                  {
                    borderBottomColor: colors.borderSubtle,
                    borderBottomWidth: i < CERTIFICATIONS.length - 1 ? 1 : 0,
                  },
                ]}
              >
                <View style={[styles.certIcon, { backgroundColor: `${cert.color}12` }]}>
                  <Feather name={cert.icon} size={12} color={cert.color} />
                </View>
                <Text style={[styles.certName, { color: colors.cream }]}>{cert.name}</Text>
                <Text style={[styles.certDate, { color: colors.mutedForeground }]}>
                  {cert.date}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footerActions}>
          <Pressable
            style={[styles.logoutBtn, { borderColor: 'rgba(239,68,68,0.2)' }]}
            onPress={handleLogout}
          >
            <Feather name="log-out" size={15} color="#ef4444" />
            <Text style={[styles.logoutBtnText, { color: '#ef4444' }]}>Sign Out</Text>
          </Pressable>
          <Text style={[styles.versionText, { color: colors.mutedForeground }]}>
            SZL Holdings v1.0.0 · Build 2026.04.01
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: { marginBottom: 20 },
  eyebrow: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 3,
    marginBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 1,
  },
  userInfo: { flex: 1, gap: 3 },
  userName: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  userEmail: {
    fontSize: 12,
    fontFamily: 'Inter_300Light',
  },
  section: {
    borderTopWidth: 1,
    paddingTop: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 3,
    marginBottom: 14,
  },
  settingsList: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  settingIcon: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: { flex: 1, gap: 2 },
  settingLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  settingDesc: {
    fontSize: 10,
    fontFamily: 'Inter_300Light',
  },
  complianceCard: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  complianceIcon: {
    width: 32,
    height: 32,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  complianceContent: { flex: 1, gap: 4 },
  complianceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  complianceName: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  complianceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  complianceBadgeText: {
    fontSize: 8,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  complianceScope: {
    fontSize: 11,
    fontFamily: 'Inter_300Light',
  },
  complianceExpiry: {
    fontSize: 10,
    fontFamily: 'Inter_300Light',
  },
  certList: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  certIcon: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certName: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_300Light',
  },
  certDate: {
    fontSize: 10,
    fontFamily: 'Inter_300Light',
  },
  footerActions: {
    gap: 14,
    alignItems: 'center',
  },
  logoutBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  logoutBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  versionText: {
    fontSize: 10,
    fontFamily: 'Inter_300Light',
  },
});
