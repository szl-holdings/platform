import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBiometric } from '@szl-holdings/mobile-shared';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PINModal, { hasPINSet } from '@/components/PINModal';
import { useScreenshotGuard } from '@/context/ScreenshotGuardContext';
import { WORKSPACES, type WorkspaceDomain } from '@/context/WorkspaceContext';
import { useColors } from '@/hooks/useColors';

const ACCENT = '#c9a84c';
const FINANCIAL_REAUTH_KEY = 'cortex_financial_reauth';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface SecurityLevelRow {
  level: string;
  requirement: string;
  icon: FeatherIconName;
  color: string;
}

interface PolicyRow {
  label: string;
  value: string;
  icon: FeatherIconName;
}

const SECURITY_LEVELS: SecurityLevelRow[] = [
  { level: 'App Open', requirement: 'Face ID / Touch ID', icon: 'smartphone', color: ACCENT },
  {
    level: 'Sensitive Screens',
    requirement: 'Biometric or PIN',
    icon: 'eye-off',
    color: '#f59e0b',
  },
  {
    level: 'Financial Actions',
    requirement: 'Biometric required',
    icon: 'dollar-sign',
    color: '#ef4444',
  },
];

const ENTERPRISE_POLICIES: PolicyRow[] = [
  { label: 'MDM Enrollment', value: 'Not Configured', icon: 'server' },
  { label: 'Zero Trust Policy', value: 'Disabled', icon: 'shield-off' },
  { label: 'Data Residency', value: 'US-East-1', icon: 'map-pin' },
  { label: 'Audit Logging', value: 'Enabled', icon: 'file-text' },
];

function SecuritySection({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.sectionBlock}>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{title}</Text>
      {children}
    </View>
  );
}

export default function SecuritySettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    isEnabled: biometricEnabled,
    enableBiometric,
    disableBiometric,
    isAvailable,
  } = useBiometric();
  const { policies, setPolicy } = useScreenshotGuard();
  const [financialReauth, setFinancialReauth] = useState(true);
  const [pinSet, setPinSet] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(FINANCIAL_REAUTH_KEY)
      .then((val) => {
        if (val !== null) setFinancialReauth(val === 'true');
      })
      .catch(() => {});

    hasPINSet()
      .then(setPinSet)
      .catch(() => {});
  }, []);

  const handleBiometricToggle = async (val: boolean) => {
    try {
      if (val) {
        const enabled = await enableBiometric();
        if (!enabled && isAvailable) {
          alert('Biometric hardware not enrolled on this device.');
        }
      } else {
        await disableBiometric();
      }
    } catch {}
  };

  const handleFinancialReauthToggle = async (val: boolean) => {
    setFinancialReauth(val);
    await AsyncStorage.setItem(FINANCIAL_REAUTH_KEY, val ? 'true' : 'false').catch(() => {});
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Security & Privacy</Text>
        <View style={styles.headerRight}>
          <View
            style={[
              styles.shieldBadge,
              { backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}30` },
            ]}
          >
            <Feather name="shield" size={14} color={ACCENT} />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.infoCard, { backgroundColor: `${ACCENT}08`, borderColor: `${ACCENT}20` }]}
        >
          <Feather name="lock" size={14} color={ACCENT} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Configure layered security for sensitive executive workspaces. Enterprise-grade
            protection for classified intelligence.
          </Text>
        </View>

        <SecuritySection title="BIOMETRIC AUTHENTICATION">
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: `${ACCENT}15` }]}>
                  <Feather name="unlock" size={16} color={ACCENT} />
                </View>
                <View>
                  <Text style={[styles.settingName, { color: colors.foreground }]}>
                    Face ID / Touch ID
                  </Text>
                  <Text style={[styles.settingSub, { color: colors.mutedForeground }]}>
                    Lock CORTEX on background
                  </Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: '#333', true: `${ACCENT}80` }}
                thumbColor={biometricEnabled ? ACCENT : '#777'}
              />
            </View>

            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                  <Feather name="credit-card" size={16} color="#ef4444" />
                </View>
                <View>
                  <Text style={[styles.settingName, { color: colors.foreground }]}>
                    Financial Re-auth
                  </Text>
                  <Text style={[styles.settingSub, { color: colors.mutedForeground }]}>
                    {financialReauth
                      ? 'Biometric or PIN required before transactions'
                      : 'Transactions proceed without re-auth'}
                  </Text>
                </View>
              </View>
              <Switch
                value={financialReauth}
                onValueChange={handleFinancialReauthToggle}
                trackColor={{ false: '#333', true: 'rgba(239,68,68,0.5)' }}
                thumbColor={financialReauth ? '#ef4444' : '#777'}
              />
            </View>

            <TouchableOpacity
              style={[styles.settingRow, { borderBottomWidth: 0 }]}
              onPress={() => setPinModalVisible(true)}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: `${ACCENT}15` }]}>
                  <Feather name="hash" size={16} color={ACCENT} />
                </View>
                <View>
                  <Text style={[styles.settingName, { color: colors.foreground }]}>
                    {pinSet ? 'Change PIN' : 'Set Up PIN'}
                  </Text>
                  <Text style={[styles.settingSub, { color: colors.mutedForeground }]}>
                    {pinSet
                      ? '6-digit PIN fallback is configured'
                      : 'Add PIN as a biometric fallback'}
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <View
            style={[styles.levelCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.levelTitle, { color: colors.foreground }]}>
              Active Security Layers
            </Text>
            {SECURITY_LEVELS.map((item) => {
              const active =
                item.level === 'Financial Actions'
                  ? biometricEnabled && financialReauth
                  : biometricEnabled;
              return (
                <View
                  key={item.level}
                  style={[styles.levelRow, { borderBottomColor: colors.border }]}
                >
                  <View style={[styles.levelIcon, { backgroundColor: `${item.color}15` }]}>
                    <Feather name={item.icon} size={13} color={item.color} />
                  </View>
                  <View style={styles.levelText}>
                    <Text style={[styles.levelName, { color: colors.foreground }]}>
                      {item.level}
                    </Text>
                    <Text style={[styles.levelReq, { color: colors.mutedForeground }]}>
                      {item.requirement}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.levelActive,
                      { backgroundColor: active ? `${item.color}20` : '#33333330' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.levelActiveText,
                        { color: active ? item.color : colors.mutedForeground },
                      ]}
                    >
                      {active ? 'ON' : 'OFF'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </SecuritySection>

        <SecuritySection title="SCREENSHOT PREVENTION">
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardNote, { color: colors.mutedForeground }]}>
              Block screenshots and screen recording per workspace. Defense, Advisory, and Portfolio
              are protected by default.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {WORKSPACES.map((ws, index) => {
              const isLast = index === WORKSPACES.length - 1;
              const enabled = policies[ws.id as WorkspaceDomain] ?? false;
              return (
                <View
                  key={ws.id}
                  style={[
                    styles.wsProtectRow,
                    !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                >
                  <View style={[styles.wsIcon, { backgroundColor: `${ws.accent}15` }]}>
                    <Text style={styles.wsIconText}>{ws.icon}</Text>
                  </View>
                  <Text style={[styles.wsName, { color: colors.foreground }]}>{ws.label}</Text>
                  {enabled && (
                    <View
                      style={[
                        styles.protectedChip,
                        { backgroundColor: `${ws.accent}10`, borderColor: `${ws.accent}30` },
                      ]}
                    >
                      <Feather name="shield" size={9} color={ws.accent} />
                      <Text style={[styles.protectedChipText, { color: ws.accent }]}>
                        Protected
                      </Text>
                    </View>
                  )}
                  <Switch
                    value={enabled}
                    onValueChange={(val) => setPolicy(ws.id as WorkspaceDomain, val)}
                    trackColor={{ false: '#333', true: `${ws.accent}80` }}
                    thumbColor={enabled ? ws.accent : '#777'}
                  />
                </View>
              );
            })}
          </View>
        </SecuritySection>

        <SecuritySection title="ENTERPRISE POLICY">
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {ENTERPRISE_POLICIES.map((item, i, arr) => (
              <View
                key={item.label}
                style={[
                  styles.policyRow,
                  i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <Feather name={item.icon} size={14} color={colors.mutedForeground} />
                <Text style={[styles.policyLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.policyValue, { color: colors.mutedForeground }]}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </SecuritySection>
      </ScrollView>

      <PINModal
        visible={pinModalVisible}
        mode="setup"
        onSuccess={() => {
          setPinModalVisible(false);
          setPinSet(true);
        }}
        onCancel={() => setPinModalVisible(false)}
        onPINSet={() => setPinSet(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3 },
  headerRight: {},
  shieldBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  sectionBlock: { gap: 8 },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.5,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardNote: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    padding: 12,
    lineHeight: 17,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  settingLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingName: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  settingSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  levelCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 12,
    gap: 10,
  },
  levelTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 10,
  },
  levelIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: { flex: 1 },
  levelName: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  levelReq: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 1 },
  levelActive: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  levelActiveText: { fontSize: 9, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  wsProtectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  wsIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wsIconText: { fontSize: 14 },
  wsName: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  protectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  protectedChipText: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  policyLabel: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  policyValue: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
