import { Ionicons } from '@expo/vector-icons';
import { NotificationHub, useBiometric, useTheme } from '@szl-holdings/mobile-shared';
import * as Haptics from 'expo-haptics';
import { type Href, router } from 'expo-router';
import { type ComponentProps, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { giColors } from '@/lib/gi-bridge';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { isEnabled, isAvailable, enableBiometric, disableBiometric } = useBiometric();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { mode, toggle } = useTheme();
  const themeLabel = mode === 'dark' ? 'Dark' : mode === 'light' ? 'Light' : 'System';

  const handleToggleBiometric = async (value: boolean) => {
    if (value) {
      const ok = await enableBiometric();
      if (!ok) {
        Alert.alert('Authentication failed', 'Biometric lock was not enabled.');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      Alert.alert(
        'Disable Biometric Lock',
        'Are you sure? The app will no longer require authentication on resume.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              await disableBiometric();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
          },
        ],
      );
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Aegis?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
        },
      },
    ]);
  };

  const topInsets = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomInsets = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomInsets + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: topInsets + 16,
            borderBottomColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            { color: colors.foreground, fontFamily: 'SpaceGrotesk_700Bold' },
          ]}
        >
          Profile
        </Text>
        <NotificationHub
          fetchers={[
            {
              domain: 'aegis',
              label: 'Aegis',
              color: colors.amber,
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
              color: giColors.accent.teal,
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
            {
              domain: 'vessels',
              label: 'SEXTANT',
              color: giColors.accent.teal,
              fetch: async () => {
                try {
                  const base = process.env.EXPO_PUBLIC_DOMAIN
                    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
                    : '';
                  const res = await fetch(`${base}/api/vessels/notifications`);
                  if (!res.ok) return [];
                  return res.json();
                } catch {
                  return [];
                }
              },
            },
          ]}
          accentColor={colors.amber}
          backgroundColor={colors.background}
          surfaceColor={colors.navyLight}
          textColor={colors.foreground}
          dimColor={colors.mutedForeground}
          borderColor={colors.border}
          onDeepLink={(link) => router.push(link as Href)}
        />
      </View>

      <View style={styles.avatarSection}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.amberDim, borderColor: colors.amberBorder },
          ]}
        >
          <Text
            style={[styles.avatarText, { color: colors.amber, fontFamily: 'SpaceGrotesk_700Bold' }]}
          >
            {initials}
          </Text>
        </View>
        <Text
          style={[
            styles.userName,
            { color: colors.foreground, fontFamily: 'SpaceGrotesk_600SemiBold' },
          ]}
        >
          {user?.displayName ?? 'Analyst'}
        </Text>
        <Text
          style={[
            styles.userEmail,
            { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
          ]}
        >
          {user?.email ?? '—'}
        </Text>
        <View
          style={[
            styles.roleBadge,
            { backgroundColor: colors.amberDim, borderColor: colors.amberBorder },
          ]}
        >
          <Ionicons name="shield-checkmark" size={12} color={colors.amber} />
          <Text style={[styles.roleText, { color: colors.amber, fontFamily: 'Inter_500Medium' }]}>
            SOC Analyst
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text
          style={[
            styles.sectionLabel,
            { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' },
          ]}
        >
          SECURITY
        </Text>

        {(isAvailable || Platform.OS === 'web') && (
          <View
            style={[
              styles.settingRow,
              { backgroundColor: colors.navyLight, borderColor: colors.border },
            ]}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.amberDim }]}>
                <Ionicons name="finger-print" size={18} color={colors.amber} />
              </View>
              <View>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: colors.foreground, fontFamily: 'Inter_500Medium' },
                  ]}
                >
                  Biometric Lock
                </Text>
                <Text
                  style={[
                    styles.settingDesc,
                    { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
                  ]}
                >
                  {isEnabled
                    ? 'App locks after 5 min background'
                    : 'Face ID / Fingerprint on resume'}
                </Text>
              </View>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={handleToggleBiometric}
              trackColor={{ false: colors.border, true: colors.amberBorder }}
              thumbColor={isEnabled ? colors.amber : colors.mutedForeground}
            />
          </View>
        )}

        <View
          style={[
            styles.settingRow,
            { backgroundColor: colors.navyLight, borderColor: colors.border },
          ]}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: colors.blueDim }]}>
              <Ionicons name="notifications" size={18} color={colors.blue} />
            </View>
            <View>
              <Text
                style={[
                  styles.settingTitle,
                  { color: colors.foreground, fontFamily: 'Inter_500Medium' },
                ]}
              >
                Push Notifications
              </Text>
              <Text
                style={[
                  styles.settingDesc,
                  { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
                ]}
              >
                Critical & high incidents
              </Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={(v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setNotificationsEnabled(v);
            }}
            trackColor={{ false: colors.border, true: 'rgba(59,130,246,0.3)' }}
            thumbColor={notificationsEnabled ? colors.blue : colors.mutedForeground}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text
          style={[
            styles.sectionLabel,
            { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' },
          ]}
        >
          DISPLAY
        </Text>
        <TouchableOpacity
          style={[
            styles.settingRow,
            { backgroundColor: colors.navyLight, borderColor: colors.border },
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            toggle();
          }}
          activeOpacity={0.7}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: colors.blueDim }]}>
              <Ionicons name="moon" size={18} color={colors.blue} />
            </View>
            <View>
              <Text
                style={[
                  styles.settingTitle,
                  { color: colors.foreground, fontFamily: 'Inter_500Medium' },
                ]}
              >
                Display Theme
              </Text>
              <Text
                style={[
                  styles.settingDesc,
                  { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
                ]}
              >
                {themeLabel} · Tap to cycle
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text
          style={[
            styles.sectionLabel,
            { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' },
          ]}
        >
          SOC STATUS
        </Text>

        {(
          [
            {
              icon: 'shield-checkmark',
              label: 'Aegis Platform',
              value: 'Connected',
              color: colors.emerald,
            },
            { icon: 'wifi', label: 'WebSocket Feed', value: 'Active', color: colors.emerald },
            { icon: 'server', label: 'API Server', value: 'Online', color: colors.emerald },
          ] as Array<{
            icon: ComponentProps<typeof Ionicons>['name'];
            label: string;
            value: string;
            color: string;
          }>
        ).map((item) => (
          <View
            key={item.label}
            style={[
              styles.statusRow,
              { backgroundColor: colors.navyLight, borderColor: colors.border },
            ]}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.emeraldDim }]}>
                <Ionicons name={item.icon} size={18} color={colors.emerald} />
              </View>
              <Text
                style={[
                  styles.settingTitle,
                  { color: colors.foreground, fontFamily: 'Inter_500Medium' },
                ]}
              >
                {item.label}
              </Text>
            </View>
            <View style={[styles.valueChip, { backgroundColor: colors.emeraldDim }]}>
              <Text
                style={[styles.valueText, { color: colors.emerald, fontFamily: 'Inter_500Medium' }]}
              >
                {item.value}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text
          style={[
            styles.sectionLabel,
            { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' },
          ]}
        >
          ABOUT
        </Text>
        <View
          style={[
            styles.aboutCard,
            { backgroundColor: colors.navyLight, borderColor: colors.border },
          ]}
        >
          <View style={styles.aboutRow}>
            <Text
              style={[
                styles.aboutKey,
                { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
              ]}
            >
              App
            </Text>
            <Text
              style={[
                styles.aboutValue,
                { color: colors.foreground, fontFamily: 'Inter_500Medium' },
              ]}
            >
              Aegis Mobile v1.0
            </Text>
          </View>
          <View style={styles.aboutRow}>
            <Text
              style={[
                styles.aboutKey,
                { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
              ]}
            >
              Platform
            </Text>
            <Text
              style={[
                styles.aboutValue,
                { color: colors.foreground, fontFamily: 'Inter_500Medium' },
              ]}
            >
              {Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web'}
            </Text>
          </View>
          <View style={styles.aboutRow}>
            <Text
              style={[
                styles.aboutKey,
                { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
              ]}
            >
              Backend
            </Text>
            <Text
              style={[
                styles.aboutValue,
                { color: colors.foreground, fontFamily: 'Inter_500Medium' },
              ]}
            >
              Aegis API
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.logoutSection, { paddingBottom: 16 }]}>
        <TouchableOpacity
          style={[
            styles.logoutBtn,
            { backgroundColor: colors.redDim, borderColor: colors.redBorder },
          ]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.red} />
          <Text style={[styles.logoutText, { color: colors.red, fontFamily: 'Inter_600SemiBold' }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22 },
  avatarSection: { alignItems: 'center', paddingVertical: 32 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28 },
  userName: { fontSize: 20, marginBottom: 4 },
  userEmail: { fontSize: 13, marginBottom: 12 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleText: { fontSize: 11 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionLabel: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: { fontSize: 14 },
  settingDesc: { fontSize: 11, marginTop: 1 },
  valueChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  valueText: { fontSize: 11 },
  aboutCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(232,234,240,0.08)',
  },
  aboutKey: { fontSize: 13 },
  aboutValue: { fontSize: 13 },
  logoutSection: { paddingHorizontal: 20 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutText: { fontSize: 15 },
});
