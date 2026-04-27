import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { apiFetch } from '@/lib/apiClient';
import { giColors, giProductAccent } from '@/lib/gi-bridge';

const ACCENT = giProductAccent.holdings;

function isDemoMode(): boolean {
  return !!(process.env.EXPO_PUBLIC_BILLING_DEMO_MODE === 'true');
}

type SubscriptionStatus = {
  subscribed: boolean;
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd?: number;
    cancelAtPeriodEnd?: boolean;
  } | null;
};

type StripeInvoice = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  hostedInvoiceUrl?: string;
};

type UsageSummary = {
  summary: {
    apiCalls: number;
    activeUsers: number;
    storageBytes: number;
    storageMB: number;
  };
};

type StripeConfig = {
  stripeConnected: boolean;
  stripeMode: 'live' | 'test' | 'mock';
};

const DEMO_SUBSCRIPTION: SubscriptionStatus = {
  subscribed: true,
  subscription: {
    id: 'sub_demo',
    status: 'active',
    currentPeriodEnd: Math.floor(Date.now() / 1000) + 15 * 86400,
    cancelAtPeriodEnd: false,
  },
};

const DEMO_INVOICES: StripeInvoice[] = [
  {
    id: 'in_demo_001',
    amount: 9900,
    currency: 'usd',
    status: 'paid',
    created: Math.floor(Date.now() / 1000) - 30 * 86400,
  },
  {
    id: 'in_demo_002',
    amount: 9900,
    currency: 'usd',
    status: 'paid',
    created: Math.floor(Date.now() / 1000) - 60 * 86400,
  },
];

function fmtCurrency(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function fmtDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function statusColor(status: string): string {
  if (status === 'active' || status === 'paid') return '#22c55e';
  if (status === 'trialing') return '#3b82f6';
  if (status === 'past_due') return '#f59e0b';
  return '#6b7280';
}

function StatusBadge({ status }: { status: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${statusColor(status)}20`, borderColor: `${statusColor(status)}40` }]}>
      <Text style={[styles.badgeText, { color: statusColor(status) }]}>
        {status.replace('_', ' ')}
      </Text>
    </View>
  );
}

export default function BillingScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [portalLoading, setPortalLoading] = useState(false);

  // Probe Stripe mode first — when the server reports a live Stripe key, we
  // ignore EXPO_PUBLIC_BILLING_DEMO_MODE and serve real data even if the env
  // flag is still set. This keeps the demo fixtures useful for offline/local
  // dev without overriding live billing in deployed builds.
  const stripeConfigQuery = useQuery<StripeConfig | null>({
    queryKey: ['mobile-billing-stripe-config'],
    queryFn: async () => {
      try {
        return await apiFetch<StripeConfig>('/api/billing/stripe-config');
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60_000,
  });

  const stripeLive = stripeConfigQuery.data?.stripeMode === 'live';
  const effectiveDemoMode = isDemoMode() && !stripeLive;

  const subscriptionQuery = useQuery<SubscriptionStatus | null>({
    // Include effectiveDemoMode in the key so the query refetches once
    // stripe-config resolves and flips us off demo data.
    queryKey: ['mobile-billing-subscription', effectiveDemoMode],
    queryFn: async () => {
      if (effectiveDemoMode) return DEMO_SUBSCRIPTION;
      return apiFetch<SubscriptionStatus>('/api/billing/subscription-status');
    },
    staleTime: 30_000,
  });

  const invoicesQuery = useQuery<StripeInvoice[]>({
    queryKey: ['mobile-billing-invoices', effectiveDemoMode],
    queryFn: async () => {
      if (effectiveDemoMode) return DEMO_INVOICES;
      return apiFetch<StripeInvoice[]>('/api/billing/stripe-invoices');
    },
    staleTime: 60_000,
  });

  const usageQuery = useQuery<UsageSummary | null>({
    queryKey: ['mobile-billing-usage'],
    queryFn: async () => {
      try {
        return await apiFetch<UsageSummary>('/api/usage/summary');
      } catch {
        return null;
      }
    },
    staleTime: 120_000,
  });

  const isLoading = subscriptionQuery.isLoading || invoicesQuery.isLoading;
  const sub = subscriptionQuery.data?.subscription ?? null;
  const invoices = invoicesQuery.data ?? [];
  const usage = usageQuery.data?.summary;
  const showDemoBadge = effectiveDemoMode;

  async function openPortal() {
    if (effectiveDemoMode) {
      Alert.alert('Demo Mode', 'The Stripe billing portal is not available in demo mode. Configure a live Stripe key to enable this feature.');
      return;
    }
    setPortalLoading(true);
    try {
      const returnUrl = Linking.createURL('billing');
      const res = await apiFetch<{ url: string }>('/api/billing/portal-session', {
        method: 'POST',
        body: JSON.stringify({ returnUrl }),
      });
      const url = res.url;
      if (url) {
        await WebBrowser.openBrowserAsync(url, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        });
      }
    } catch {
      Alert.alert('Error', 'Unable to open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  }

  function onRefresh() {
    stripeConfigQuery.refetch();
    subscriptionQuery.refetch();
    invoicesQuery.refetch();
    usageQuery.refetch();
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={onRefresh}
          tintColor={ACCENT}
        />
      }
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Billing</Text>
        {showDemoBadge && (
          <View style={styles.demoBadge}>
            <Feather name="zap" size={11} color="#f59e0b" />
            <Text style={styles.demoBadgeText}>Demo</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : (
        <>
          {/* Subscription card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Feather name="credit-card" size={15} color={ACCENT} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Subscription</Text>
            </View>
            {sub ? (
              <>
                <View style={styles.row}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>Status</Text>
                  <StatusBadge status={sub.status} />
                </View>
                {sub.currentPeriodEnd && (
                  <View style={styles.row}>
                    <Text style={[styles.label, { color: colors.textMuted }]}>
                      {sub.cancelAtPeriodEnd ? 'Ends' : 'Renews'}
                    </Text>
                    <Text style={[styles.value, { color: colors.text }]}>
                      {fmtDate(sub.currentPeriodEnd)}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No active subscription
              </Text>
            )}

            <TouchableOpacity
              style={[styles.portalButton, { backgroundColor: ACCENT }]}
              onPress={openPortal}
              disabled={portalLoading}
            >
              {portalLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Feather name="external-link" size={14} color="#000" />
                  <Text style={styles.portalButtonText}>Manage subscription</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Usage card */}
          {usage && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Feather name="bar-chart-2" size={15} color={giColors.accent.violet} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>Usage this period</Text>
              </View>
              <View style={styles.usageGrid}>
                <View style={styles.usageItem}>
                  <Text style={[styles.usageStat, { color: colors.text }]}>
                    {usage.apiCalls.toLocaleString()}
                  </Text>
                  <Text style={[styles.usageLabel, { color: colors.textMuted }]}>API calls</Text>
                </View>
                <View style={styles.usageItem}>
                  <Text style={[styles.usageStat, { color: colors.text }]}>
                    {usage.activeUsers.toLocaleString()}
                  </Text>
                  <Text style={[styles.usageLabel, { color: colors.textMuted }]}>Active users</Text>
                </View>
                <View style={styles.usageItem}>
                  <Text style={[styles.usageStat, { color: colors.text }]}>
                    {usage.storageMB.toFixed(1)} MB
                  </Text>
                  <Text style={[styles.usageLabel, { color: colors.textMuted }]}>Storage</Text>
                </View>
              </View>
            </View>
          )}

          {/* Invoices card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Feather name="file-text" size={15} color="#8b5cf6" />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Invoice history</Text>
            </View>
            {invoices.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No invoices yet.</Text>
            ) : (
              <View style={styles.invoiceList}>
                {invoices.slice(0, 8).map((inv) => (
                  <TouchableOpacity
                    key={inv.id}
                    style={[styles.invoiceRow, { borderBottomColor: colors.border }]}
                    onPress={async () => {
                      if (inv.hostedInvoiceUrl) {
                        await WebBrowser.openBrowserAsync(inv.hostedInvoiceUrl, {
                          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
                        });
                      }
                    }}
                    disabled={!inv.hostedInvoiceUrl}
                  >
                    <View style={styles.invoiceInfo}>
                      <Text style={[styles.invoiceAmount, { color: colors.text }]}>
                        {fmtCurrency(inv.amount, inv.currency)}
                      </Text>
                      <Text style={[styles.invoiceDate, { color: colors.textMuted }]}>
                        {fmtDate(inv.created)}
                      </Text>
                    </View>
                    <View style={styles.invoiceRight}>
                      <StatusBadge status={inv.status} />
                      {inv.hostedInvoiceUrl && (
                        <Feather name="external-link" size={12} color={colors.textMuted} style={{ marginLeft: 8 }} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  demoBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#f59e0b',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
  },
  badge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  portalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 4,
  },
  portalButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  usageGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  usageItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  usageStat: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  usageLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  invoiceList: {
    gap: 0,
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  invoiceInfo: {
    gap: 2,
  },
  invoiceAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  invoiceDate: {
    fontSize: 11,
  },
  invoiceRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
