import { NotificationHub, useTheme } from '@szl-holdings/mobile-shared';
import { type Href, router } from 'expo-router';
import type React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { featherIcon, VesselIcon } from '@/components/VesselIcon';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.infoIcon, { backgroundColor: colors.primaryDim }]}>
        <VesselIcon name={featherIcon(icon)} size={13} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: colors.textFaint }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.textFaint }]}>{title}</Text>
      {children}
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const { user, logout } = useAuth();
  const { mode, toggle } = useTheme();
  const themeLabel = mode === 'dark' ? 'Dark' : mode === 'light' ? 'Light' : 'System';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of SEXTANT?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'VM';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        <NotificationHub
          fetchers={[
            {
              domain: 'vessels',
              label: 'SEXTANT',
              color: colors.primary,
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
          accentColor={colors.primary}
          backgroundColor={colors.bg}
          surfaceColor={colors.card}
          textColor={colors.text}
          dimColor={colors.textFaint}
          borderColor={colors.border}
          onDeepLink={(link) => router.push(link as Href)}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.avatarSection,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.primaryDim, borderColor: colors.primaryBorder },
            ]}
          >
            <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.displayName, { color: colors.text }]}>
              {user?.displayName || 'Fleet Officer'}
            </Text>
            <Text style={[styles.email, { color: colors.textDim }]}>{user?.email || '—'}</Text>
            {user?.roles && user.roles.length > 0 && (
              <View
                style={[
                  styles.roleBadge,
                  { backgroundColor: colors.primaryDim, borderColor: colors.primaryBorder },
                ]}
              >
                <Text style={[styles.roleText, { color: colors.primary }]}>{user.roles[0]}</Text>
              </View>
            )}
          </View>
        </View>

        <SectionCard title="DATA SOURCES">
          <InfoRow icon="radio" label="AIS Feed" value="Digitraffic + BarentsWatch (Live)" />
          <InfoRow icon="cloud" label="Weather" value="Open-Meteo Marine API" />
          <InfoRow icon="globe" label="Geopolitics" value="GDELT Maritime Intelligence" />
          <InfoRow icon="shield" label="Sanctions" value="OFAC + EU Screening" />
        </SectionCard>

        <SectionCard title="APP INFO">
          <InfoRow icon="anchor" label="App" value="SEXTANT — Fleet Command" />
          <InfoRow icon="info" label="Version" value="1.0.0" />
          <InfoRow icon="server" label="Backend" value="SEXTANT Maritime Intelligence API" />
          <InfoRow icon="wifi" label="Connectivity" value="Offline cache + WebSocket live data" />
        </SectionCard>

        <SectionCard title="MARITIME INTELLIGENCE">
          <View style={[styles.capabilityRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.capDot, { backgroundColor: colors.green }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.capTitle, { color: colors.text }]}>Dark Vessel Detection</Text>
              <Text style={[styles.capDesc, { color: colors.textFaint }]}>
                AIS blackout anomaly alerts via WebSocket
              </Text>
            </View>
            <View style={[styles.capStatus, { backgroundColor: colors.greenDim }]}>
              <Text style={[styles.capStatusText, { color: colors.green }]}>Active</Text>
            </View>
          </View>
          <View style={[styles.capabilityRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.capDot, { backgroundColor: colors.green }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.capTitle, { color: colors.text }]}>Sanctions Screening</Text>
              <Text style={[styles.capDesc, { color: colors.textFaint }]}>
                OFAC & EU list monitoring with R/Y/G indicators
              </Text>
            </View>
            <View style={[styles.capStatus, { backgroundColor: colors.greenDim }]}>
              <Text style={[styles.capStatusText, { color: colors.green }]}>Active</Text>
            </View>
          </View>
          <View style={[styles.capabilityRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.capDot, { backgroundColor: colors.green }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.capTitle, { color: colors.text }]}>Push Notifications</Text>
              <Text style={[styles.capDesc, { color: colors.textFaint }]}>
                Critical alert push via expo-notifications
              </Text>
            </View>
            <View style={[styles.capStatus, { backgroundColor: colors.greenDim }]}>
              <Text style={[styles.capStatusText, { color: colors.green }]}>Active</Text>
            </View>
          </View>
          <View style={styles.capabilityRow}>
            <View style={[styles.capDot, { backgroundColor: colors.green }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.capTitle, { color: colors.text }]}>Offline Mode</Text>
              <Text style={[styles.capDesc, { color: colors.textFaint }]}>
                Cached fleet state for poor connectivity
              </Text>
            </View>
            <View style={[styles.capStatus, { backgroundColor: colors.greenDim }]}>
              <Text style={[styles.capStatusText, { color: colors.green }]}>Enabled</Text>
            </View>
          </View>
        </SectionCard>

        <SectionCard title="DISPLAY">
          <TouchableOpacity
            onPress={() => toggle()}
            style={[styles.infoRow, { borderBottomColor: colors.border }]}
            activeOpacity={0.7}
          >
            <View style={[styles.infoIcon, { backgroundColor: colors.primaryDim }]}>
              <VesselIcon name={'moon-star' as any} size={13} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: colors.textFaint }]}>DISPLAY THEME</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {themeLabel} · Tap to cycle
              </Text>
            </View>
          </TouchableOpacity>
        </SectionCard>

        <TouchableOpacity
          onPress={handleLogout}
          style={[
            styles.logoutBtn,
            { backgroundColor: colors.redDim, borderColor: `${colors.red}30` },
          ]}
        >
          <VesselIcon name="log-out" size={16} color={colors.red} />
          <Text style={[styles.logoutText, { color: colors.red }]}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textFaint }]}>
            SEXTANT Maritime Intelligence
          </Text>
          <Text style={[styles.footerText, { color: colors.textFaint }]}>
            Fleet command for maritime operations
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100, gap: 12 },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  avatarText: { fontSize: 18, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  displayName: { fontSize: 16, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold' },
  email: { fontSize: 12, marginTop: 2, fontFamily: 'Inter_400Regular' },
  roleBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  roleText: { fontSize: 10, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold' },
  section: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    fontSize: 10,
    letterSpacing: 0.5,
    fontFamily: 'Inter_500Medium',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  infoValue: {
    fontSize: 13,
    fontWeight: '500' as const,
    fontFamily: 'Inter_500Medium',
    marginTop: 1,
  },
  capabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  capDot: { width: 8, height: 8, borderRadius: 4 },
  capTitle: { fontSize: 13, fontWeight: '500' as const, fontFamily: 'Inter_500Medium' },
  capDesc: { fontSize: 10, marginTop: 1, fontFamily: 'Inter_400Regular' },
  capStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  capStatusText: { fontSize: 9, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  logoutText: { fontSize: 15, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold' },
  footer: { alignItems: 'center', paddingTop: 8, gap: 4 },
  footerText: { fontSize: 10, fontFamily: 'Inter_400Regular' },
});
