import { Feather } from '@expo/vector-icons';
import { NotificationHub, useTheme } from '@szl-holdings/mobile-shared';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, router } from 'expo-router';
import React, { type ComponentProps, useCallback, useMemo } from 'react';
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
import { LYTE_COLORS } from '@/constants/colors';
import { useLyte } from '@/context/LyteContext';
import { useNotifications } from '@/context/LyteNotificationContext';
import { useColors } from '@/hooks/useColors';

type FeatherName = ComponentProps<typeof Feather>['name'];

interface SettingRow {
  icon: FeatherName;
  label: string;
  value?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  color?: string;
}

type StylesType = ReturnType<typeof makeStyles>;

function SettingItem({
  item,
  styles,
  colors,
}: {
  item: SettingRow;
  styles: StylesType;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        item.onPress?.();
      }}
      style={({ pressed }) => [styles.settingRow, { opacity: pressed && !item.toggle ? 0.7 : 1 }]}
    >
      <View
        style={[
          styles.settingIcon,
          { backgroundColor: `${item.color ?? LYTE_COLORS.electricBlue}15` },
        ]}
      >
        <Feather name={item.icon} size={15} color={item.color ?? LYTE_COLORS.electricBlue} />
      </View>
      <Text style={styles.settingLabel}>{item.label}</Text>
      {item.toggle !== undefined ? (
        <Switch
          value={item.toggleValue}
          onValueChange={(v) => {
            Haptics.selectionAsync();
            item.onToggle?.(v);
          }}
          trackColor={{ false: colors.surfaceElevated, true: `${LYTE_COLORS.electricBlue}60` }}
          thumbColor={item.toggleValue ? LYTE_COLORS.electricBlue : colors.textTertiary}
        />
      ) : item.value ? (
        <Text style={styles.settingValue}>{item.value}</Text>
      ) : (
        <Feather name="chevron-right" size={14} color={colors.textTertiary} />
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { signals, actions, criticalCount } = useLyte();
  const { permissionGranted, requestPermission, preferences, setPreferences } = useNotifications();
  const { mode, toggle } = useTheme();

  const themeLabel = mode === 'dark' ? 'Dark' : mode === 'light' ? 'Light' : 'System';

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 + 84 : 90;

  const handleEnableNotifications = useCallback(async () => {
    if (!permissionGranted) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Notifications Disabled',
          'Enable notifications in your device settings to receive on-call alerts.',
          [{ text: 'OK' }],
        );
      }
    }
  }, [permissionGranted, requestPermission]);

  const notificationSettings: SettingRow[] = [
    {
      icon: 'bell',
      label: 'Push Notifications',
      toggle: true,
      toggleValue: permissionGranted && preferences.enabled,
      color: LYTE_COLORS.electricBlue,
      onToggle: async (v) => {
        if (v && !permissionGranted) {
          await handleEnableNotifications();
        }
        setPreferences((p) => ({ ...p, enabled: v }));
      },
    },
    {
      icon: 'alert-octagon',
      label: 'Critical Alerts',
      toggle: true,
      toggleValue: preferences.critical,
      color: LYTE_COLORS.critical,
      onToggle: (v) => setPreferences((p) => ({ ...p, critical: v })),
    },
    {
      icon: 'alert-triangle',
      label: 'High Severity Alerts',
      toggle: true,
      toggleValue: preferences.high,
      color: LYTE_COLORS.high,
      onToggle: (v) => setPreferences((p) => ({ ...p, high: v })),
    },
    {
      icon: 'minus-circle',
      label: 'Medium Severity Alerts',
      toggle: true,
      toggleValue: preferences.medium,
      color: LYTE_COLORS.medium,
      onToggle: (v) => setPreferences((p) => ({ ...p, medium: v })),
    },
  ];

  const displaySettings: SettingRow[] = [
    {
      icon: 'refresh-cw',
      label: 'Refresh Interval',
      value: '30s',
      color: LYTE_COLORS.neonGreen,
    },
    {
      icon: 'wifi',
      label: 'Real-time WebSocket',
      toggle: true,
      toggleValue: true,
      color: LYTE_COLORS.neonGreen,
      onToggle: () => {},
    },
    {
      icon: 'moon',
      label: 'Display Theme',
      value: themeLabel,
      color: LYTE_COLORS.electricBlue,
      onPress: toggle,
    },
  ];

  const accountSettings: SettingRow[] = [
    {
      icon: 'user',
      label: 'Display Name',
      value: 'On-Call Engineer',
      color: colors.textSecondary,
    },
    {
      icon: 'shield',
      label: 'Role',
      value: 'Operator',
      color: colors.textSecondary,
    },
    {
      icon: 'globe',
      label: 'API Environment',
      value: process.env.EXPO_PUBLIC_DOMAIN ? 'Production' : 'Local',
      color: colors.textSecondary,
    },
  ];

  const resolvedCount = signals.filter((s) => s.status === 'resolved').length;
  const ackCount = signals.filter((s) => s.status === 'acknowledged').length;
  const actionsDone = actions.filter((a) => a.state === 'resolved').length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(0,212,255,0.04)', 'transparent']}
        style={[styles.headerGradient, { height: topPad + 160 }]}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: topPad + 16,
          paddingBottom: bottomPad,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          <View>
            <Text style={styles.eyebrow}>PROFILE</Text>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>
          <NotificationHub
            fetchers={[
              {
                domain: 'lyte',
                label: 'KORA',
                color: LYTE_COLORS.electricBlue,
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
                domain: 'vessels',
                label: 'SEXTANT',
                color: '#0ea5e9',
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
            accentColor={LYTE_COLORS.electricBlue}
            backgroundColor={colors.background}
            surfaceColor={colors.surfaceElevated}
            textColor={colors.textPrimary}
            dimColor={colors.textSecondary}
            borderColor="rgba(255,255,255,0.08)"
            onDeepLink={(link) => router.push(link as Href)}
          />
        </View>

        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Feather name="user" size={24} color={LYTE_COLORS.electricBlue} />
          </View>
          <View>
            <Text style={styles.avatarName}>On-Call Engineer</Text>
            <Text style={styles.avatarRole}>Lyte Operations</Text>
            {!permissionGranted && (
              <Pressable style={styles.notifBanner} onPress={handleEnableNotifications}>
                <Feather name="bell-off" size={12} color={LYTE_COLORS.high} />
                <Text style={styles.notifBannerText}>Enable push notifications</Text>
              </Pressable>
            )}
          </View>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: permissionGranted ? LYTE_COLORS.neonGreenDim : LYTE_COLORS.highDim,
                borderColor: permissionGranted ? LYTE_COLORS.neonGreenLight : LYTE_COLORS.highLight,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: permissionGranted ? LYTE_COLORS.neonGreen : LYTE_COLORS.high },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: permissionGranted ? LYTE_COLORS.neonGreen : LYTE_COLORS.high },
              ]}
            >
              {permissionGranted ? 'On-Call' : 'No Notifs'}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: LYTE_COLORS.critical }]}>{criticalCount}</Text>
            <Text style={styles.statLabel}>Critical</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: LYTE_COLORS.neonGreen }]}>
              {resolvedCount}
            </Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: LYTE_COLORS.electricBlue }]}>{ackCount}</Text>
            <Text style={styles.statLabel}>Acked</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: LYTE_COLORS.medium }]}>{actionsDone}</Text>
            <Text style={styles.statLabel}>Actions</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.settingGroup}>
          {notificationSettings.map((item, i) => (
            <View key={item.label}>
              {i > 0 && <View style={styles.divider} />}
              <SettingItem item={item} styles={styles} colors={colors} />
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>DISPLAY</Text>
        <View style={styles.settingGroup}>
          {displaySettings.map((item, i) => (
            <View key={item.label}>
              {i > 0 && <View style={styles.divider} />}
              <SettingItem item={item} styles={styles} colors={colors} />
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.settingGroup}>
          {accountSettings.map((item, i) => (
            <View key={item.label}>
              {i > 0 && <View style={styles.divider} />}
              <SettingItem item={item} styles={styles} colors={colors} />
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Lyte Mobile · v1.0.0</Text>
          <Text style={styles.footerSub}>Business Observability On-Call Companion</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    headerGradient: { position: 'absolute', top: 0, left: 0, right: 0 },
    scroll: { flex: 1 },
    eyebrow: {
      fontSize: 9,
      fontFamily: 'Inter_500Medium',
      letterSpacing: 3,
      color: LYTE_COLORS.electricBlue,
      marginBottom: 4,
    },
    headerTitle: {
      fontSize: 28,
      fontFamily: 'Inter_600SemiBold',
      color: c.textPrimary,
      marginBottom: 20,
    },
    avatarCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      marginBottom: 16,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: LYTE_COLORS.electricBlueDim,
      borderWidth: 1,
      borderColor: LYTE_COLORS.electricBlueLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarName: {
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
      color: c.textPrimary,
      marginBottom: 2,
    },
    avatarRole: { fontSize: 11, fontFamily: 'Inter_400Regular', color: c.textSecondary },
    notifBanner: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    notifBannerText: { fontSize: 10, fontFamily: 'Inter_500Medium', color: LYTE_COLORS.high },
    statusPill: {
      marginLeft: 'auto',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      borderWidth: 1,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
    statsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    statCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      padding: 12,
      alignItems: 'center',
    },
    statValue: { fontSize: 22, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
    statLabel: { fontSize: 9, fontFamily: 'Inter_400Regular', color: c.textTertiary },
    sectionLabel: {
      fontSize: 9,
      fontFamily: 'Inter_500Medium',
      letterSpacing: 3,
      color: c.textTertiary,
      marginBottom: 8,
    },
    settingGroup: {
      backgroundColor: c.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 24,
      overflow: 'hidden',
    },
    settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    settingIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingLabel: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textPrimary },
    settingValue: { fontSize: 12, fontFamily: 'Inter_400Regular', color: c.textSecondary },
    divider: { height: 1, backgroundColor: c.border, marginLeft: 58 },
    footer: { alignItems: 'center', paddingTop: 8 },
    footerText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: c.textTertiary },
    footerSub: { fontSize: 10, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 2 },
  });
}
