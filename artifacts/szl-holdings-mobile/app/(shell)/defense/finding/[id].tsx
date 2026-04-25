import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { apiGet, apiPut } from '@/lib/apiClient';
import { giColors, palette } from '@/lib/gi-bridge';

interface FindingDetail {
  id: number;
  title: string;
  description?: string;
  severity: string;
  status: string;
  affectedAsset?: string;
  remediationOwner?: string;
  dueDate?: string;
  cvssScore?: number | string;
  cveId?: string;
  recommendation?: string;
  auditTrail?: AuditEntry[];
}

interface AuditEntry {
  action: string;
  user: string;
  at?: string;
}

interface FindingUpdate {
  status?: string;
  severity?: string;
}

async function fetchFinding(id: string): Promise<FindingDetail> {
  return apiGet<FindingDetail>(`/api/aegis/findings/${id}`);
}

async function updateFinding(id: string, data: FindingUpdate): Promise<FindingDetail> {
  return apiPut<FindingDetail>(`/api/aegis/findings/${id}`, data);
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: palette.critical,
  high: giColors.accent.amber,
  medium: palette.high,
  low: palette.low,
  info: giColors.accent.violet,
};
const STATUS_COLORS: Record<string, string> = {
  open: palette.critical,
  confirmed: palette.high,
  mitigated: palette.success,
  accepted: palette.low,
  false_positive: giColors.text.muted,
};
const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  confirmed: 'Confirmed',
  mitigated: 'Mitigated',
  accepted: 'Accepted',
  false_positive: 'False Positive',
};

export default function FindingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [biometricPassed, setBiometricPassed] = useState(Platform.OS === 'web');
  const [biometricChecking, setBiometricChecking] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHardware || !isEnrolled) {
          setBiometricPassed(true);
          setBiometricChecking(false);
          return;
        }
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to view forensic finding',
          cancelLabel: 'Cancel',
          fallbackLabel: 'Use Passcode',
        });
        if (result.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setBiometricPassed(true);
        } else {
          router.back();
        }
      } catch {
        router.back();
      } finally {
        setBiometricChecking(false);
      }
    })();
  }, []);

  const { data: finding, isLoading } = useQuery({
    queryKey: ['aegis-finding', id],
    queryFn: () => fetchFinding(id!),
    enabled: !!id && biometricPassed,
  });

  const updateMut = useMutation({
    mutationFn: (data: FindingUpdate) => updateFinding(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aegis-findings'] });
      qc.invalidateQueries({ queryKey: ['aegis-finding', id] });
    },
  });

  const topInsets = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomInsets = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  if (biometricChecking) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="finger-print" size={48} color={colors.amber} />
        <Text
          style={{
            color: colors.mutedForeground,
            marginTop: 12,
            fontFamily: 'Inter_400Regular',
            fontSize: 13,
          }}
        >
          Authenticating…
        </Text>
      </View>
    );
  }

  if (!biometricPassed) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed" size={48} color={colors.red} />
        <Text style={{ color: colors.red, marginTop: 12, fontFamily: 'Inter_500Medium' }}>
          Access Denied
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.amber} size="large" />
      </View>
    );
  }

  if (!finding) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.red }}>Finding not found</Text>
      </View>
    );
  }

  const sevColor = SEVERITY_COLORS[finding.severity] ?? colors.amber;
  const stColor = STATUS_COLORS[finding.status] ?? colors.amber;
  const auditTrail = Array.isArray(finding.auditTrail) ? finding.auditTrail : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topInsets + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.foreground, fontFamily: 'SpaceGrotesk_600SemiBold' },
          ]}
          numberOfLines={1}
        >
          Finding #{id}
        </Text>
        <View
          style={[
            styles.sevPill,
            { backgroundColor: `${sevColor}20`, borderColor: `${sevColor}50` },
          ]}
        >
          <Text style={[styles.sevPillText, { color: sevColor }]}>
            {finding.severity?.toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: bottomInsets + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[styles.title, { color: colors.foreground, fontFamily: 'SpaceGrotesk_700Bold' }]}
        >
          {finding.title}
        </Text>

        {finding.description && (
          <Text
            style={[
              styles.description,
              { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
            ]}
          >
            {finding.description}
          </Text>
        )}

        <View
          style={[
            styles.metaCard,
            { backgroundColor: colors.navyLight, borderColor: colors.border },
          ]}
        >
          {[
            { label: 'Status', value: STATUS_LABELS[finding.status] ?? finding.status },
            { label: 'Severity', value: finding.severity },
            { label: 'Asset', value: finding.affectedAsset ?? '—' },
            { label: 'Owner', value: finding.remediationOwner ?? 'Unassigned' },
            {
              label: 'Due',
              value: finding.dueDate ? new Date(finding.dueDate).toLocaleDateString() : '—',
            },
            {
              label: 'CVSS',
              value: finding.cvssScore ? Number(finding.cvssScore).toFixed(1) : '—',
            },
            { label: 'CVE', value: finding.cveId ?? '—' },
          ].map((row, i, arr) => (
            <View
              key={row.label}
              style={[
                styles.metaRow,
                { borderBottomColor: i < arr.length - 1 ? colors.border : 'transparent' },
              ]}
            >
              <Text style={[styles.metaKey, { color: colors.mutedForeground }]}>{row.label}</Text>
              <Text
                style={[
                  styles.metaValue,
                  {
                    color:
                      row.label === 'Severity'
                        ? sevColor
                        : row.label === 'Status'
                          ? stColor
                          : colors.foreground,
                  },
                ]}
              >
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {finding.recommendation && (
          <View
            style={[
              styles.remCard,
              { backgroundColor: colors.emeraldDim, borderColor: 'rgba(16,185,129,0.2)' },
            ]}
          >
            <Ionicons name="checkmark-circle" size={16} color={colors.emerald} />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.remLabel,
                  { color: colors.emerald, fontFamily: 'Inter_600SemiBold' },
                ]}
              >
                Remediation Steps
              </Text>
              <Text
                style={[styles.remBody, { color: colors.emerald, fontFamily: 'Inter_400Regular' }]}
              >
                {finding.recommendation}
              </Text>
            </View>
          </View>
        )}

        <Text
          style={[
            styles.sectionLabel,
            { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' },
          ]}
        >
          UPDATE STATUS
        </Text>
        <View style={styles.statusGrid}>
          {Object.entries(STATUS_LABELS).map(([st, label]) => {
            const active = finding.status === st;
            const c = STATUS_COLORS[st];
            return (
              <TouchableOpacity
                key={st}
                style={[
                  styles.statusChip,
                  {
                    backgroundColor: active ? `${c}20` : colors.navyLight,
                    borderColor: active ? `${c}50` : colors.border,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateMut.mutate({ status: st });
                }}
              >
                {active && <View style={[styles.activeDot, { backgroundColor: c }]} />}
                <Text
                  style={[
                    styles.statusChipText,
                    {
                      color: active ? c : colors.mutedForeground,
                      fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                    },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {auditTrail.length > 0 && (
          <>
            <Text
              style={[
                styles.sectionLabel,
                { color: colors.mutedForeground, fontFamily: 'Inter_500Medium', marginTop: 8 },
              ]}
            >
              AUDIT TRAIL
            </Text>
            <View
              style={[
                styles.auditCard,
                { backgroundColor: colors.navyLight, borderColor: colors.border },
              ]}
            >
              {auditTrail
                .slice()
                .reverse()
                .map((entry: AuditEntry, i: number) => (
                  <View
                    key={i}
                    style={[
                      styles.auditRow,
                      {
                        borderBottomColor:
                          i < auditTrail.length - 1 ? colors.border : 'transparent',
                      },
                    ]}
                  >
                    <View style={[styles.auditDot, { backgroundColor: colors.amberBorder }]} />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.auditAction,
                          { color: colors.foreground, fontFamily: 'Inter_500Medium' },
                        ]}
                      >
                        {entry.action}
                      </Text>
                      <Text
                        style={[
                          styles.auditMeta,
                          { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
                        ]}
                      >
                        {entry.user} · {entry.at ? new Date(entry.at).toLocaleString() : ''}
                      </Text>
                    </View>
                  </View>
                ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 16 },
  sevPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  sevPillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  title: { fontSize: 20, lineHeight: 28, marginBottom: 10 },
  description: { fontSize: 14, lineHeight: 22, marginBottom: 20 },
  metaCard: { borderRadius: 12, borderWidth: 1, marginBottom: 20, overflow: 'hidden' },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  metaKey: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  metaValue: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  remCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  remLabel: { fontSize: 12, marginBottom: 4 },
  remBody: { fontSize: 13, lineHeight: 19 },
  sectionLabel: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  statusChipText: { fontSize: 12 },
  auditCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  auditDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  auditAction: { fontSize: 13 },
  auditMeta: { fontSize: 11, marginTop: 2 },
});
