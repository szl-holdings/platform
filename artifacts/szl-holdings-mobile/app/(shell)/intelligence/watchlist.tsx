import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { apiFetch } from '@/lib/apiClient';

const ACCENT = '#c9a84c';

interface WatchlistItem {
  id: number;
  entityUri: string;
  entityType: string;
  entityLabel: string;
  domain: string;
  addedAt: string;
}

interface PushSchedule {
  enabled: boolean;
  deliveryHourUtc: number;
  lastDeliveredAt: string | null;
}

const DOMAIN_META: Record<string, { label: string; color: string; icon: string }> = {
  maritime: { label: 'Maritime', color: '#5090e8', icon: '⚓' },
  security: { label: 'Security', color: '#ef4444', icon: '⬡' },
  real_estate: { label: 'Real Estate', color: '#22c55e', icon: '⬢' },
  legal: { label: 'Legal', color: '#a855f7', icon: '⚖' },
  financial: { label: 'Financial', color: '#f59e0b', icon: '◈' },
  platform: { label: 'Platform', color: '#06b6d4', icon: '◆' },
  executive: { label: 'Executive', color: ACCENT, icon: '★' },
};

const ENTITY_TYPES = [
  { value: 'vessel', label: 'Vessel', domain: 'maritime' },
  { value: 'threat', label: 'Threat', domain: 'security' },
  { value: 'property', label: 'Property', domain: 'real_estate' },
  { value: 'matter', label: 'Legal Matter', domain: 'legal' },
  { value: 'deal', label: 'Deal', domain: 'financial' },
  { value: 'holding', label: 'Holding', domain: 'financial' },
  { value: 'agent', label: 'Agent', domain: 'platform' },
];

function domainColor(domain: string): string {
  return DOMAIN_META[domain]?.color ?? ACCENT;
}

function WatchlistItemCard({
  item,
  onRemove,
  colors,
}: {
  item: WatchlistItem;
  onRemove: (id: number) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const color = domainColor(item.domain);
  const meta = DOMAIN_META[item.domain];

  return (
    <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.itemIcon, { backgroundColor: `${color}15`, borderColor: `${color}30` }]}>
        <Text style={styles.itemIconText}>{meta?.icon ?? '◆'}</Text>
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemLabel, { color: colors.foreground }]}>{item.entityLabel}</Text>
        <View style={styles.itemMeta}>
          <View style={[styles.domainPill, { backgroundColor: `${color}12`, borderColor: `${color}25` }]}>
            <Text style={[styles.domainPillText, { color }]}>{meta?.label ?? item.domain}</Text>
          </View>
          <Text style={[styles.itemTypText, { color: colors.mutedForeground }]}>{item.entityType}</Text>
        </View>
        <Text style={[styles.itemUri, { color: colors.mutedForeground }]} numberOfLines={1}>
          {item.entityUri}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() =>
          Alert.alert('Remove from Watchlist', `Remove "${item.entityLabel}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => onRemove(item.id) },
          ])
        }
        style={styles.removeBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="trash-2" size={14} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );
}

function AddEntityModal({
  visible,
  onClose,
  onAdd,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (input: { entityUri: string; entityType: string; entityLabel: string; domain: string }) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [entityType, setEntityType] = useState('');
  const [entityLabel, setEntityLabel] = useState('');
  const [domain, setDomain] = useState('');
  const [step, setStep] = useState<'type' | 'label'>('type');

  const handleClose = () => {
    setEntityType('');
    setEntityLabel('');
    setDomain('');
    setStep('type');
    onClose();
  };

  const handleTypeSelect = (type: string, d: string) => {
    setEntityType(type);
    setDomain(d);
    setStep('label');
  };

  const handleSubmit = () => {
    if (!entityLabel.trim()) return;
    const uri = `${domain}:${entityType}:${entityLabel.trim().toLowerCase().replace(/\s+/g, '-')}`;
    onAdd({ entityUri: uri, entityType, entityLabel: entityLabel.trim(), domain });
    handleClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add to Watchlist</Text>
          <TouchableOpacity onPress={handleClose}>
            <Feather name="x" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          {step === 'type' && (
            <>
              <Text style={[styles.modalStepLabel, { color: colors.mutedForeground }]}>
                SELECT ENTITY TYPE
              </Text>
              {ENTITY_TYPES.map((t) => {
                const meta = DOMAIN_META[t.domain];
                const color = domainColor(t.domain);
                return (
                  <TouchableOpacity
                    key={t.value}
                    onPress={() => handleTypeSelect(t.value, t.domain)}
                    style={[styles.typeRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.typeIconBox, { backgroundColor: `${color}12`, borderColor: `${color}25` }]}>
                      <Text style={styles.typeIcon}>{meta?.icon ?? '◆'}</Text>
                    </View>
                    <View style={styles.typeContent}>
                      <Text style={[styles.typeLabel, { color: colors.foreground }]}>{t.label}</Text>
                      <Text style={[styles.typeDomain, { color }]}>{meta?.label ?? t.domain}</Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {step === 'label' && (
            <>
              <Text style={[styles.modalStepLabel, { color: colors.mutedForeground }]}>
                ENTITY NAME
              </Text>
              <View style={[styles.domainChip, { backgroundColor: `${domainColor(domain)}12`, borderColor: `${domainColor(domain)}25` }]}>
                <Text style={[styles.domainChipText, { color: domainColor(domain) }]}>
                  {DOMAIN_META[domain]?.icon} {DOMAIN_META[domain]?.label ?? domain} · {entityType}
                </Text>
              </View>
              <TextInput
                style={[styles.labelInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder={`e.g. "MV Pacific Dawn"`}
                placeholderTextColor={colors.mutedForeground}
                value={entityLabel}
                onChangeText={setEntityLabel}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!entityLabel.trim()}
                style={[styles.submitBtn, { opacity: entityLabel.trim() ? 1 : 0.4 }]}
              >
                <Text style={styles.submitBtnText}>Add to Watchlist</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setStep('type')}
                style={styles.backBtn}
              >
                <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
                <Text style={[styles.backBtnText, { color: colors.mutedForeground }]}>Back</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function WatchlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const watchlistQuery = useQuery<{ watchlist: WatchlistItem[]; total: number }>({
    queryKey: ['pulse-watchlist'],
    queryFn: () => apiFetch('/api/pulse/watchlist'),
  });

  const scheduleQuery = useQuery<{ schedule: PushSchedule }>({
    queryKey: ['pulse-push-schedule'],
    queryFn: () => apiFetch('/api/pulse/push-schedule'),
  });

  const addMutation = useMutation({
    mutationFn: (input: { entityUri: string; entityType: string; entityLabel: string; domain: string }) =>
      apiFetch('/api/pulse/watchlist', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pulse-watchlist'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/pulse/watchlist/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pulse-watchlist'] });
    },
  });

  const toggleScheduleMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      apiFetch('/api/pulse/push-schedule', {
        method: 'PUT',
        body: JSON.stringify({ enabled }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pulse-push-schedule'] });
    },
  });

  const watchlist = watchlistQuery.data?.watchlist ?? [];
  const schedule = scheduleQuery.data?.schedule;
  const isRefreshing = watchlistQuery.isRefetching || scheduleQuery.isRefetching;

  const handleRefresh = () => {
    watchlistQuery.refetch();
    scheduleQuery.refetch();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Watchlist</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Personalized briefing scope
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
          <Feather name="plus" size={18} color={ACCENT} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={ACCENT} />
        }
      >
        {schedule && (
          <View style={[styles.scheduleCard, { backgroundColor: colors.card, borderColor: `${ACCENT}30` }]}>
            <View style={styles.scheduleHeader}>
              <Feather name={schedule.enabled ? 'bell' : 'bell-off'} size={14} color={schedule.enabled ? ACCENT : colors.mutedForeground} />
              <Text style={[styles.scheduleTitle, { color: schedule.enabled ? ACCENT : colors.mutedForeground }]}>
                Morning Push Briefing
              </Text>
            </View>
            <View style={styles.scheduleRow}>
              <Text style={[styles.scheduleDesc, { color: colors.mutedForeground }]}>
                {schedule.enabled
                  ? `Delivery at ${schedule.deliveryHourUtc}:00 UTC each morning`
                  : 'Push briefings are paused'}
              </Text>
              <TouchableOpacity
                onPress={() => toggleScheduleMutation.mutate(!schedule.enabled)}
                disabled={toggleScheduleMutation.isPending}
                style={[
                  styles.toggleBtn,
                  {
                    backgroundColor: schedule.enabled ? '#ef444415' : `${ACCENT}15`,
                    borderColor: schedule.enabled ? '#ef444435' : `${ACCENT}35`,
                  },
                ]}
              >
                <Text style={[styles.toggleBtnText, { color: schedule.enabled ? '#ef4444' : ACCENT }]}>
                  {schedule.enabled ? 'Pause' : 'Enable'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          WATCHED ENTITIES{watchlist.length > 0 ? ` · ${watchlist.length}` : ''}
        </Text>

        {watchlistQuery.isLoading && (
          <ActivityIndicator color={ACCENT} style={{ marginTop: 32 }} />
        )}

        {!watchlistQuery.isLoading && watchlist.length === 0 && (
          <Pressable
            onPress={() => setShowModal(true)}
            style={[styles.emptyCard, { borderColor: `${ACCENT}25` }]}
          >
            <Feather name="bookmark" size={28} color={`${ACCENT}50`} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Your watchlist is empty
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Track vessels, deals, holdings, threats, and legal matters to personalize your morning briefing.
            </Text>
            <View style={styles.emptyBtnWrap}>
              <Text style={styles.emptyBtnText}>+ Add First Entity</Text>
            </View>
          </Pressable>
        )}

        {watchlist.map((item) => (
          <WatchlistItemCard
            key={item.id}
            item={item}
            onRemove={(id) => removeMutation.mutate(id)}
            colors={colors}
          />
        ))}
      </ScrollView>

      <AddEntityModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAdd={(input) => addMutation.mutate(input)}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { padding: 4, marginRight: 8 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  headerSub: { fontSize: 12, marginTop: 1 },
  addBtn: { padding: 4, marginLeft: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 8 },
  scheduleCard: {
    borderRadius: 10, padding: 14, borderWidth: 1, marginBottom: 8,
  },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  scheduleTitle: { fontSize: 13, fontWeight: '600' },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scheduleDesc: { fontSize: 12, flex: 1, marginRight: 8 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
  toggleBtnText: { fontSize: 12, fontWeight: '600' },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase',
    marginTop: 4, marginBottom: 8,
  },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 10, padding: 12, borderWidth: StyleSheet.hairlineWidth, marginBottom: 6,
  },
  itemIcon: {
    width: 36, height: 36, borderRadius: 8, alignItems: 'center',
    justifyContent: 'center', borderWidth: 1,
  },
  itemIconText: { fontSize: 16 },
  itemContent: { flex: 1 },
  itemLabel: { fontSize: 14, fontWeight: '500', marginBottom: 3 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  domainPill: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, borderWidth: 1 },
  domainPillText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  itemTypText: { fontSize: 11 },
  itemUri: { fontSize: 10, fontFamily: 'monospace' },
  removeBtn: { padding: 6 },
  emptyCard: {
    alignItems: 'center', padding: 32, gap: 10, borderRadius: 12,
    borderWidth: 1, borderStyle: 'dashed', marginTop: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: '500' },
  emptyDesc: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  emptyBtnWrap: {
    marginTop: 4, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
    backgroundColor: 'rgba(201,168,76,0.15)',
  },
  emptyBtnText: { color: ACCENT, fontSize: 13, fontWeight: '600' },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 24, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  modalBody: { flex: 1, padding: 20 },
  modalStepLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, marginBottom: 8,
  },
  typeIconBox: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  typeIcon: { fontSize: 16 },
  typeContent: { flex: 1 },
  typeLabel: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  typeDomain: { fontSize: 12 },
  domainChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, marginBottom: 16, alignSelf: 'flex-start',
  },
  domainChipText: { fontSize: 13, fontWeight: '600' },
  labelInput: {
    borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 16,
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: 'rgba(201,168,76,0.15)', borderRadius: 10,
    padding: 14, alignItems: 'center', marginBottom: 12,
  },
  submitBtnText: { color: ACCENT, fontSize: 15, fontWeight: '600' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  backBtnText: { fontSize: 14 },
});
