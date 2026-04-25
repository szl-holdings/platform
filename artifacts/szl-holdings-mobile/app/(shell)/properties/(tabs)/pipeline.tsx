import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : '/api';

interface Lead {
  id: string;
  name: string;
  address: string;
  stage: string;
  value: number;
  lastContact: string;
  nextAction: string;
  priority: string;
  score: number;
}

const STAGES = ['All', 'new', 'contacted', 'analyzing', 'negotiating', 'closed'];
const STAGE_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  analyzing: 'Analyzing',
  negotiating: 'Negotiating',
  closed: 'Closed',
};
const STAGE_COLORS: Record<string, string> = {
  new: '#b8943c',
  contacted: '#3a7ad4',
  analyzing: '#8b5cf6',
  negotiating: '#c0503a',
  closed: '#40856a',
};
const PRIORITY_COLORS: Record<string, string> = {
  high: '#c0503a',
  medium: '#b8943c',
  low: '#40856a',
};

function formatCurrency(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${Math.round(n / 1e3)}K`;
  return `$${n}`;
}

function LeadCard({ lead, onEdit }: { lead: Lead; onEdit: (lead: Lead) => void }) {
  const colors = useColors();
  const stageColor = STAGE_COLORS[lead.stage] ?? colors.gold;
  const priorityColor = PRIORITY_COLORS[lead.priority] ?? colors.gold;
  const scoreColor =
    lead.score >= 80 ? colors.emerald : lead.score >= 60 ? colors.amber : colors.rose;

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onEdit(lead);
      }}
      style={[
        styles.leadCard,
        { borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.02)' },
      ]}
    >
      <View style={styles.leadTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.leadName, { color: colors.cream }]}>{lead.name}</Text>
          <Text style={[styles.leadAddress, { color: colors.mutedForeground }]} numberOfLines={1}>
            {lead.address}
          </Text>
        </View>
        <View
          style={[
            styles.leadScore,
            { borderColor: `${scoreColor}40`, backgroundColor: `${scoreColor}10` },
          ]}
        >
          <Text style={[styles.leadScoreText, { color: scoreColor }]}>{lead.score}</Text>
        </View>
      </View>
      <View style={styles.leadMeta}>
        <View
          style={[
            styles.stageChip,
            { backgroundColor: `${stageColor}15`, borderColor: `${stageColor}30` },
          ]}
        >
          <Text style={[styles.stageText, { color: stageColor }]}>
            {STAGE_LABELS[lead.stage] ?? lead.stage}
          </Text>
        </View>
        <Text style={[styles.leadValue, { color: colors.gold }]}>{formatCurrency(lead.value)}</Text>
        <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
      </View>
      <View style={[styles.leadFooter, { borderTopColor: colors.border }]}>
        <View style={styles.leadFooterItem}>
          <Feather name="clock" size={10} color={colors.mutedForeground} />
          <Text style={[styles.leadFooterText, { color: colors.mutedForeground }]}>
            {lead.lastContact}
          </Text>
        </View>
        <View style={styles.leadFooterItem}>
          <Feather name="arrow-right" size={10} color={colors.gold} />
          <Text style={[styles.leadFooterText, { color: colors.goldDim }]} numberOfLines={1}>
            {lead.nextAction}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function PipelineTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ prefillAddress?: string }>();
  const [selectedStage, setSelectedStage] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editStage, setEditStage] = useState('');
  const [editNote, setEditNote] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newStage, setNewStage] = useState('new');
  const [newValue, setNewValue] = useState('');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 + 84 : 90;

  const qc = useQueryClient();

  useEffect(() => {
    if (params.prefillAddress) {
      setNewAddress(params.prefillAddress);
      setNewName('');
      setNewStage('new');
      setNewValue('');
      setShowAddModal(true);
    }
  }, [params.prefillAddress]);

  const {
    data,
    isError: leadsError,
    refetch,
  } = useQuery({
    queryKey: ['terra-pipeline'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/terra/crm/leads`);
      if (!res.ok) throw new Error(`Failed to fetch leads: ${res.status}`);
      const json = await res.json();
      return json.data ?? json;
    },
    retry: 1,
  });

  const rawApiLeads = data?.leads ?? [];
  const apiLeads: Lead[] = rawApiLeads.map(
    (r: {
      id?: string;
      externalId?: string;
      firstName?: string;
      lastName?: string;
      ownerName?: string;
      stage?: string;
      score?: number;
      source?: string;
      priority?: string;
      notes?: string;
      propertyAddress?: string;
      nextAction?: string;
      lastContact?: string;
      estimatedValue?: number;
    }) => ({
      id: r.id ?? r.externalId ?? String(Math.random()),
      name:
        (r.ownerName ?? (`${r.firstName ?? ''} ${r.lastName ?? ''}`).trim()) || 'Unknown Owner',
      address: r.propertyAddress ?? 'Property Address Unknown',
      stage: r.stage ?? 'new',
      value: r.estimatedValue ?? 0,
      lastContact: r.lastContact ?? 'N/A',
      nextAction: r.nextAction ?? 'Review lead',
      priority:
        r.score != null ? (r.score >= 75 ? 'high' : r.score >= 50 ? 'medium' : 'low') : 'medium',
      score: r.score ?? 50,
    }),
  );
  const allLeads = apiLeads;
  const displayLeads = allLeads.filter((l) => selectedStage === 'All' || l.stage === selectedStage);

  const totalValue = allLeads.reduce((acc, l) => acc + l.value, 0);

  const createLead = useMutation({
    mutationFn: async (payload: {
      name: string;
      address: string;
      stage: string;
      value: number;
    }) => {
      const res = await fetch(`${API_BASE}/terra/crm/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName: payload.name,
          propertyAddress: payload.address,
          stage: payload.stage,
          estimatedValue: payload.value,
          score: 50,
          priority: 'medium',
          source: 'ar-scanner',
          nextAction: 'Review property details',
          lastContact: new Date().toISOString().split('T')[0],
        }),
      });
      if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['terra-pipeline'] });
      setShowAddModal(false);
      setNewName('');
      setNewAddress('');
      setNewStage('new');
      setNewValue('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Alert.alert('Error', 'Could not add lead. Please try again.');
    },
  });

  const handleAddLead = () => {
    if (!newAddress.trim()) {
      Alert.alert('Missing info', 'Please enter a property address.');
      return;
    }
    createLead.mutate({
      name: newName.trim() || 'Unknown Owner',
      address: newAddress.trim(),
      stage: newStage,
      value: parseFloat(newValue.replace(/[^0-9.]/g, '')) || 0,
    });
  };

  const updateLead = useMutation({
    mutationFn: async ({ id, stage, note }: { id: string; stage: string; note: string }) => {
      const res = await fetch(`${API_BASE}/terra/crm/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage,
          notes: note || undefined,
          updatedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.ok;
    },
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: ['terra-pipeline'] });
      const prev = qc.getQueryData(['terra-pipeline']);
      qc.setQueryData(['terra-pipeline'], (old: any) => {
        if (!old) return old;
        const leads = old.leads ?? old;
        const updated = leads.map((l: any) => (l.id === id ? { ...l, stage } : l));
        return Array.isArray(old) ? updated : { ...old, leads: updated };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['terra-pipeline'], ctx.prev);
      Alert.alert('Error', 'Could not update pipeline stage. Please try again.');
    },
    onSuccess: () => {
      setShowEditModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['terra-pipeline'] }),
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const stageCounts = allLeads.reduce<Record<string, number>>((acc, l) => {
    acc[l.stage] = (acc[l.stage] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(184,148,60,0.06)', 'transparent']}
        style={[styles.headerGradient, { height: topPad + 120 }]}
      />

      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.goldSubtle }]}>Terra · CRM PIPELINE</Text>
          <Text style={[styles.title, { color: colors.cream }]}>Deals & Leads</Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setNewName('');
            setNewAddress('');
            setNewStage('new');
            setNewValue('');
            setShowAddModal(true);
          }}
          style={[
            styles.addBtn,
            { backgroundColor: colors.goldDim, borderColor: colors.goldBorder },
          ]}
        >
          <Feather name="plus" size={16} color={colors.gold} />
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        {[
          { label: 'TOTAL VALUE', value: formatCurrency(totalValue), color: colors.gold },
          {
            label: 'ACTIVE LEADS',
            value: String(allLeads.filter((l) => l.stage !== 'closed').length),
            color: colors.cream,
          },
          {
            label: 'HOT LEADS',
            value: String(allLeads.filter((l) => l.priority === 'high').length),
            color: colors.rose,
          },
        ].map((stat) => (
          <View
            key={stat.label}
            style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stageScroll}
      >
        {STAGES.map((s) => {
          const stageColor = STAGE_COLORS[s] ?? colors.gold;
          const isSelected = selectedStage === s;
          const count = s === 'All' ? allLeads.length : (stageCounts[s] ?? 0);
          return (
            <Pressable
              key={s}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedStage(s);
              }}
              style={[
                styles.stageChip,
                {
                  borderColor: isSelected ? stageColor : colors.border,
                  backgroundColor: isSelected ? `${stageColor}15` : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.stageText,
                  { color: isSelected ? stageColor : colors.mutedForeground },
                ]}
              >
                {s === 'All' ? 'All' : (STAGE_LABELS[s] ?? s)} {count > 0 ? `(${count})` : ''}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: bottomPad, paddingHorizontal: 20, paddingTop: 6 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.gold}
          />
        }
      >
        {displayLeads.map((l) => (
          <LeadCard
            key={l.id}
            lead={l}
            onEdit={(lead) => {
              setSelectedLead(lead);
              setEditStage(lead.stage);
              setEditNote('');
              setShowEditModal(true);
            }}
          />
        ))}
        {leadsError ? (
          <View style={styles.emptyState}>
            <Feather name="wifi-off" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Cannot reach server
            </Text>
            <Pressable onPress={() => refetch()} style={{ marginTop: 8 }}>
              <Text style={{ color: colors.gold, fontSize: 12, fontFamily: 'Inter_400Regular' }}>
                Tap to retry
              </Text>
            </Pressable>
          </View>
        ) : (
          displayLeads.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="activity" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No leads in this stage
              </Text>
            </View>
          )
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
          <Pressable
            style={[
              styles.modalSheet,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            ]}
            onPress={() => {}}
          >
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.cream }]}>Add to Pipeline</Text>
            <Text style={[styles.modalAddress, { color: colors.mutedForeground }]}>
              {newAddress ? `Scanned: ${newAddress}` : 'New lead from AR scanner'}
            </Text>

            <Text style={[styles.modalLabel, { color: colors.goldSubtle }]}>
              OWNER / CONTACT NAME
            </Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Owner or contact name"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.noteInput,
                {
                  color: colors.cream,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  minHeight: 44,
                },
              ]}
            />

            <Text style={[styles.modalLabel, { color: colors.goldSubtle }]}>PROPERTY ADDRESS</Text>
            <TextInput
              value={newAddress}
              onChangeText={setNewAddress}
              placeholder="Property address"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.noteInput,
                {
                  color: colors.cream,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  minHeight: 44,
                },
              ]}
            />

            <Text style={[styles.modalLabel, { color: colors.goldSubtle }]}>ESTIMATED VALUE</Text>
            <TextInput
              value={newValue}
              onChangeText={setNewValue}
              placeholder="e.g. 4500000"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              style={[
                styles.noteInput,
                {
                  color: colors.cream,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  minHeight: 44,
                },
              ]}
            />

            <Text style={[styles.modalLabel, { color: colors.goldSubtle }]}>INITIAL STAGE</Text>
            <View style={styles.stageOptions}>
              {['new', 'contacted', 'analyzing', 'negotiating'].map((s) => {
                const sColor = STAGE_COLORS[s] ?? colors.gold;
                const isActive = newStage === s;
                return (
                  <Pressable
                    key={s}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setNewStage(s);
                    }}
                    style={[
                      styles.stageOption,
                      {
                        borderColor: isActive ? sColor : colors.border,
                        backgroundColor: isActive ? `${sColor}15` : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stageOptionText,
                        { color: isActive ? sColor : colors.mutedForeground },
                      ]}
                    >
                      {STAGE_LABELS[s] ?? s}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={handleAddLead}
              disabled={createLead.isPending}
              style={[
                styles.saveLeadBtn,
                {
                  backgroundColor: colors.goldDim,
                  borderColor: colors.goldBorder,
                  opacity: createLead.isPending ? 0.6 : 1,
                },
              ]}
            >
              <Text style={[styles.saveLeadText, { color: colors.gold }]}>
                {createLead.isPending ? 'Adding...' : 'Add to Pipeline'}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowEditModal(false)}>
          <Pressable
            style={[
              styles.modalSheet,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            ]}
            onPress={() => {}}
          >
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.cream }]}>{selectedLead?.name}</Text>
            <Text style={[styles.modalAddress, { color: colors.mutedForeground }]}>
              {selectedLead?.address}
            </Text>

            <Text style={[styles.modalLabel, { color: colors.goldSubtle }]}>UPDATE STAGE</Text>
            <View style={styles.stageOptions}>
              {['new', 'contacted', 'analyzing', 'negotiating', 'closed'].map((s) => {
                const sColor = STAGE_COLORS[s] ?? colors.gold;
                const isActive = editStage === s;
                return (
                  <Pressable
                    key={s}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setEditStage(s);
                    }}
                    style={[
                      styles.stageOption,
                      {
                        borderColor: isActive ? sColor : colors.border,
                        backgroundColor: isActive ? `${sColor}15` : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stageOptionText,
                        { color: isActive ? sColor : colors.mutedForeground },
                      ]}
                    >
                      {STAGE_LABELS[s] ?? s}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.modalLabel, { color: colors.goldSubtle }]}>ADD NOTE</Text>
            <TextInput
              value={editNote}
              onChangeText={setEditNote}
              placeholder="Activity notes, next steps, context..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={[
                styles.noteInput,
                {
                  color: colors.cream,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
            />

            <Pressable
              onPress={() => {
                if (selectedLead) {
                  updateLead.mutate({ id: selectedLead.id, stage: editStage, note: editNote });
                }
              }}
              disabled={updateLead.isPending}
              style={[
                styles.saveLeadBtn,
                {
                  backgroundColor: colors.goldDim,
                  borderColor: colors.goldBorder,
                  opacity: updateLead.isPending ? 0.6 : 1,
                },
              ]}
            >
              <Text style={[styles.saveLeadText, { color: colors.gold }]}>
                {updateLead.isPending ? 'Saving...' : 'Save Update'}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  eyebrow: { fontSize: 9, fontFamily: 'Inter_500Medium', letterSpacing: 3, marginBottom: 4 },
  title: { fontSize: 22, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 10 },
  stat: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10 },
  statLabel: {
    fontSize: 7,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  stageScroll: { paddingHorizontal: 20, gap: 6, paddingBottom: 10 },
  stageChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, borderWidth: 1 },
  stageText: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  list: { flex: 1 },
  leadCard: { borderRadius: 12, borderWidth: 1, marginBottom: 8, overflow: 'hidden' },
  leadTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 14,
    paddingBottom: 8,
  },
  leadName: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 3 },
  leadAddress: { fontSize: 10, fontFamily: 'Inter_300Light' },
  leadScore: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadScoreText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  leadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  leadValue: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  leadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  leadFooterItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  leadFooterText: { fontSize: 10, fontFamily: 'Inter_300Light' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    borderRadius: 20,
    borderWidth: 1,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  modalAddress: { fontSize: 11, fontFamily: 'Inter_300Light', marginBottom: 16 },
  modalLabel: { fontSize: 9, fontFamily: 'Inter_500Medium', letterSpacing: 2, marginBottom: 8 },
  stageOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  stageOption: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  stageOptionText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  noteInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    fontSize: 13,
    fontFamily: 'Inter_300Light',
    lineHeight: 20,
    marginBottom: 16,
  },
  saveLeadBtn: { paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  saveLeadText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_300Light' },
});
