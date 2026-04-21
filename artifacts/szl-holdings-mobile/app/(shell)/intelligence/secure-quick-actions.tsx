import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import type React from 'react';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { promptBiometric } from '@/context/BiometricLockContext';
import { TAB_BAR_HEIGHT } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { apiFetch } from '@/lib/apiClient';
import {
  type ActionTemplate,
  executeSecureActionFlow,
  ACTION_TEMPLATES as LOGIC_ACTION_TEMPLATES,
  RECENT_ACTIVITY_PATH,
} from './secure-quick-actions.logic';

const ACCENT = '#c9a84c';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface ActionRecord {
  id: number;
  title: string;
  resourceType: string;
  status: string;
  priority: string;
  actionClass: string;
  createdAt: string;
  expiresAt?: string;
}

const ACTION_TEMPLATES: ActionTemplate[] = LOGIC_ACTION_TEMPLATES;

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#6b7280',
};

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ActionTemplateCard({
  template,
  onPress,
}: {
  template: ActionTemplate;
  onPress: (t: ActionTemplate) => void;
}) {
  const prioColor = PRIORITY_COLORS[template.priority] ?? '#6b7280';

  return (
    <TouchableOpacity
      onPress={() => onPress(template)}
      style={[
        styles.templateCard,
        { borderColor: template.accentColor + '35', backgroundColor: template.accentColor + '08' },
      ]}
      activeOpacity={0.85}
    >
      <View
        style={[
          styles.templateIcon,
          {
            backgroundColor: template.accentColor + '18',
            borderColor: template.accentColor + '35',
          },
        ]}
      >
        <Feather name={template.icon as FeatherIconName} size={18} color={template.accentColor} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={styles.templateMeta}>
          <Text style={[styles.templateTitle, { color: '#e8edf8' }]}>{template.title}</Text>
          {template.requiresBiometric && (
            <View style={[styles.bioPill, { borderColor: '#6366f135' }]}>
              <Feather name="lock" size={9} color="#6366f1" />
              <Text style={[styles.bioPillText, { color: '#6366f1' }]}>BIOMETRIC</Text>
            </View>
          )}
        </View>
        <Text style={styles.templateDesc}>{template.description}</Text>
        <View style={styles.templateChips}>
          <View
            style={[
              styles.chip,
              { backgroundColor: prioColor + '18', borderColor: prioColor + '35' },
            ]}
          >
            <Text style={[styles.chipText, { color: prioColor }]}>{template.priority}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: '#1e243380', borderColor: '#2d374880' }]}>
            <Text style={[styles.chipText, { color: '#6b7280' }]}>{template.domain}</Text>
          </View>
        </View>
      </View>
      <Feather name="chevron-right" size={14} color="#4b5563" style={{ marginTop: 8 }} />
    </TouchableOpacity>
  );
}

function ActionRecordRow({
  record,
  colors,
}: {
  record: ActionRecord;
  colors: ReturnType<typeof useColors>;
}) {
  const prioColor = PRIORITY_COLORS[record.priority] ?? '#6b7280';
  const statusColor =
    record.status === 'pending'
      ? '#f59e0b'
      : record.status === 'approved'
        ? '#22c55e'
        : record.status === 'rejected'
          ? '#ef4444'
          : '#6b7280';

  return (
    <View style={[styles.recordRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.recordTitle, { color: colors.foreground }]} numberOfLines={1}>
          {record.title}
        </Text>
        <Text style={[styles.recordSub, { color: colors.mutedForeground }]}>
          {record.resourceType} · {record.actionClass} · {formatRelative(record.createdAt)}
        </Text>
      </View>
      <View style={styles.recordBadges}>
        <View
          style={[
            styles.chip,
            { backgroundColor: statusColor + '18', borderColor: statusColor + '35' },
          ]}
        >
          <Text style={[styles.chipText, { color: statusColor }]}>{record.status}</Text>
        </View>
        <View
          style={[
            styles.chip,
            { backgroundColor: prioColor + '12', borderColor: prioColor + '25' },
          ]}
        >
          <Text style={[styles.chipText, { color: prioColor }]}>{record.priority}</Text>
        </View>
      </View>
    </View>
  );
}

function ActionModal({
  template,
  visible,
  onClose,
  onSubmit,
  isPending,
}: {
  template: ActionTemplate | null;
  visible: boolean;
  onClose: () => void;
  onSubmit: (resourceId: string, description: string) => void;
  isPending: boolean;
}) {
  const [resourceId, setResourceId] = useState('');
  const [description, setDescription] = useState('');

  const reset = () => {
    setResourceId('');
    setDescription('');
    onClose();
  };

  const handleSubmit = () => {
    if (!resourceId.trim()) {
      Alert.alert(
        'Missing field',
        'Resource ID is required to scope this action through Guardian.',
      );
      return;
    }
    onSubmit(resourceId.trim(), description.trim());
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={reset}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: '#0d1220' }]}>
          <View style={styles.modalHandle} />
          {template && (
            <>
              <View style={styles.modalHeader}>
                <View
                  style={[
                    styles.templateIcon,
                    {
                      backgroundColor: template.accentColor + '18',
                      borderColor: template.accentColor + '35',
                    },
                  ]}
                >
                  <Feather
                    name={template.icon as FeatherIconName}
                    size={16}
                    color={template.accentColor}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.modalTitle}>{template.title}</Text>
                  <Text style={styles.modalSub}>{template.description}</Text>
                </View>
                <TouchableOpacity onPress={reset}>
                  <Feather name="x" size={18} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {template.requiresBiometric && (
                <View
                  style={[
                    styles.bioNotice,
                    { borderColor: '#6366f135', backgroundColor: '#6366f110' },
                  ]}
                >
                  <Feather name="lock" size={12} color="#6366f1" />
                  <Text style={[styles.bioNoticeText, { color: '#6366f1' }]}>
                    Biometric confirmation required. This action will be recorded in the guardian
                    audit ledger.
                  </Text>
                </View>
              )}

              <Text style={styles.fieldLabel}>RESOURCE ID</Text>
              <TextInput
                value={resourceId}
                onChangeText={setResourceId}
                placeholder={`${template.resourceType} identifier...`}
                placeholderTextColor="#4b5563"
                style={styles.input}
              />

              <Text style={styles.fieldLabel}>DESCRIPTION / JUSTIFICATION</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Reason for this action..."
                placeholderTextColor="#4b5563"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={[styles.input, { minHeight: 70 }]}
              />

              <View
                style={[
                  styles.rollbackNotice,
                  { borderColor: '#f59e0b25', backgroundColor: '#f59e0b08' },
                ]}
              >
                <Feather name="rotate-ccw" size={11} color="#f59e0b" />
                <Text style={[styles.rollbackText, { color: '#f59e0b' }]}>
                  A rollback point will be recorded before this action executes.
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isPending}
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: template.accentColor + '18',
                    borderColor: template.accentColor + '50',
                  },
                ]}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color={template.accentColor} />
                ) : (
                  <>
                    <Feather name="shield" size={14} color={template.accentColor} />
                    <Text style={[styles.submitBtnText, { color: template.accentColor }]}>
                      {template.requiresBiometric
                        ? 'Authenticate & Execute'
                        : 'Execute via Guardian'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function SecureQuickActionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [activeTemplate, setActiveTemplate] = useState<ActionTemplate | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const recentActionsQuery = useQuery<{ data: ActionRecord[] } | ActionRecord[]>({
    queryKey: ['secure-quick-actions-recent'],
    queryFn: () => apiFetch<{ data: ActionRecord[] } | ActionRecord[]>(RECENT_ACTIVITY_PATH),
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const normalizeRecords = (
    raw: { data: ActionRecord[] } | ActionRecord[] | undefined,
  ): ActionRecord[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return (raw as { data: ActionRecord[] }).data ?? [];
  };

  const recentActions = normalizeRecords(recentActionsQuery.data).slice(0, 8);

  const executeActionMutation = useMutation({
    mutationFn: async ({
      template,
      resourceId,
      description,
    }: {
      template: ActionTemplate;
      resourceId: string;
      description: string;
    }) => {
      return executeSecureActionFlow(
        template,
        resourceId,
        description,
        promptBiometric,
        (path, init) => apiFetch(path, init),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['secure-quick-actions-recent'] });
      qc.invalidateQueries({ queryKey: ['cognitive-approvals'] });
      setModalVisible(false);
      setActiveTemplate(null);
      Alert.alert(
        'Action Queued',
        'Your action has been submitted through Guardian with a rollback point recorded. It will appear in the Approval Inbox pending execution.',
      );
    },
    onError: (err: Error) => {
      if (err.message.includes('cancelled') || err.message.includes('Biometric')) {
        return;
      }
      Alert.alert('Action Failed', 'Failed to submit action through Guardian. Please try again.');
    },
  });

  const handleTemplatePress = (template: ActionTemplate) => {
    setActiveTemplate(template);
    setModalVisible(true);
  };

  const handleActionSubmit = (resourceId: string, description: string) => {
    if (!activeTemplate) return;
    executeActionMutation.mutate({ template: activeTemplate, resourceId, description });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Secure Quick Actions
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Guardian-scoped · Rollback protected
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={recentActionsQuery.isRefetching}
            onRefresh={() => recentActionsQuery.refetch()}
            tintColor={ACCENT}
          />
        }
      >
        <View
          style={[
            styles.guardianBanner,
            { borderColor: ACCENT + '35', backgroundColor: ACCENT + '08' },
          ]}
        >
          <Feather name="shield" size={14} color={ACCENT} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.guardianBannerTitle, { color: ACCENT }]}>
              Guardian Policy Layer Active
            </Text>
            <Text style={styles.guardianBannerSub}>
              All actions are scoped, audited, and protected by rollback points before execution.
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          AVAILABLE ACTIONS
        </Text>
        {ACTION_TEMPLATES.map((template) => (
          <ActionTemplateCard key={template.id} template={template} onPress={handleTemplatePress} />
        ))}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 6 }]}>
          RECENT ACTIVITY
        </Text>
        {recentActionsQuery.isLoading ? (
          <ActivityIndicator color={ACCENT} style={{ marginTop: 16 }} />
        ) : recentActions.length === 0 ? (
          <View
            style={[
              styles.emptyRecent,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.emptyRecentText, { color: colors.mutedForeground }]}>
              No recent actions
            </Text>
          </View>
        ) : (
          recentActions.map((record) => (
            <ActionRecordRow key={record.id} record={record} colors={colors} />
          ))
        )}

        <TouchableOpacity
          onPress={() => router.navigate('/(shell)/intelligence/approval-inbox' as '/')}
          style={[
            styles.viewInboxBtn,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <Feather name="inbox" size={14} color={ACCENT} />
          <Text style={[styles.viewInboxText, { color: ACCENT }]}>View Full Approval Inbox</Text>
          <Feather name="chevron-right" size={14} color={ACCENT} />
        </TouchableOpacity>
      </ScrollView>

      <ActionModal
        key={activeTemplate?.id ?? 'empty'}
        template={activeTemplate}
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setActiveTemplate(null);
        }}
        onSubmit={handleActionSubmit}
        isPending={executeActionMutation.isPending}
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
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: 10, padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, marginTop: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, gap: 10 },
  guardianBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  guardianBannerTitle: { fontSize: 12, fontWeight: '700' },
  guardianBannerSub: { fontSize: 11, color: '#9ca3af', marginTop: 2, lineHeight: 15 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
  },
  templateIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  templateMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  templateTitle: { fontSize: 13, fontWeight: '700', flex: 1 },
  bioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  bioPillText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  templateDesc: { fontSize: 11, color: '#6b7280', lineHeight: 16, marginBottom: 7 },
  templateChips: { flexDirection: 'row', gap: 6 },
  chip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  chipText: { fontSize: 10, fontWeight: '600' },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  recordTitle: { fontSize: 12, fontWeight: '600' },
  recordSub: { fontSize: 10, marginTop: 2 },
  recordBadges: { flexDirection: 'row', gap: 5 },
  emptyRecent: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyRecentText: { fontSize: 12 },
  viewInboxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  viewInboxText: { fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: '#1e2433',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2d3748',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  modalTitle: { fontSize: 15, fontWeight: '700', color: '#e8edf8' },
  modalSub: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  bioNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
  },
  bioNoticeText: { fontSize: 11, lineHeight: 16, flex: 1 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#1e2433',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#e8edf8',
    fontSize: 13,
    marginBottom: 14,
  },
  rollbackNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  rollbackText: { fontSize: 11, lineHeight: 16, flex: 1 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
  },
  submitBtnText: { fontSize: 14, fontWeight: '700' },
});
