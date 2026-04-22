import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QuickActionDeck } from '@/components/QuickActionDeck';
import { useColors } from '@/hooks/useColors';

const ACCENT = '#c9a84c';
const PURPLE = '#8b7ac8';
const TERRA = '#c87941';

// ── Terra module shortcuts ─────────────────────────────────────────────────────

const TERRA_SHORTCUTS: {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  route: string;
  badge?: string;
}[] = [
  { id: 'terra-modules', label: 'All Modules', icon: 'grid', route: '/(shell)/properties' },
  {
    id: 'lease-abstraction',
    label: 'Lease Abstraction',
    icon: 'clipboard',
    route: '/(shell)/properties/lease-abstraction',
    badge: 'AI',
  },
  {
    id: 'pro-forma',
    label: 'Pro Forma',
    icon: 'trending-up',
    route: '/(shell)/properties/pro-forma',
    badge: 'Pro',
  },
  {
    id: 'exchange-1031',
    label: '1031 Exchange',
    icon: 'refresh-cw',
    route: '/(shell)/properties/exchange-1031',
    badge: 'Tax',
  },
  {
    id: 'waterfall',
    label: 'Waterfall',
    icon: 'dollar-sign',
    route: '/(shell)/properties/waterfall',
  },
  {
    id: 'rent-roll',
    label: 'Rent Roll',
    icon: 'file-text',
    route: '/(shell)/properties/rent-roll',
  },
  {
    id: 'construction-monitor',
    label: 'Construction',
    icon: 'tool',
    route: '/(shell)/properties/construction-monitor',
    badge: 'Live',
  },
  {
    id: 'tenant-screening',
    label: 'Screening',
    icon: 'user-check',
    route: '/(shell)/properties/tenant-screening',
    badge: 'AI',
  },
];

function TerraShortcutsStrip() {
  return (
    <View style={terraStyles.wrapper}>
      <View style={terraStyles.headerRow}>
        <Feather name="home" size={10} color={TERRA} />
        <Text style={terraStyles.sectionLabel}>TERRA SHORTCUTS</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={terraStyles.scrollContent}
      >
        {TERRA_SHORTCUTS.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => {
              Haptics.selectionAsync();
              router.push(item.route as never);
            }}
            style={[
              terraStyles.shortcutBtn,
              { backgroundColor: `${TERRA}10`, borderColor: `${TERRA}30` },
            ]}
            activeOpacity={0.75}
            accessibilityLabel={item.label}
            accessibilityRole="button"
          >
            <Feather name={item.icon} size={14} color={TERRA} />
            <Text style={terraStyles.shortcutLabel}>{item.label}</Text>
            {item.badge && (
              <View style={[terraStyles.shortcutBadge, { backgroundColor: `${TERRA}25` }]}>
                <Text style={[terraStyles.shortcutBadgeText, { color: TERRA }]}>{item.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const terraStyles = StyleSheet.create({
  wrapper: { marginBottom: 4 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    color: TERRA,
    letterSpacing: 1.5,
  },
  scrollContent: { paddingHorizontal: 16, gap: 8 },
  shortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  shortcutLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: TERRA,
  },
  shortcutBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  shortcutBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
  },
});

// ── Priority signals ───────────────────────────────────────────────────────────

const PRIORITY_SIGNALS = [
  {
    id: 's1',
    domain: 'Carlota',
    domainColor: '#c2a55a',
    title: 'CRM Pipeline Disconnected',
    detail: 'Real-time data stale 3h42m — client dashboards degraded',
    severity: 'critical' as const,
    action: 'Reconnect',
  },
  {
    id: 's2',
    domain: 'KORA',
    domainColor: '#f59e0b',
    title: 'API P95 Latency Breach',
    detail: '2.4s vs 2.0s target — SLA penalty risk',
    severity: 'high' as const,
    action: 'Add Index',
  },
  {
    id: 's3',
    domain: 'PARAGON',
    domainColor: '#6366f1',
    title: 'Bundle Size Warning',
    detail: '1.34MB vs 900KB budget — MITRE module over-eager',
    severity: 'medium' as const,
    action: 'Review',
  },
];

const AWAITING_APPROVAL = [
  {
    id: 'p1',
    domain: 'Portfolio',
    domainColor: ACCENT,
    title: 'Wire Transfer Authorization',
    amount: '$2,400,000',
    requester: 'CFO Office',
    due: 'Today 5:00 PM',
    urgency: 'critical' as const,
  },
  {
    id: 'p2',
    domain: 'PARAGON',
    domainColor: '#6366f1',
    title: 'Critical CVE Patch Deploy',
    requester: 'Aegis SOC',
    due: 'Within 2 hours',
    urgency: 'critical' as const,
  },
  {
    id: 'p3',
    domain: 'DOMAINE',
    domainColor: '#4d7c0f',
    title: 'LP Q1 Report — CFO Sign-off',
    requester: 'Finance Lead',
    due: 'Apr 20',
    urgency: 'high' as const,
  },
];

const BUSINESS_HEALTH = {
  score: 76,
  label: 'Moderate',
  color: '#f59e0b',
  delta: '+3 pts',
  atRisk: '$8.4M',
  protected: '$1.54M',
};

type Tab = 'approvals' | 'signals' | 'deck';
type TabIcon = 'check-circle' | 'alert-triangle' | 'layers';

// ── helpers ────────────────────────────────────────────────────────────────────

function severityColor(s: string) {
  if (s === 'critical') return '#ef4444';
  if (s === 'high') return '#f97316';
  if (s === 'medium') return '#f59e0b';
  return '#22c55e';
}

// ── sub-views ─────────────────────────────────────────────────────────────────

function BusinessHealthStrip({ colors }: { colors: ReturnType<typeof useColors> }) {
  const h = BUSINESS_HEALTH;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 12,
        backgroundColor: `${h.color}12`,
        borderWidth: 1,
        borderColor: `${h.color}30`,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 11,
            fontFamily: 'Inter_600SemiBold',
            color: h.color,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          Business Health
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
          <Text
            style={{
              fontSize: 26,
              fontFamily: 'Inter_700Bold',
              color: h.color,
              letterSpacing: -0.5,
            }}
          >
            {h.score}
          </Text>
          <Text
            style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: h.color, opacity: 0.6 }}
          >
            /100 · {h.delta}
          </Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              fontSize: 9,
              fontFamily: 'Inter_600SemiBold',
              color: '#ef4444',
              textTransform: 'uppercase',
              letterSpacing: 0.3,
            }}
          >
            At Risk
          </Text>
          <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: '#ef4444' }}>
            {h.atRisk}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              fontSize: 9,
              fontFamily: 'Inter_600SemiBold',
              color: '#22c55e',
              textTransform: 'uppercase',
              letterSpacing: 0.3,
            }}
          >
            Protected
          </Text>
          <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#22c55e' }}>
            {h.protected}
          </Text>
        </View>
      </View>
    </View>
  );
}

function SignalsView({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
      {PRIORITY_SIGNALS.map((signal, _i) => {
        const sc = severityColor(signal.severity);
        return (
          <View
            key={signal.id}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12,
              paddingVertical: 14,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderLeftWidth: 3,
              borderLeftColor: sc,
              marginBottom: 10,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: sc,
                marginTop: 4,
                flexShrink: 0,
              }}
            />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Inter_600SemiBold',
                    color: colors.foreground,
                  }}
                >
                  {signal.title}
                </Text>
                <View
                  style={{
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                    borderRadius: 4,
                    backgroundColor: `${signal.domainColor}20`,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      fontFamily: 'Inter_600SemiBold',
                      color: signal.domainColor,
                    }}
                  >
                    {signal.domain}
                  </Text>
                </View>
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'Inter_400Regular',
                  color: colors.mutedForeground,
                  lineHeight: 16,
                }}
              >
                {signal.detail}
              </Text>
            </View>
            <TouchableOpacity
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 7,
                backgroundColor: `${sc}18`,
                borderWidth: 1,
                borderColor: `${sc}35`,
                flexShrink: 0,
              }}
            >
              <Text style={{ fontSize: 10, fontFamily: 'Inter_600SemiBold', color: sc }}>
                {signal.action}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

function ApprovalsView({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
      {AWAITING_APPROVAL.map((item) => {
        const isApproved = approvedIds.includes(item.id);
        const isRejected = rejectedIds.includes(item.id);
        const uc = severityColor(item.urgency);
        return (
          <View
            key={item.id}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: isApproved ? '#22c55e30' : isRejected ? '#ef444430' : colors.border,
              marginBottom: 10,
              opacity: isApproved || isRejected ? 0.6 : 1,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <View
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: 4,
                  backgroundColor: `${item.domainColor}20`,
                }}
              >
                <Text
                  style={{ fontSize: 9, fontFamily: 'Inter_600SemiBold', color: item.domainColor }}
                >
                  {item.domain}
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: 4,
                  backgroundColor: `${uc}18`,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontFamily: 'Inter_600SemiBold',
                    color: uc,
                    textTransform: 'uppercase',
                  }}
                >
                  {item.urgency}
                </Text>
              </View>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' }}
              >
                <Feather name="clock" size={9} color={colors.mutedForeground} />
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: 'Inter_400Regular',
                    color:
                      item.due.includes('Today') || item.due.includes('hours')
                        ? '#f59e0b'
                        : colors.mutedForeground,
                  }}
                >
                  {item.due}
                </Text>
              </View>
            </View>

            <Text
              style={{
                fontSize: 13,
                fontFamily: 'Inter_600SemiBold',
                color: colors.foreground,
                marginBottom: 4,
              }}
            >
              {item.title}
            </Text>
            {item.amount && (
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: 'Inter_700Bold',
                  color: ACCENT,
                  marginBottom: 4,
                }}
              >
                {item.amount}
              </Text>
            )}
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Inter_400Regular',
                color: colors.mutedForeground,
                marginBottom: 12,
              }}
            >
              Requested by {item.requester}
            </Text>

            {!isApproved && !isRejected && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setApprovedIds((prev) => [...prev, item.id])}
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: 8,
                    backgroundColor: '#22c55e',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff' }}>
                    Approve
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setRejectedIds((prev) => [...prev, item.id])}
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: 8,
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: '#ef444440',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#ef4444' }}>
                    Deny
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {(isApproved || isRejected) && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather
                  name={isApproved ? 'check-circle' : 'x-circle'}
                  size={14}
                  color={isApproved ? '#22c55e' : '#ef4444'}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Inter_600SemiBold',
                    color: isApproved ? '#22c55e' : '#ef4444',
                  }}
                >
                  {isApproved ? 'Approved' : 'Denied'}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function QuickActionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('approvals');

  const TAB_CONFIG: { id: Tab; label: string; icon: TabIcon; badge?: number }[] = [
    { id: 'approvals', label: 'Approvals', icon: 'check-circle', badge: AWAITING_APPROVAL.length },
    {
      id: 'signals',
      label: 'Signals',
      icon: 'alert-triangle',
      badge: PRIORITY_SIGNALS.filter((s) => s.severity === 'critical').length,
    },
    { id: 'deck', label: 'Swipe Deck', icon: 'layers' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Command Deck</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Priority actions & business signals
          </Text>
        </View>
        <View
          style={[styles.accentDot, { backgroundColor: `${PURPLE}20`, borderColor: `${PURPLE}40` }]}
        >
          <Feather name="zap" size={16} color={PURPLE} />
        </View>
      </View>

      {/* Business health strip */}
      <View style={{ marginTop: 14 }}>
        <BusinessHealthStrip colors={colors} />
      </View>

      {/* Terra shortcuts */}
      <TerraShortcutsStrip />

      {/* Tab bar */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16 },
        ]}
      >
        {TAB_CONFIG.map((t) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => setTab(t.id)}
            style={[
              styles.tabBtn,
              tab === t.id && { backgroundColor: `${PURPLE}18`, borderColor: `${PURPLE}35` },
            ]}
          >
            <Feather
              name={t.icon}
              size={11}
              color={tab === t.id ? PURPLE : colors.mutedForeground}
            />
            <Text
              style={[styles.tabLabel, { color: tab === t.id ? PURPLE : colors.mutedForeground }]}
            >
              {t.label}
            </Text>
            {t.badge != null && t.badge > 0 && (
              <View
                style={[
                  styles.tabBadge,
                  { backgroundColor: tab === t.id ? `${PURPLE}25` : `${colors.border}` },
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    { color: tab === t.id ? PURPLE : colors.mutedForeground },
                  ]}
                >
                  {t.badge}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={[styles.body, { paddingBottom: insets.bottom + 16 }]}>
        {tab === 'approvals' && <ApprovalsView colors={colors} />}
        {tab === 'signals' && <SignalsView colors={colors} />}
        {tab === 'deck' && (
          <View style={{ flex: 1 }}>
            <QuickActionDeck />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  accentDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
    gap: 2,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  tabBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  tabBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
  },
  body: {
    flex: 1,
  },
});
