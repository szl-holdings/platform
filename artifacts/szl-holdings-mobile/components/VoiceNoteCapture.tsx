import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProvenanceChip } from '@/components/ProvenanceChip';
import { useColors } from '@/hooks/useColors';
import { apiFetch, getApiBase, getAuthToken } from '@/lib/apiClient';

const ACCENT = '#c9a84c';

interface TranscribeResult {
  id?: string | number;
  transcript: string;
  summary?: string;
  intent?: string;
  entityType?: string;
  entityDomain?: string;
  routedTo?: string;
  confidence?: number;
  provenance?: { source: string; timestamp: string };
}

const ENTITY_COLORS: Record<string, string> = {
  deal: '#22c55e',
  matter: '#8b5cf6',
  threat: '#ef4444',
  vessel: '#4d8fcc',
  property: '#f59e0b',
  task: '#3b82f6',
  default: ACCENT,
};

const ENTITY_ICONS: Record<string, React.ComponentProps<typeof Feather>['name']> = {
  deal: 'briefcase',
  matter: 'book',
  threat: 'alert-triangle',
  vessel: 'anchor',
  property: 'home',
  task: 'check-square',
  default: 'tag',
};

function PulseRing({ active }: { active: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;
  const anim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (active) {
      anim.current = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(scale, { toValue: 1.6, duration: 700, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
            Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
          ]),
        ]),
      );
      anim.current.start();
    } else {
      anim.current?.stop();
      scale.setValue(1);
      opacity.setValue(0.7);
    }
    return () => anim.current?.stop();
  }, [active]);

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        { borderColor: '#ef4444', transform: [{ scale }], opacity },
      ]}
    />
  );
}

interface VoiceNoteCaptureProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: (result: TranscribeResult) => void;
}

export function VoiceNoteCapture({ visible, onClose, onSaved }: VoiceNoteCaptureProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<'idle' | 'recording' | 'processing' | 'result'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<TranscribeResult | null>(null);
  const [textFallback, setTextFallback] = useState('');
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (!visible) {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {}).finally(() => {
          recordingRef.current = null;
          Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {});
        });
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setPhase('idle');
      setSeconds(0);
      setResult(null);
      setTextFallback('');
    }
  }, [visible]);

  useEffect(() => {
    if (phase === 'recording') {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setSeconds(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  async function startRecording() {
    if (isWeb) { setPhase('recording'); return; }
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Microphone permission required', 'Allow microphone access to capture voice notes.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setPhase('recording');
    } catch {
      Alert.alert('Recording error', 'Could not start recording. Please try again.');
    }
  }

  async function stopAndTranscribe() {
    setPhase('processing');
    try {
      if (!isWeb && recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        recordingRef.current = null;
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        if (uri) {
          const base = getApiBase() ?? '';
          const token = await getAuthToken();
          const formData = new FormData();
          formData.append('audio', {
            uri,
            name: `voice-note-${Date.now()}.m4a`,
            type: 'audio/m4a',
          } as unknown as Blob);
          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;
          const res = await fetch(`${base}/api/alloy/voice/transcribe`, {
            method: 'POST',
            headers,
            body: formData,
          });
          if (!res.ok) throw new Error(`Audio upload failed: HTTP ${res.status}`);
          const submitJson = await res.json() as { success?: boolean; data?: { id: string; status: string } };
          const noteId = submitJson?.data?.id;
          if (!noteId) throw new Error('No voice note ID returned from server');
          const resolved = await pollVoiceNote(noteId);
          setResult(resolved);
          onSaved?.(resolved);
          setPhase('result');
          return;
        }
      }
      const textInput = textFallback.trim() || 'Voice note captured';
      type TextApiResponse = {
        success?: boolean;
        data?: {
          id?: string;
          transcription?: string;
          intent?: string;
          summary?: string;
          actionItems?: string[];
          status?: string;
        };
      };
      const raw = await apiFetch<TextApiResponse>(
        '/api/alloy/voice/transcribe-text',
        {
          method: 'POST',
          body: JSON.stringify({ text: textInput }),
          headers: { 'Content-Type': 'application/json' },
        },
      );
      const d = raw?.data ?? {};
      const resolved: TranscribeResult = {
        id: d.id,
        transcript: d.transcription ?? textInput,
        intent: d.intent ?? 'note',
        entityType: d.intent ?? 'task',
        entityDomain: 'intelligence',
        routedTo: `Intelligence → ${capitalize(d.intent ?? 'Notes')}`,
        summary: d.summary,
        confidence: 0.85,
        provenance: { source: 'voice-capture-text', timestamp: new Date().toISOString() },
      };
      setResult(resolved);
      onSaved?.(resolved);
      setPhase('result');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transcription failed';
      Alert.alert('Could not process voice note', `${msg}\n\nPlease try again.`);
      setPhase('idle');
    }
  }

  async function pollVoiceNote(id: string, maxAttempts = 20, intervalMs = 1500): Promise<TranscribeResult> {
    type NoteRow = {
      id?: string;
      transcription?: string;
      detected_intent?: string;
      ai_summary?: string;
      converted_to?: string;
      status?: string;
    };
    type NoteApiResponse = { success?: boolean; data?: NoteRow };
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, intervalMs));
      const raw = await apiFetch<NoteApiResponse>(`/api/alloy/voice/notes/${id}`);
      const row = raw?.data ?? {};
      if (row.status === 'failed') throw new Error('Voice note transcription failed on server');
      if (row.status === 'completed') {
        return {
          id,
          transcript: row.transcription ?? '',
          intent: row.detected_intent ?? 'note',
          entityType: row.detected_intent ?? 'task',
          entityDomain: row.converted_to ?? 'intelligence',
          routedTo: `Intelligence → ${capitalize(row.detected_intent ?? 'Notes')}`,
          summary: row.ai_summary,
          confidence: 0.88,
          provenance: { source: 'voice-capture-audio', timestamp: new Date().toISOString() },
        };
      }
    }
    throw new Error('Voice note processing timed out');
  }

  function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
  }

  async function cancelRecording() {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {}
      recordingRef.current = null;
    }
    setPhase('idle');
    setSeconds(0);
  }

  const entityType = result?.entityType ?? 'default';
  const entityColor = ENTITY_COLORS[entityType] ?? ENTITY_COLORS.default;
  const entityIcon = ENTITY_ICONS[entityType] ?? ENTITY_ICONS.default;

  const fmtSeconds = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill}>
        <View style={[styles.overlay, { paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: `${ACCENT}30` }]}>
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Feather name="mic" size={16} color={ACCENT} />
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>Voice Note</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.subtext, { color: colors.mutedForeground }]}>
              Speak a note — it will be transcribed and routed to the right product
            </Text>

            {/* Recording UI */}
            {(phase === 'idle' || phase === 'recording') && (
              <View style={styles.recordArea}>
                {isWeb && phase === 'recording' && (
                  <TextInput
                    value={textFallback}
                    onChangeText={setTextFallback}
                    placeholder="Type your note here (web fallback)..."
                    placeholderTextColor={colors.mutedForeground}
                    multiline
                    style={[styles.textFallback, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                    autoFocus
                  />
                )}

                <View style={styles.micArea}>
                  {phase === 'recording' && <PulseRing active />}
                  <TouchableOpacity
                    onPress={phase === 'recording' ? stopAndTranscribe : startRecording}
                    style={[
                      styles.micButton,
                      phase === 'recording'
                        ? { backgroundColor: '#ef444430', borderColor: '#ef444460' }
                        : { backgroundColor: `${ACCENT}20`, borderColor: `${ACCENT}50` },
                    ]}
                  >
                    <Feather
                      name={phase === 'recording' ? 'square' : 'mic'}
                      size={28}
                      color={phase === 'recording' ? '#ef4444' : ACCENT}
                    />
                  </TouchableOpacity>
                </View>

                {phase === 'recording' && (
                  <View style={styles.recordingMeta}>
                    <View style={styles.recDot} />
                    <Text style={[styles.recTimer, { color: '#ef4444' }]}>{fmtSeconds(seconds)}</Text>
                  </View>
                )}

                {phase === 'recording' && (
                  <View style={styles.recordingActions}>
                    <TouchableOpacity onPress={cancelRecording} style={[styles.cancelBtn, { borderColor: colors.border }]}>
                      <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={stopAndTranscribe}
                      style={[styles.doneBtn, { backgroundColor: `${ACCENT}20`, borderColor: `${ACCENT}50` }]}
                    >
                      <Feather name="check" size={14} color={ACCENT} />
                      <Text style={[styles.doneBtnText, { color: ACCENT }]}>Done & Transcribe</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {phase === 'idle' && (
                  <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>
                    Tap to start recording
                  </Text>
                )}
              </View>
            )}

            {/* Processing */}
            {phase === 'processing' && (
              <View style={styles.processingArea}>
                <ActivityIndicator color={ACCENT} size="large" />
                <Text style={[styles.processingText, { color: colors.foreground }]}>
                  Transcribing & routing…
                </Text>
                <Text style={[styles.processingSubtext, { color: colors.mutedForeground }]}>
                  Matching to deal, matter, or threat ontology
                </Text>
              </View>
            )}

            {/* Result */}
            {phase === 'result' && result && (
              <View style={styles.resultArea}>
                {/* Transcript */}
                <View style={[styles.transcriptBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.transcriptLabel, { color: colors.mutedForeground }]}>TRANSCRIPT</Text>
                  <Text style={[styles.transcriptText, { color: colors.foreground }]}>{result.transcript}</Text>
                </View>

                {/* Routing */}
                <View style={[styles.routingCard, { backgroundColor: `${entityColor}10`, borderColor: `${entityColor}30` }]}>
                  <View style={styles.routingHeader}>
                    <View style={[styles.entityBadge, { backgroundColor: `${entityColor}20`, borderColor: `${entityColor}40` }]}>
                      <Feather name={entityIcon} size={12} color={entityColor} />
                      <Text style={[styles.entityLabel, { color: entityColor }]}>
                        {(result.entityType ?? 'Note').toUpperCase()}
                      </Text>
                    </View>
                    {result.confidence !== undefined && (
                      <Text style={[styles.confidence, { color: colors.mutedForeground }]}>
                        {Math.round(result.confidence * 100)}% confidence
                      </Text>
                    )}
                  </View>

                  {result.routedTo && (
                    <View style={styles.routedRow}>
                      <Feather name="arrow-right-circle" size={12} color={entityColor} />
                      <Text style={[styles.routedTo, { color: entityColor }]}>{result.routedTo}</Text>
                    </View>
                  )}

                  {result.intent && (
                    <Text style={[styles.intent, { color: colors.foreground }]}>
                      {result.intent}
                    </Text>
                  )}

                  {result.summary && (
                    <Text style={[styles.summary, { color: colors.mutedForeground }]}>
                      {result.summary}
                    </Text>
                  )}
                </View>

                {/* Provenance */}
                <View style={styles.provenanceRow}>
                  <ProvenanceChip
                    status="live"
                    label="Voice-captured"
                    lastUpdated={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  />
                  {result.provenance?.source && (
                    <View style={[styles.sourcePill, { borderColor: colors.border }]}>
                      <Feather name="cpu" size={9} color={colors.mutedForeground} />
                      <Text style={[styles.sourceText, { color: colors.mutedForeground }]}>
                        {result.provenance.source}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.resultActions}>
                  <TouchableOpacity
                    onPress={() => { setPhase('idle'); setResult(null); setTextFallback(''); }}
                    style={[styles.recordAgainBtn, { borderColor: colors.border }]}
                  >
                    <Feather name="mic" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.recordAgainText, { color: colors.mutedForeground }]}>Record Another</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={onClose}
                    style={[styles.doneBtn, { backgroundColor: `${ACCENT}20`, borderColor: `${ACCENT}50`, flex: 1 }]}
                  >
                    <Feather name="check" size={13} color={ACCENT} />
                    <Text style={[styles.doneBtnText, { color: ACCENT }]}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 20,
    gap: 14,
    minHeight: 340,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginBottom: 4,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  closeBtn: { padding: 4 },
  subtext: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  recordArea: { alignItems: 'center', gap: 16, paddingVertical: 8 },
  micArea: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  micButton: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  pulseRing: {
    position: 'absolute',
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2,
  },
  recordingMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  recTimer: { fontSize: 16, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 },
  recordingActions: { flexDirection: 'row', gap: 10, width: '100%' },
  cancelBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  doneBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  doneBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  tapHint: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  textFallback: {
    width: '100%', borderWidth: 1, borderRadius: 10,
    padding: 12, fontSize: 13, fontFamily: 'Inter_400Regular',
    minHeight: 80, textAlignVertical: 'top',
  },
  processingArea: { alignItems: 'center', gap: 14, paddingVertical: 24 },
  processingText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  processingSubtext: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  resultArea: { gap: 12 },
  transcriptBox: {
    borderRadius: 10, borderWidth: 1, padding: 12, gap: 4,
  },
  transcriptLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.8 },
  transcriptText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  routingCard: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 8 },
  routingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  entityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1,
  },
  entityLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  confidence: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  routedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  routedTo: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  intent: { fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },
  summary: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  provenanceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sourcePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1,
  },
  sourceText: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  resultActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  recordAgainBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  recordAgainText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
});
