import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProvenanceChip } from '@/components/ProvenanceChip';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/context/AuthContext';
import { TAB_BAR_HEIGHT } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { apiFetch, getApiBase } from '@/lib/apiClient';

const PULSE_DAILY_NOTIF_KEY = 'pulse:daily-notif-id:v1';
async function ensureDailyBriefNotification(): Promise<void> {
  try {
    const existingId = await AsyncStorage.getItem(PULSE_DAILY_NOTIF_KEY);
    if (existingId) return;
    const perm = await Notifications.getPermissionsAsync();
    let status = perm.status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Pulse — today's brief is ready",
        body: 'Your 06:00 executive briefing from Counsel is available to read.',
        data: { route: '/intelligence/pulse' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: 6,
        minute: 0,
        repeats: true,
      },
    });
    await AsyncStorage.setItem(PULSE_DAILY_NOTIF_KEY, id);
  } catch {
    // notification scheduling is best-effort
  }
}

const PULSE_CACHE_KEY = 'pulse:today:v1';
async function cacheBrief(data: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(PULSE_CACHE_KEY, JSON.stringify({ cachedAt: Date.now(), data }));
  } catch {}
}
async function readCachedBrief(): Promise<unknown | null> {
  try {
    const raw = await AsyncStorage.getItem(PULSE_CACHE_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as { data: unknown }).data;
  } catch {
    return null;
  }
}

const ACCENT = '#c8a84b';

type Tab = 'brief' | 'library' | 'confidence' | 'dissent';

interface BriefSection {
  id: string;
  title: string;
  agentId: string;
  agentName: string;
  confidence: number;
  riskLevel: string;
  keyJudgment: string;
  lastUpdated: string;
}

interface RecommendedAction {
  action: string;
  priority: string;
  owner: string;
  dueBy: string;
}

interface TodaysBrief {
  id: string;
  date: string;
  edition: string;
  classification: string;
  overallRisk: string;
  overallConfidence: number;
  headline: string;
  leadSentence: string;
  sections: BriefSection[];
  recommendedActions: RecommendedAction[];
}

const AGENT_COLORS: Record<string, string> = {
  helmsman: '#5090e8',
  sentinel: '#e05050',
  terra: '#4eca8b',
  lexis: '#9b70e8',
  atlas: '#e08c40',
  beacon: '#40c8d8',
  alloy: '#c8a84b',
};

function confidenceInfo(score: number) {
  if (score >= 0.75) return { label: 'HC', color: '#4eca8b' };
  if (score >= 0.5) return { label: 'MC', color: '#c8a84b' };
  return { label: 'LC', color: '#e05050' };
}

function riskColor(risk: string) {
  switch (risk) {
    case 'CRITICAL':
      return '#e05050';
    case 'HIGH':
      return '#e08c40';
    case 'MEDIUM':
      return '#c8a84b';
    default:
      return '#4eca8b';
  }
}

function priorityColor(p: string) {
  return p === 'P0' ? '#e05050' : p === 'P1' ? '#e08c40' : '#c8a84b';
}

function SectionCard({
  section,
  expanded,
  onToggle,
}: {
  section: BriefSection;
  expanded: boolean;
  onToggle: () => void;
}) {
  const agentColor = AGENT_COLORS[section.agentId] ?? ACCENT;
  const conf = confidenceInfo(section.confidence);
  const risk = riskColor(section.riskLevel);

  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.85} style={styles.sectionCard}>
      <View style={[styles.sectionBar, { backgroundColor: agentColor }]} />
      <View style={{ flex: 1 }}>
        <View style={styles.sectionHeader}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text
              style={[styles.sectionJudgment, { color: expanded ? '#e8edf8' : '#a8b0c0' }]}
              numberOfLines={expanded ? undefined : 2}
            >
              {section.keyJudgment}
            </Text>
          </View>
          <View style={styles.sectionBadges}>
            <View
              style={[
                styles.chip,
                { backgroundColor: `${agentColor}18`, borderColor: `${agentColor}35` },
              ]}
            >
              <Text style={[styles.chipText, { color: agentColor }]}>{section.agentName}</Text>
            </View>
            <View
              style={[
                styles.chip,
                { backgroundColor: `${conf.color}15`, borderColor: `${conf.color}35` },
              ]}
            >
              <Text style={[styles.chipText, { color: conf.color }]}>
                {conf.label} {Math.round(section.confidence * 100)}%
              </Text>
            </View>
            <View style={[styles.chip, { backgroundColor: `${risk}15`, borderColor: `${risk}35` }]}>
              <Text style={[styles.chipText, { color: risk }]}>{section.riskLevel}</Text>
            </View>
            <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color="#546078" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function DissentForm({ briefId, onSuccess }: { briefId: string; onSuccess: () => void }) {
  const [sectionTitle, setSectionTitle] = useState('');
  const [dissentingView, setDissentingView] = useState('');
  const [basis, setBasis] = useState('');
  const [impactIfCorrect, setImpactIfCorrect] = useState('');
  const [showForm, setShowForm] = useState(false);
  const mutation = useMutation({
    mutationFn: (body: Record<string, string>) =>
      apiFetch('/api/pulse/dissents', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => {
      setShowForm(false);
      setSectionTitle('');
      setDissentingView('');
      setBasis('');
      setImpactIfCorrect('');
      onSuccess();
    },
  });

  const handleSubmit = () => {
    if (!sectionTitle.trim() || !dissentingView.trim() || !basis.trim()) {
      Alert.alert(
        'Missing fields',
        'Section Title, Dissenting View, and Evidentiary Basis are required.',
      );
      return;
    }
    mutation.mutate({
      briefingId: briefId,
      sectionTitle: sectionTitle.trim(),
      dissentingView: dissentingView.trim(),
      basis: basis.trim(),
      impactIfCorrect: impactIfCorrect.trim(),
    });
  };

  if (!showForm) {
    return (
      <TouchableOpacity style={styles.fileDissentBtn} onPress={() => setShowForm(true)}>
        <Feather name="alert-circle" size={14} color={ACCENT} />
        <Text style={styles.fileDissentBtnText}>File a Dissent</Text>
      </TouchableOpacity>
    );
  }

  const fields: {
    label: string;
    value: string;
    set: (v: string) => void;
    placeholder: string;
    multiline?: boolean;
    numberOfLines?: number;
  }[] = [
    {
      label: 'Section Title',
      value: sectionTitle,
      set: setSectionTitle,
      placeholder: 'e.g. Maritime Outlook',
    },
    {
      label: 'Dissenting View',
      value: dissentingView,
      set: setDissentingView,
      placeholder: 'Your alternative assessment...',
      multiline: true,
      numberOfLines: 4,
    },
    {
      label: 'Evidentiary Basis',
      value: basis,
      set: setBasis,
      placeholder: 'Supporting evidence...',
      multiline: true,
      numberOfLines: 4,
    },
    {
      label: 'Impact if Correct',
      value: impactIfCorrect,
      set: setImpactIfCorrect,
      placeholder: "What changes if you're right?",
      multiline: true,
      numberOfLines: 3,
    },
  ];

  return (
    <View style={styles.dissentForm}>
      <Text style={styles.dissentFormTitle}>File Analytical Dissent</Text>
      {fields.map((f) => (
        <View key={f.label} style={{ marginBottom: 12 }}>
          <Text style={styles.fieldLabel}>{f.label}</Text>
          <TextInput
            value={f.value}
            onChangeText={f.set}
            placeholder={f.placeholder}
            placeholderTextColor="#6b7280"
            multiline={f.multiline}
            numberOfLines={f.numberOfLines}
            textAlignVertical={f.multiline ? 'top' : 'center'}
            style={{
              borderWidth: 1,
              borderColor: 'rgba(26,32,53,0.8)',
              backgroundColor: 'rgba(0,0,0,0.25)',
              borderRadius: 6,
              paddingHorizontal: 10,
              paddingVertical: 8,
              color: '#fff',
              fontSize: 13,
              minHeight: f.multiline ? (f.numberOfLines ?? 3) * 20 : 36,
            }}
          />
        </View>
      ))}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          style={[styles.submitBtn, { flex: 1, opacity: mutation.isPending ? 0.6 : 1 }]}
          onPress={handleSubmit}
          disabled={mutation.isPending}
        >
          <Text style={styles.submitBtnText}>
            {mutation.isPending ? 'Filing...' : 'Submit Dissent'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cancelBtn, { flex: 1 }]}
          onPress={() => setShowForm(false)}
          disabled={mutation.isPending}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function buildBriefSpeechText(brief: TodaysBrief): string {
  const lines: string[] = [
    `Pulse Executive Briefing for ${brief.date}.`,
    `Overall risk level: ${brief.overallRisk}.`,
    `Overall confidence: ${Math.round(brief.overallConfidence * 100)} percent.`,
    brief.headline,
    brief.leadSentence,
  ];
  for (const sec of brief.sections) {
    lines.push(`${sec.agentName}: ${sec.keyJudgment}`);
  }
  if (brief.recommendedActions.length > 0) {
    lines.push('Recommended actions:');
    for (const action of brief.recommendedActions) {
      lines.push(`${action.priority}: ${action.action}, owned by ${action.owner}.`);
    }
  }
  return lines.join(' ');
}

export default function PulseScreen() {
  const insets = useSafeAreaInsets();
  const _colors = useColors();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('brief');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['executive']));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS !== 'web') {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            interruptionModeIOS: 1,
            interruptionModeAndroid: 1,
            shouldDuckAndroid: false,
          });
        }
      } catch {
        // best-effort — audio mode setup failure should not block UI
      }
    })();
    return () => {
      if (isSpeakingRef.current) {
        Speech.stop().catch(() => {});
      }
    };
  }, []);

  const playBriefing = useCallback(
    async (brief: TodaysBrief) => {
      if (isSpeakingRef.current) {
        await Speech.stop();
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        return;
      }
      const text = buildBriefSpeechText(brief);
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: Platform.OS === 'ios' ? 0.5 : 1.0,
        onDone: () => {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
        },
        onError: () => {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
        },
        onStopped: () => {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
        },
      });
    },
    [],
  );

  const {
    data: briefData,
    isLoading,
    refetch,
  } = useQuery<{ briefing: TodaysBrief }>({
    queryKey: ['pulse-today'],
    queryFn: async () => {
      try {
        const fresh = await apiFetch<{ briefing: TodaysBrief }>('/api/pulse/today');
        void cacheBrief(fresh);
        return fresh;
      } catch (err) {
        const cached = (await readCachedBrief()) as { briefing: TodaysBrief } | null;
        if (cached) return cached;
        throw err;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!briefData) {
        const cached = await readCachedBrief();
        if (!cancelled && cached) queryClient.setQueryData(['pulse-today'], cached);
      }
      void ensureDailyBriefNotification();
    })();
    return () => {
      cancelled = true;
    };
  }, [briefData, queryClient]);

  const { data: dissentData, refetch: refetchDissents } = useQuery<{ dissents: DissentRow[] }>({
    queryKey: ['pulse-dissents'],
    queryFn: () => apiFetch<{ dissents: DissentRow[] }>('/api/pulse/dissents'),
    retry: 1,
  });

  const { data: confData } = useQuery<{ history: Array<Record<string, number | string>> }>({
    queryKey: ['pulse-confidence'],
    queryFn: () =>
      apiFetch<{ history: Array<Record<string, number | string>> }>('/api/pulse/confidence'),
    retry: 1,
  });

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refetch(), refetchDissents()]);
    setIsRefreshing(false);
  }, [refetch, refetchDissents]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  interface DissentRow {
    id: string;
    sectionTitle: string;
    dissentingView: string;
    status: string;
    resolution?: string;
    filedBy: string;
    filedAt: string;
  }
  const brief: TodaysBrief | null = briefData?.briefing ?? null;
  const dissents: DissentRow[] = (dissentData?.dissents ?? []) as DissentRow[];

  const TABS: { key: Tab; label: string; icon: FeatherIconName }[] = [
    { key: 'brief', label: 'Today', icon: 'radio' },
    { key: 'confidence', label: 'Confidence', icon: 'bar-chart-2' },
    { key: 'dissent', label: 'Dissent', icon: 'alert-circle' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.headerRow}>
            <View style={styles.activeDot} />
            <Text style={styles.headerTitle}>Pulse</Text>
            <View style={styles.classifBadge}>
              <Feather name="shield" size={9} color="rgba(200,168,75,0.5)" />
              <Text style={styles.classifText}>EXEC-RESTRICTED</Text>
            </View>
          </View>
          <Text style={styles.headerSub}>AI Executive Briefing · Counsel</Text>
        </View>
        <View style={styles.headerActions}>
          {brief && (
            <TouchableOpacity
              onPress={() => playBriefing(brief)}
              style={[
                styles.audioBtn,
                isSpeaking
                  ? { backgroundColor: '#ef444420', borderColor: '#ef444460' }
                  : { backgroundColor: `${ACCENT}15`, borderColor: `${ACCENT}40` },
              ]}
            >
              <Feather
                name={isSpeaking ? 'stop-circle' : 'volume-2'}
                size={14}
                color={isSpeaking ? '#ef4444' : ACCENT}
              />
              <Text style={[styles.audioBtnText, { color: isSpeaking ? '#ef4444' : ACCENT }]}>
                {isSpeaking ? 'Stop' : 'Listen'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => {
              const envUrl = process.env.EXPO_PUBLIC_PULSE_URL;
              const apiBase = getApiBase();
              const target =
                envUrl && envUrl.length > 0
                  ? envUrl
                  : apiBase
                    ? `${apiBase.replace(/\/api\/?$/, '')}/pulse/`
                    : '/pulse/';
              Linking.openURL(target);
            }}
            style={styles.openBtn}
          >
            <Feather name="external-link" size={12} color="#546078" />
            <Text style={styles.openBtnText}>Open</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Audio Player Banner */}
      {isSpeaking && (
        <View style={styles.audioBanner}>
          <View style={styles.audioWave}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                style={[
                  styles.audioWaveBar,
                  { height: [8, 14, 10, 16, 8][i - 1], backgroundColor: ACCENT },
                ]}
              />
            ))}
          </View>
          <Text style={styles.audioBannerText}>Playing briefing…</Text>
          <ProvenanceChip status="live" label="TTS Audio" />
          <TouchableOpacity onPress={() => { Speech.stop(); setIsSpeaking(false); isSpeakingRef.current = false; }}>
            <Feather name="x" size={14} color="#546078" />
          </TouchableOpacity>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Feather name={t.icon} size={12} color={activeTab === t.key ? ACCENT : '#546078'} />
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 24 }]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={ACCENT} />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={ACCENT} />
            <Text style={styles.loadingText}>Loading briefing…</Text>
          </View>
        ) : !brief && activeTab === 'brief' ? (
          <View style={styles.emptyContainer}>
            <Feather name="alert-triangle" size={24} color="#e05050" />
            <Text style={styles.emptyText}>Unable to load briefing</Text>
            <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : activeTab === 'brief' && brief ? (
          <>
            {/* Classification banner */}
            <View style={styles.classifBanner}>
              <Feather name="lock" size={11} color="rgba(200,168,75,0.6)" />
              <Text style={styles.classifBannerText}>{brief.classification}</Text>
              <Text style={styles.classifBannerDate}>
                {brief.date} · {brief.edition}
              </Text>
            </View>

            {/* Overall risk */}
            <View style={styles.riskBanner}>
              <View style={[styles.riskDot, { backgroundColor: riskColor(brief.overallRisk) }]} />
              <Text style={styles.riskLabel}>OVERALL RISK:</Text>
              <Text style={[styles.riskValue, { color: riskColor(brief.overallRisk) }]}>
                {brief.overallRisk}
              </Text>
              <View style={{ flex: 1 }} />
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: `${confidenceInfo(brief.overallConfidence).color}15`,
                    borderColor: `${confidenceInfo(brief.overallConfidence).color}35`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: confidenceInfo(brief.overallConfidence).color },
                  ]}
                >
                  {confidenceInfo(brief.overallConfidence).label}{' '}
                  {Math.round(brief.overallConfidence * 100)}%
                </Text>
              </View>
            </View>

            {/* Headline */}
            <View style={styles.headlineCard}>
              <Text style={styles.headlineText}>{brief.headline}</Text>
              <Text style={styles.leadText}>{brief.leadSentence}</Text>
            </View>

            {/* Sections */}
            <Text style={styles.sectionGroupLabel}>Intelligence Sections</Text>
            {brief.sections.map((sec) => (
              <SectionCard
                key={sec.id}
                section={sec}
                expanded={expandedSections.has(sec.id)}
                onToggle={() => toggleSection(sec.id)}
              />
            ))}

            {/* Recommended Actions */}
            {brief.recommendedActions.length > 0 && (
              <>
                <Text style={[styles.sectionGroupLabel, { marginTop: 20 }]}>
                  Recommended Actions
                </Text>
                {brief.recommendedActions.map((a, i) => {
                  const pc = priorityColor(a.priority);
                  return (
                    <View key={i} style={styles.actionCard}>
                      <View
                        style={[
                          styles.priorityBadge,
                          { backgroundColor: `${pc}18`, borderColor: `${pc}35` },
                        ]}
                      >
                        <Text style={[styles.priorityText, { color: pc }]}>{a.priority}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.actionText}>{a.action}</Text>
                        <Text style={styles.actionMeta}>
                          {a.owner} · {a.dueBy}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </>
            )}

            {/* Dissent CTA */}
            <View style={{ marginTop: 24 }}>
              <DissentForm briefId={brief.id} onSuccess={refetchDissents} />
            </View>
          </>
        ) : activeTab === 'confidence' ? (
          <View>
            <Text style={styles.sectionGroupLabel}>7-Day Confidence Trends</Text>
            {confData?.history ? (
              confData.history.map((row: Record<string, number | string>, i: number) => (
                <View key={i} style={styles.confRow}>
                  <Text style={styles.confDate}>{row.date as string}</Text>
                  {['maritime', 'security', 'real_estate', 'legal', 'financial', 'platform'].map(
                    (domain) => {
                      const val = row[domain] as number;
                      const conf = confidenceInfo(val);
                      return (
                        <View
                          key={domain}
                          style={[
                            styles.confChip,
                            { backgroundColor: `${conf.color}12`, borderColor: `${conf.color}25` },
                          ]}
                        >
                          <Text style={[styles.confChipText, { color: conf.color }]}>
                            {Math.round(val * 100)}
                          </Text>
                        </View>
                      );
                    },
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Loading confidence data…</Text>
            )}
            <View style={styles.rubricCard}>
              <Text style={styles.rubricTitle}>Confidence Rubric</Text>
              {[
                {
                  label: 'HC ≥ 75%',
                  desc: 'High confidence: multiple independent sources, strong logical coherence',
                  color: '#4eca8b',
                },
                {
                  label: 'MC 50–74%',
                  desc: 'Moderate confidence: partial corroboration, some assumption risk',
                  color: '#c8a84b',
                },
                {
                  label: 'LC < 50%',
                  desc: 'Low confidence: sparse evidence, significant assumption burden',
                  color: '#e05050',
                },
              ].map((r) => (
                <View key={r.label} style={styles.rubricRow}>
                  <View
                    style={[
                      styles.rubricBadge,
                      { backgroundColor: `${r.color}15`, borderColor: `${r.color}35` },
                    ]}
                  >
                    <Text style={[styles.rubricBadgeText, { color: r.color }]}>{r.label}</Text>
                  </View>
                  <Text style={styles.rubricDesc}>{r.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : activeTab === 'dissent' ? (
          <View>
            <Text style={styles.sectionGroupLabel}>Dissent Channel</Text>
            {dissents.map((d) => (
              <View key={d.id} style={styles.dissentCard}>
                <View style={styles.dissentHeader}>
                  <Text style={styles.dissentSection}>{d.sectionTitle}</Text>
                  <View
                    style={[
                      styles.chip,
                      d.status === 'resolved'
                        ? { backgroundColor: '#4eca8b15', borderColor: '#4eca8b35' }
                        : { backgroundColor: '#c8a84b15', borderColor: '#c8a84b35' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: d.status === 'resolved' ? '#4eca8b' : '#c8a84b' },
                      ]}
                    >
                      {d.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.dissentView}>{d.dissentingView}</Text>
                {d.resolution && (
                  <View style={styles.resolutionBox}>
                    <Feather name="check-circle" size={11} color="#4eca8b" />
                    <Text style={styles.resolutionText}>{d.resolution}</Text>
                  </View>
                )}
                <Text style={styles.dissentMeta}>
                  {d.filedBy} · {new Date(d.filedAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
            {dissents.length === 0 && <Text style={styles.emptyText}>No dissents filed yet.</Text>}
            <View style={{ marginTop: 16 }}>
              <DissentForm briefId={brief?.id ?? 'brief-2026-04-16'} onSuccess={refetchDissents} />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060a14' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26,32,53,0.8)',
    backgroundColor: 'rgba(10,14,26,0.95)',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#e8edf8', letterSpacing: -0.3 },
  classifBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(200,168,75,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(200,168,75,0.2)',
  },
  classifText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(200,168,75,0.5)',
    letterSpacing: 0.8,
  },
  headerSub: { fontSize: 11, color: '#546078' },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(26,32,53,0.8)',
  },
  openBtnText: { fontSize: 11, color: '#546078' },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26,32,53,0.5)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(26,32,53,0.5)',
  },
  tabActive: { backgroundColor: 'rgba(200,168,75,0.1)', borderColor: 'rgba(200,168,75,0.3)' },
  tabText: { fontSize: 11, fontWeight: '600', color: '#546078' },
  tabTextActive: { color: ACCENT },
  content: { padding: 16 },
  loadingContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  loadingText: { fontSize: 13, color: '#546078' },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 13, color: '#546078', textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(200,168,75,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(200,168,75,0.3)',
  },
  retryBtnText: { fontSize: 12, fontWeight: '600', color: ACCENT },
  classifBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(200,168,75,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(200,168,75,0.15)',
  },
  classifBannerText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(200,168,75,0.6)',
    letterSpacing: 0.8,
    flex: 1,
  },
  classifBannerDate: { fontSize: 10, color: '#546078' },
  riskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(26,32,53,0.5)',
  },
  riskDot: { width: 6, height: 6, borderRadius: 3 },
  riskLabel: { fontSize: 10, fontWeight: '700', color: '#546078', letterSpacing: 0.5 },
  riskValue: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  headlineCard: {
    padding: 14,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(6,10,20,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(26,32,53,0.8)',
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
  },
  headlineText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e8edf8',
    lineHeight: 22,
    marginBottom: 8,
  },
  leadText: { fontSize: 13, color: '#8a96b0', lineHeight: 19 },
  sectionGroupLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#546078',
    marginBottom: 8,
  },
  sectionCard: {
    flexDirection: 'row',
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(13,18,32,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(26,32,53,0.6)',
  },
  sectionBar: { width: 3, flexShrink: 0 },
  sectionHeader: { flex: 1, flexDirection: 'row', padding: 12, flexWrap: 'wrap', gap: 6 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#546078',
    marginBottom: 4,
  },
  sectionJudgment: { fontSize: 13, lineHeight: 19 },
  sectionBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  chip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  chipText: { fontSize: 9, fontWeight: '700' },
  actionCard: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    padding: 10,
    marginBottom: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(200,168,75,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(26,32,53,0.4)',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    flexShrink: 0,
    marginTop: 2,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  actionText: { fontSize: 13, color: '#e8edf8', lineHeight: 18, marginBottom: 2 },
  actionMeta: { fontSize: 11, color: '#546078' },
  confRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  confDate: { fontSize: 11, color: '#546078', width: 42, flexShrink: 0 },
  confChip: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
    minWidth: 30,
    alignItems: 'center',
  },
  confChipText: { fontSize: 9, fontWeight: '700' },
  rubricCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(13,18,32,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(26,32,53,0.6)',
  },
  rubricTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8a96b0',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  rubricRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  rubricBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    flexShrink: 0,
  },
  rubricBadgeText: { fontSize: 10, fontWeight: '700' },
  rubricDesc: { flex: 1, fontSize: 12, color: '#8a96b0', lineHeight: 17 },
  dissentCard: {
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(13,18,32,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(26,32,53,0.6)',
  },
  dissentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dissentSection: { fontSize: 12, fontWeight: '700', color: ACCENT },
  dissentView: { fontSize: 13, color: '#d4d8e8', lineHeight: 19, marginBottom: 6 },
  dissentMeta: { fontSize: 10, color: '#394560' },
  resolutionBox: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    padding: 8,
    marginBottom: 8,
    borderRadius: 5,
    backgroundColor: 'rgba(78,202,139,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(78,202,139,0.2)',
  },
  resolutionText: { flex: 1, fontSize: 12, color: '#4eca8b', lineHeight: 17 },
  fileDissentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(200,168,75,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(200,168,75,0.25)',
  },
  fileDissentBtnText: { fontSize: 13, fontWeight: '600', color: ACCENT },
  dissentForm: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(13,18,32,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(200,168,75,0.25)',
  },
  dissentFormTitle: { fontSize: 14, fontWeight: '700', color: '#e8edf8', marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#8a96b0', marginBottom: 4 },
  fieldInput: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(26,32,53,0.8)',
    minHeight: 36,
  },
  fieldText: { fontSize: 13, color: '#e8edf8' },
  fieldPlaceholder: { color: '#394560' },
  submitBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(200,168,75,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(200,168,75,0.4)',
  },
  submitBtnText: { fontSize: 13, fontWeight: '700', color: ACCENT },
  cancelBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(26,32,53,0.6)',
  },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: '#546078' },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  audioBtnText: { fontSize: 11, fontWeight: '700' },
  audioBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(200,168,75,0.06)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200,168,75,0.12)',
  },
  audioWave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 20,
  },
  audioWaveBar: {
    width: 3,
    borderRadius: 2,
    opacity: 0.85,
  },
  audioBannerText: { flex: 1, fontSize: 11, color: '#8a96b0' },
});
