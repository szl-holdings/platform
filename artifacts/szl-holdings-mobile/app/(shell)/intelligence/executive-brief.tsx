import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback, useRef, useState } from 'react';
import { SpeechSpecialist } from '@szl-holdings/speech-specialist';
import { ExpoSpeechTTSAdapter } from '@/lib/expo-speech-tts-adapter';
import {
  ActivityIndicator,
  Linking,
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
import { apiFetch, getApiBase } from '@/lib/apiClient';
import {
  ENDPOINTS as BRIEF_ENDPOINTS,
  buildPulseWebUrl,
  confidenceColor,
  confidenceLabel,
  filterAlertsBySeverity,
  healthColor,
  riskColor,
} from './executive-brief.logic';

const ACCENT = '#c9a84c';

interface DomainSnapshot {
  domain: string;
  entityCount: number;
  activeCount: number;
  edgeCount: number;
  avgConfidence: number;
  topEntityTypes: Array<{ type: string; count: number }>;
  staleFraction: number;
  healthScore: number;
  summary: string;
}

interface ExecutiveBrief {
  generatedAt: string;
  totalEntities: number;
  totalEdges: number;
  crossDomainLinks: number;
  overallHealthScore: number;
  domains: DomainSnapshot[];
  highlights: string[];
  alerts: Array<{ domain: string; message: string; severity: 'info' | 'warning' | 'critical' }>;
}

interface PulseBrief {
  id: string;
  date: string;
  edition: string;
  classification: string;
  overallRisk: string;
  overallConfidence: number;
  headline: string;
  leadSentence: string;
  sections: Array<{
    id: string;
    title: string;
    agentName: string;
    confidence: number;
    riskLevel: string;
    keyJudgment: string;
  }>;
  recommendedActions: Array<{
    action: string;
    priority: string;
    owner: string;
    dueBy: string;
  }>;
}

type BriefMode = 'daily' | 'weekly';

const DOMAIN_META: Record<string, { label: string; icon: string; color: string }> = {
  vessels: { label: 'SEXTANT', icon: '⚓', color: '#4d8fcc' },
  aegis: { label: 'PARAGON', icon: '⬡', color: '#ef4444' },
  terra: { label: 'DOMAINE', icon: '⬢', color: '#22c55e' },
  lyte: { label: 'KORA', icon: '⚡', color: '#f59e0b' },
  prism: { label: 'PRISM', icon: '⚖', color: '#a855f7' },
  imperium: { label: 'Imperium', icon: '⬟', color: '#8b5cf6' },
  'carlota-jo': { label: 'Carlota', icon: '◇', color: '#ec4899' },
  platform: { label: 'Platform', icon: '◈', color: '#6b7280' },
};

function DomainCard({
  domain,
  colors,
}: {
  domain: DomainSnapshot;
  colors: ReturnType<typeof useColors>;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = DOMAIN_META[domain.domain] ?? { label: domain.domain, icon: '◆', color: '#6b7280' };
  const hColor = healthColor(domain.healthScore);

  return (
    <TouchableOpacity
      onPress={() => setExpanded((v) => !v)}
      style={[styles.domainCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.85}
    >
      <View style={styles.domainCardHeader}>
        <View
          style={[
            styles.domainIcon,
            { backgroundColor: `${meta.color}18`, borderColor: `${meta.color}35` },
          ]}
        >
          <Text style={styles.domainIconText}>{meta.icon}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={styles.domainCardMeta}>
            <Text style={[styles.domainLabel, { color: meta.color }]}>{meta.label}</Text>
            <View
              style={[
                styles.healthChip,
                { backgroundColor: `${hColor}18`, borderColor: `${hColor}35` },
              ]}
            >
              <Text style={[styles.healthChipText, { color: hColor }]}>
                {Math.round(domain.healthScore * 100)}%
              </Text>
            </View>
            {domain.staleFraction > 0.3 && (
              <View
                style={[
                  styles.healthChip,
                  { backgroundColor: '#f59e0b18', borderColor: '#f59e0b35' },
                ]}
              >
                <Text style={[styles.healthChipText, { color: '#f59e0b' }]}>
                  {Math.round(domain.staleFraction * 100)}% stale
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[styles.domainSummary, { color: colors.foreground }]}
            numberOfLines={expanded ? undefined : 2}
          >
            {domain.summary}
          </Text>
        </View>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.mutedForeground}
        />
      </View>

      {expanded && (
        <View style={styles.domainCardBody}>
          <View style={styles.statsRow}>
            {[
              { label: 'Entities', value: domain.entityCount },
              { label: 'Active', value: domain.activeCount },
              { label: 'Edges', value: domain.edgeCount },
              { label: 'Confidence', value: `${Math.round(domain.avgConfidence * 100)}%` },
            ].map(({ label, value }) => (
              <View
                key={label}
                style={[
                  styles.statBox,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
              </View>
            ))}
          </View>
          {domain.topEntityTypes.length > 0 && (
            <View style={styles.typeRow}>
              {domain.topEntityTypes.slice(0, 4).map(({ type, count }) => (
                <View
                  key={type}
                  style={[
                    styles.typePill,
                    { backgroundColor: `${meta.color}12`, borderColor: `${meta.color}25` },
                  ]}
                >
                  <Text style={[styles.typePillText, { color: meta.color }]}>
                    {type} ({count})
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

interface FollowUp {
  id: number;
  sectionId: string;
  question: string;
  answer: string | null;
  status: 'pending' | 'answered';
  createdAt: string;
}

export default function ExecutiveBriefScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [mode, setMode] = useState<BriefMode>('daily');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [followUpText, setFollowUpText] = useState('');

  const specialistRef = useRef(
    new SpeechSpecialist({ tts: new ExpoSpeechTTSAdapter() }),
  );

  const handlePlayBrief = useCallback(
    (brief: ExecutiveBrief | undefined, pulse: PulseBrief | undefined) => {
      if (audioPlaying) {
        Speech.stop();
        setAudioPlaying(false);
        return;
      }

      let headline = 'Executive Briefing';
      let situation = '';
      const beliefs: string[] = [];
      const recommendations: string[] = [];

      if (pulse) {
        headline = pulse.headline;
        situation = pulse.leadSentence;
        pulse.sections.slice(0, 3).forEach((s, i) => {
          beliefs.push(`${i + 1}. ${s.title}: ${s.keyJudgment}`);
        });
        pulse.recommendedActions.slice(0, 2).forEach((a, i) => {
          recommendations.push(`${i + 1}. ${a.action}`);
        });
      } else if (brief) {
        headline = `Platform health at ${Math.round(brief.overallHealthScore * 100)} percent.`;
        situation = brief.highlights.slice(0, 3).join(' ');
      }

      setAudioPlaying(true);
      specialistRef.current
        .renderBriefing({
          briefId: `cortex-${Date.now()}`,
          domain: 'cortex',
          headline,
          situation,
          beliefs,
          recommendations,
          locale: 'en-US',
          voice: { voiceId: 'executive-neutral-v1', locale: 'en-US', style: 'authoritative', speakingRate: 0.9 },
        })
        .then(() => setAudioPlaying(false))
        .catch(() => setAudioPlaying(false));
    },
    [audioPlaying],
  );

  const briefingQuery = useQuery<ExecutiveBrief>({
    queryKey: ['exec-brief-cross-domain'],
    queryFn: () => apiFetch<ExecutiveBrief>(BRIEF_ENDPOINTS.briefing),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  const pulseQuery = useQuery<{
    briefing: PulseBrief;
    personalized: boolean;
    watchedDomains: string[];
    watchedEntityUris: string[];
    filteredSectionCount?: number;
    totalSectionCount?: number;
  }>({
    queryKey: ['exec-brief-pulse'],
    queryFn: () => apiFetch(BRIEF_ENDPOINTS.pulseToday),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const brief = briefingQuery.data;
  const pulse = pulseQuery.data?.briefing;
  const isPersonalized = pulseQuery.data?.personalized ?? false;
  const watchedDomains = pulseQuery.data?.watchedDomains ?? [];

  const followUpsQuery = useQuery<{ followUps: FollowUp[] }>({
    queryKey: ['pulse-follow-ups', pulse?.id],
    queryFn: () => apiFetch(`/api/pulse/follow-ups/${pulse!.id}`),
    enabled: !!pulse?.id,
    refetchInterval: (data) =>
      data?.state?.data?.followUps?.some((f: FollowUp) => f.status === 'pending') ? 3000 : false,
  });

  const askFollowUpMutation = useMutation({
    mutationFn: (input: { briefingId: string; sectionId: string; question: string }) =>
      apiFetch('/api/pulse/follow-ups', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pulse-follow-ups', pulse?.id] });
      setFollowUpText('');
    },
  });

  const handleAskFollowUp = () => {
    if (!followUpText.trim() || !pulse?.id || !activeSectionId) return;
    askFollowUpMutation.mutate({
      briefingId: pulse.id,
      sectionId: activeSectionId,
      question: followUpText.trim(),
    });
  };

  const handleRefresh = () => {
    briefingQuery.refetch();
    pulseQuery.refetch();
  };

  const isRefetching = briefingQuery.isRefetching || pulseQuery.isRefetching;
  const isLoading = briefingQuery.isLoading && pulseQuery.isLoading;

  const alertsByLevel = brief?.alerts ?? [];
  const criticalAlerts = filterAlertsBySeverity(alertsByLevel, 'critical');
  const warningAlerts = filterAlertsBySeverity(alertsByLevel, 'warning');
  const pulseWebUrl = buildPulseWebUrl(getApiBase());

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerRow}>
            <View style={styles.liveIndicator} />
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Executive Brief</Text>
          </View>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Narrative engine · Constellation snapshot
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => handlePlayBrief(brief, pulse)}
            style={[styles.audioBtn, audioPlaying && { opacity: 0.75 }]}
          >
            <Feather
              name={audioPlaying ? 'square' : 'volume-2'}
              size={15}
              color={audioPlaying ? ACCENT : colors.mutedForeground}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
            <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.modeBar, { borderBottomColor: colors.border }]}>
        {(['daily', 'weekly'] as BriefMode[]).map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => setMode(m)}
            style={[
              styles.modeChip,
              mode === m
                ? { backgroundColor: `${ACCENT}18`, borderColor: `${ACCENT}50` }
                : { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text
              style={[styles.modeChipText, { color: mode === m ? ACCENT : colors.mutedForeground }]}
            >
              {m === 'daily' ? 'Today' : 'Weekly'}
            </Text>
          </TouchableOpacity>
        ))}
        {isPersonalized && (
          <View style={[styles.personalizedChip, { borderColor: `${ACCENT}35`, backgroundColor: `${ACCENT}10` }]}>
            <Feather name="user-check" size={10} color={ACCENT} />
            <Text style={[styles.personalizedChipText, { color: ACCENT }]}>
              {watchedDomains.length} watched
            </Text>
          </View>
        )}
        <TouchableOpacity
          onPress={() => router.push('/(shell)/intelligence/watchlist' as never)}
          style={[styles.openWebBtn, { borderColor: `${ACCENT}40`, backgroundColor: `${ACCENT}08` }]}
        >
          <Feather name="bookmark" size={11} color={ACCENT} />
          <Text style={[styles.openWebBtnText, { color: ACCENT }]}>Watchlist</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            Linking.openURL(pulseWebUrl);
          }}
          style={[styles.openWebBtn, { borderColor: colors.border }]}
        >
          <Feather name="external-link" size={11} color={colors.mutedForeground} />
          <Text style={[styles.openWebBtnText, { color: colors.mutedForeground }]}>Full Brief</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={ACCENT} />
        }
      >
        {isLoading ? (
          <ActivityIndicator color={ACCENT} style={{ marginTop: 32 }} />
        ) : (
          <>
            {pulse && mode === 'daily' && (
              <>
                <View
                  style={[
                    styles.classifBanner,
                    { borderColor: `${ACCENT}30`, backgroundColor: `${ACCENT}08` },
                  ]}
                >
                  <Feather name="lock" size={10} color={`${ACCENT}80`} />
                  <Text style={[styles.classifText, { color: `${ACCENT}80` }]}>
                    {pulse.classification}
                  </Text>
                  <Text style={[styles.classifDate, { color: colors.mutedForeground }]}>
                    {pulse.date} · {pulse.edition}
                  </Text>
                </View>

                <View
                  style={[
                    styles.riskBanner,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View
                    style={[styles.riskDot, { backgroundColor: riskColor(pulse.overallRisk) }]}
                  />
                  <Text style={[styles.riskLabel, { color: colors.mutedForeground }]}>
                    OVERALL RISK
                  </Text>
                  <Text style={[styles.riskValue, { color: riskColor(pulse.overallRisk) }]}>
                    {pulse.overallRisk}
                  </Text>
                  <View style={{ flex: 1 }} />
                  <View
                    style={[
                      styles.confChip,
                      {
                        backgroundColor: `${confidenceColor(pulse.overallConfidence)}18`,
                        borderColor: `${confidenceColor(pulse.overallConfidence)}35`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.confChipText,
                        { color: confidenceColor(pulse.overallConfidence) },
                      ]}
                    >
                      {confidenceLabel(pulse.overallConfidence)}{' '}
                      {Math.round(pulse.overallConfidence * 100)}%
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.headlineCard,
                    { backgroundColor: '#0a0a0a', borderColor: `${ACCENT}30` },
                  ]}
                >
                  <Text style={styles.headlineText}>{pulse.headline}</Text>
                  <Text style={styles.leadText}>{pulse.leadSentence}</Text>
                </View>

                {pulse.sections.length > 0 && (
                  <>
                    <Text style={[styles.sectionGroupLabel, { color: colors.mutedForeground }]}>
                      INTELLIGENCE SECTIONS
                    </Text>
                    {pulse.sections.map((sec) => {
                      const conf = confidenceColor(sec.confidence);
                      const isActive = activeSectionId === sec.id;
                      const sectionFollowUps = (followUpsQuery.data?.followUps ?? []).filter(
                        (f) => f.sectionId === sec.id,
                      );
                      return (
                        <View
                          key={sec.id}
                          style={[
                            styles.sectionCard,
                            { backgroundColor: colors.card, borderColor: isActive ? `${ACCENT}50` : colors.border },
                          ]}
                        >
                          <View style={{ flex: 1 }}>
                            <View style={styles.sectionMeta}>
                              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                                {sec.title}
                              </Text>
                              <View
                                style={[
                                  styles.confChip,
                                  { backgroundColor: `${conf}18`, borderColor: `${conf}35` },
                                ]}
                              >
                                <Text style={[styles.confChipText, { color: conf }]}>
                                  {confidenceLabel(sec.confidence)}{' '}
                                  {Math.round(sec.confidence * 100)}%
                                </Text>
                              </View>
                            </View>
                            <Text style={[styles.agentName, { color: colors.mutedForeground }]}>
                              {sec.agentName}
                            </Text>
                            <Text
                              style={[styles.keyJudgment, { color: colors.foreground }]}
                              numberOfLines={isActive ? undefined : 3}
                            >
                              {sec.keyJudgment}
                            </Text>
                            {sectionFollowUps.map((fu) => (
                              <View
                                key={fu.id}
                                style={[
                                  styles.followUpBubble,
                                  { backgroundColor: `${ACCENT}08`, borderColor: `${ACCENT}20` },
                                ]}
                              >
                                <Text style={[styles.followUpQ, { color: ACCENT }]}>
                                  Q: {fu.question}
                                </Text>
                                {fu.status === 'pending' ? (
                                  <ActivityIndicator size="small" color={ACCENT} style={{ marginTop: 4 }} />
                                ) : (
                                  <Text style={[styles.followUpA, { color: colors.foreground }]}>
                                    {fu.answer}
                                  </Text>
                                )}
                              </View>
                            ))}
                            {isActive && (
                              <View style={[styles.followUpInput, { borderColor: `${ACCENT}30` }]}>
                                <TextInput
                                  style={[styles.followUpTextInput, { color: colors.foreground }]}
                                  placeholder="Ask a follow-up question…"
                                  placeholderTextColor={colors.mutedForeground}
                                  value={followUpText}
                                  onChangeText={setFollowUpText}
                                  multiline
                                  returnKeyType="send"
                                  autoFocus
                                />
                                <TouchableOpacity
                                  onPress={handleAskFollowUp}
                                  disabled={!followUpText.trim() || askFollowUpMutation.isPending}
                                  style={[styles.followUpSendBtn, { opacity: followUpText.trim() ? 1 : 0.4 }]}
                                >
                                  <Feather name="send" size={14} color={ACCENT} />
                                </TouchableOpacity>
                              </View>
                            )}
                            <TouchableOpacity
                              onPress={() => {
                                setActiveSectionId(isActive ? null : sec.id);
                                if (!isActive) setFollowUpText('');
                              }}
                              style={styles.askBtn}
                            >
                              <Feather name={isActive ? 'chevron-up' : 'message-circle'} size={12} color={ACCENT} />
                              <Text style={[styles.askBtnText, { color: ACCENT }]}>
                                {isActive ? 'Close' : `Ask${sectionFollowUps.length > 0 ? ` (${sectionFollowUps.length})` : ''}`}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </>
                )}

                {pulse.recommendedActions.length > 0 && (
                  <>
                    <Text
                      style={[
                        styles.sectionGroupLabel,
                        { color: colors.mutedForeground, marginTop: 16 },
                      ]}
                    >
                      RECOMMENDED ACTIONS
                    </Text>
                    {pulse.recommendedActions.map((a, i) => {
                      const pc = riskColor(a.priority);
                      return (
                        <View
                          key={i}
                          style={[
                            styles.actionCard,
                            { backgroundColor: colors.card, borderColor: colors.border },
                          ]}
                        >
                          <View
                            style={[
                              styles.prioBadge,
                              { backgroundColor: `${pc}18`, borderColor: `${pc}35` },
                            ]}
                          >
                            <Text style={[styles.prioText, { color: pc }]}>{a.priority}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.actionText, { color: colors.foreground }]}>
                              {a.action}
                            </Text>
                            <Text style={[styles.actionMeta, { color: colors.mutedForeground }]}>
                              {a.owner} · {a.dueBy}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </>
                )}
              </>
            )}

            {brief && (
              <>
                <Text
                  style={[
                    styles.sectionGroupLabel,
                    {
                      color: colors.mutedForeground,
                      marginTop: mode === 'daily' && pulse ? 20 : 0,
                    },
                  ]}
                >
                  {mode === 'daily' ? 'CONSTELLATION SNAPSHOT' : 'WEEKLY DOMAIN OVERVIEW'}
                </Text>

                <View
                  style={[
                    styles.overviewRow,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  {[
                    { label: 'Entities', value: brief.totalEntities },
                    { label: 'Edges', value: brief.totalEdges },
                    { label: 'Cross-Domain', value: brief.crossDomainLinks },
                    { label: 'Health', value: `${Math.round(brief.overallHealthScore * 100)}%` },
                  ].map(({ label, value }) => (
                    <View key={label} style={styles.overviewStat}>
                      <Text style={[styles.overviewStatValue, { color: colors.foreground }]}>
                        {value}
                      </Text>
                      <Text style={[styles.overviewStatLabel, { color: colors.mutedForeground }]}>
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>

                {criticalAlerts.length > 0 && (
                  <View
                    style={[
                      styles.alertBanner,
                      { backgroundColor: '#ef444412', borderColor: '#ef444435' },
                    ]}
                  >
                    <Feather name="alert-circle" size={14} color="#ef4444" />
                    <Text style={[styles.alertBannerText, { color: '#ef4444' }]}>
                      {criticalAlerts.length} critical alert{criticalAlerts.length !== 1 ? 's' : ''}{' '}
                      requiring attention
                    </Text>
                  </View>
                )}

                {warningAlerts.length > 0 && (
                  <View
                    style={[
                      styles.alertBanner,
                      { backgroundColor: '#f59e0b12', borderColor: '#f59e0b35' },
                    ]}
                  >
                    <Feather name="alert-triangle" size={14} color="#f59e0b" />
                    <Text style={[styles.alertBannerText, { color: '#f59e0b' }]}>
                      {warningAlerts.length} warning{warningAlerts.length !== 1 ? 's' : ''} across
                      domains
                    </Text>
                  </View>
                )}

                {brief.highlights.length > 0 && (
                  <>
                    <Text style={[styles.sectionGroupLabel, { color: colors.mutedForeground }]}>
                      HIGHLIGHTS
                    </Text>
                    {brief.highlights.map((h, i) => (
                      <View key={i} style={[styles.highlightRow, { borderColor: colors.border }]}>
                        <View style={[styles.highlightDot, { backgroundColor: ACCENT }]} />
                        <Text style={[styles.highlightText, { color: colors.foreground }]}>
                          {h}
                        </Text>
                      </View>
                    ))}
                  </>
                )}

                <Text style={[styles.sectionGroupLabel, { color: colors.mutedForeground }]}>
                  DOMAIN BREAKDOWN
                </Text>
                {brief.domains.map((d) => (
                  <DomainCard key={d.domain} domain={d} colors={colors} />
                ))}

                <Text style={[styles.generatedAt, { color: colors.mutedForeground }]}>
                  Snapshot generated {new Date(brief.generatedAt).toLocaleString()}
                </Text>
              </>
            )}

            {!brief && !pulse && (
              <View style={styles.empty}>
                <Feather name="file-text" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Brief unavailable
                </Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                  Pull to refresh or check connectivity
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveIndicator: { width: 7, height: 7, borderRadius: 4, backgroundColor: ACCENT },
  headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  audioBtn: { padding: 8 },
  refreshBtn: { padding: 8 },
  modeBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  modeChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  modeChipText: { fontSize: 12, fontWeight: '600' },
  openWebBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  openWebBtnText: { fontSize: 11 },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, gap: 10 },
  classifBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  classifText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  classifDate: { fontSize: 10, marginLeft: 'auto' },
  riskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  riskDot: { width: 8, height: 8, borderRadius: 4 },
  riskLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  riskValue: { fontSize: 14, fontWeight: '700' },
  confChip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
  confChipText: { fontSize: 10, fontWeight: '700' },
  headlineCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 16,
  },
  headlineText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e8edf8',
    lineHeight: 22,
    marginBottom: 8,
  },
  leadText: { fontSize: 13, color: '#9ca3af', lineHeight: 19 },
  sectionGroupLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginTop: 4 },
  sectionCard: { borderRadius: 8, borderWidth: 1, padding: 12 },
  sectionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', flex: 1, marginRight: 8 },
  agentName: { fontSize: 10, marginBottom: 5 },
  keyJudgment: { fontSize: 12, lineHeight: 17 },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  prioBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
  prioText: { fontSize: 10, fontWeight: '700' },
  actionText: { fontSize: 12, lineHeight: 17 },
  actionMeta: { fontSize: 10, marginTop: 2 },
  overviewRow: { flexDirection: 'row', padding: 12, borderRadius: 8, borderWidth: 1 },
  overviewStat: { flex: 1, alignItems: 'center' },
  overviewStatValue: { fontSize: 16, fontWeight: '700' },
  overviewStatLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.4, marginTop: 2 },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  alertBannerText: { fontSize: 12, fontWeight: '600', flex: 1 },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  highlightDot: { width: 5, height: 5, borderRadius: 3, marginTop: 7 },
  highlightText: { fontSize: 12, lineHeight: 18, flex: 1 },
  domainCard: { borderRadius: 10, borderWidth: 1, padding: 12 },
  domainCardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  domainIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 1,
  },
  domainIconText: { fontSize: 14 },
  domainCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  domainLabel: { fontSize: 12, fontWeight: '700' },
  healthChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  healthChipText: { fontSize: 10, fontWeight: '700' },
  domainSummary: { fontSize: 12, lineHeight: 17 },
  domainCardBody: { marginTop: 10, gap: 8 },
  statsRow: { flexDirection: 'row', gap: 6 },
  statBox: { flex: 1, borderRadius: 6, borderWidth: 1, padding: 8, alignItems: 'center' },
  statValue: { fontSize: 14, fontWeight: '700' },
  statLabel: { fontSize: 9, letterSpacing: 0.3, marginTop: 1 },
  typeRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  typePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  typePillText: { fontSize: 10 },
  generatedAt: { fontSize: 10, textAlign: 'center', marginTop: 8 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 15, fontWeight: '500' },
  emptySub: { fontSize: 12 },
  followUpBubble: {
    marginTop: 8, borderRadius: 8, borderWidth: 1, padding: 10, gap: 4,
  },
  followUpQ: { fontSize: 12, fontWeight: '600' },
  followUpA: { fontSize: 12, lineHeight: 17 },
  followUpInput: {
    flexDirection: 'row', alignItems: 'flex-end', marginTop: 10,
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, gap: 8,
  },
  followUpTextInput: { flex: 1, fontSize: 13, maxHeight: 80 },
  followUpSendBtn: { padding: 4 },
  askBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingVertical: 2 },
  askBtnText: { fontSize: 11, fontWeight: '600' },
  personalizedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1,
  },
  personalizedChipText: { fontSize: 10, fontWeight: '700' },
});
