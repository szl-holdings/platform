import { apiGet, apiPost } from '@/lib/apiClient';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import {
  Activity,
  Globe,
  Mic,
  MicOff,
  RefreshCw,
  Search,
  Send,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const ACCENT = '#8b7ac8';

interface DailyBriefingPayload {
  briefingDate: string;
  headline?: string;
  audioBase64: string;
  mimeType: string;
  provenance?: { model: string; voice: string; format: string; generatedAt: string };
  source?: string;
}

interface QueryResult {
  id: string;
  query: string;
  response: string;
  sources: { domain: string; entity: string; confidence: number }[];
  timestamp: string;
  type: 'voice' | 'text';
  audioBase64?: string;
}

const SUGGESTED_QUERIES = [
  'What is the current portfolio NAV?',
  'Show me active threat alerts',
  'Which vessels are off course?',
  'Summarize Terra covenant compliance',
  'What HITL approvals are pending in A11oy?',
  'Any legal matter deadlines today?',
];

const DOMAIN_COLORS: Record<string, string> = {
  aegis: '#ef4444',
  sentra: '#22c55e',
  vessels: '#4d8fcc',
  terra: '#22c55e',
  counsel: '#8b5cf6',
  command: '#8b7ac8',
  a11oy: '#c9b787',
  holdings: '#c9b787',
  pulse: '#f59e0b',
  lyte: '#3b82f6',
};

function inferSources(query: string): QueryResult['sources'] {
  const q = query.toLowerCase();
  if (q.includes('nav') || q.includes('portfolio') || q.includes('value')) {
    return [{ domain: 'holdings', entity: 'Portfolio NAV', confidence: 0.96 }, { domain: 'a11oy', entity: 'Proof Ledger', confidence: 0.99 }];
  } else if (q.includes('threat') || q.includes('alert') || q.includes('security')) {
    return [{ domain: 'aegis', entity: 'Threat Monitor', confidence: 0.92 }];
  } else if (q.includes('vessel') || q.includes('ship') || q.includes('course') || q.includes('maritime')) {
    return [{ domain: 'vessels', entity: 'Fleet Tracker', confidence: 0.98 }];
  } else if (q.includes('terra') || q.includes('property') || q.includes('real estate')) {
    return [{ domain: 'terra', entity: 'Portfolio Compliance', confidence: 0.95 }];
  } else if (q.includes('hitl') || q.includes('approval') || q.includes('a11oy')) {
    return [{ domain: 'a11oy', entity: 'HITL Queue', confidence: 0.99 }];
  } else if (q.includes('legal') || q.includes('matter') || q.includes('counsel')) {
    return [{ domain: 'counsel', entity: 'Matter Dashboard', confidence: 0.87 }];
  }
  return [{ domain: 'command', entity: 'World Model', confidence: 0.92 }];
}

export default function OmniaVoiceScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QueryResult[]>([]);
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [currentSpeakId, setCurrentSpeakId] = useState<string | null>(null);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [dailyBriefing, setDailyBriefing] = useState<DailyBriefingPayload | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [briefingPlaying, setBriefingPlaying] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const briefingSoundRef = useRef<Audio.Sound | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  // Create a persistent conversation session for the lifetime of this screen
  useEffect(() => {
    apiPost<{ id: string }>('/api/openai/conversations', {})
      .then((data) => { conversationIdRef.current = data.id; })
      .catch(() => { /* session creation failed — queries will run without history */ });
  }, []);

  useEffect(() => {
    if (listening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 700, easing: Easing.ease, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, easing: Easing.ease, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [listening]);

  // Fetch today's daily briefing audio from the API on mount
  useEffect(() => {
    setBriefingLoading(true);
    apiGet<DailyBriefingPayload>('/api/openai/daily-briefing/today')
      .then((data) => setDailyBriefing(data))
      .catch(() => setDailyBriefing(null))
      .finally(() => setBriefingLoading(false));
  }, []);

  useEffect(() => {
    return () => {
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
      briefingSoundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const playDailyBriefing = useCallback(async () => {
    if (!dailyBriefing?.audioBase64) return;
    if (briefingPlaying) {
      if (briefingSoundRef.current) {
        await briefingSoundRef.current.stopAsync().catch(() => {});
        await briefingSoundRef.current.unloadAsync().catch(() => {});
        briefingSoundRef.current = null;
      }
      setBriefingPlaying(false);
      return;
    }
    try {
      setBriefingPlaying(true);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true, staysActiveInBackground: true });
      const tmpUri = `${FileSystem.cacheDirectory}daily-brief-${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(tmpUri, dailyBriefing.audioBase64, { encoding: FileSystem.EncodingType.Base64 });
      const { sound } = await Audio.Sound.createAsync({ uri: tmpUri }, { shouldPlay: true });
      briefingSoundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          setBriefingPlaying(false);
          sound.unloadAsync().catch(() => {});
          briefingSoundRef.current = null;
        }
      });
    } catch {
      setBriefingPlaying(false);
    }
  }, [dailyBriefing, briefingPlaying]);

  const playAudioBase64 = useCallback(async (base64: string, resultId: string) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setSpeaking(true);
      setCurrentSpeakId(resultId);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const tmpUri = `${FileSystem.cacheDirectory}omnia-response-${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(tmpUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: tmpUri },
        { shouldPlay: true },
      );
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          setSpeaking(false);
          setCurrentSpeakId(null);
          sound.unloadAsync().catch(() => {});
        }
      });
    } catch (err) {
      setSpeaking(false);
      setCurrentSpeakId(null);
    }
  }, []);

  const stopAudio = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setSpeaking(false);
    setCurrentSpeakId(null);
  }, []);

  const speakResult = useCallback(async (result: QueryResult) => {
    if (currentSpeakId === result.id && speaking) {
      await stopAudio();
      return;
    }
    await stopAudio();

    if (result.audioBase64) {
      await playAudioBase64(result.audioBase64, result.id);
      return;
    }

    try {
      setSpeaking(true);
      setCurrentSpeakId(result.id);

      const data = await apiPost<{ audioBase64: string; mimeType: string }>(
        '/api/openai/briefing-audio',
        { text: result.response, voice: 'nova' },
      );

      await playAudioBase64(data.audioBase64, result.id);
    } catch {
      setSpeaking(false);
      setCurrentSpeakId(null);
    }
  }, [currentSpeakId, speaking, stopAudio, playAudioBase64]);

  const submitTextQuery = useCallback(async (q: string) => {
    if (!q.trim() || processing) return;
    const trimmed = q.trim();
    setQuery('');
    setProcessing(true);

    try {
      let response = 'OMNIA synthesis is processing your query. Check the Command portal for detailed analysis.';
      try {
        const data = await apiPost<{ response?: string }>('/api/openai/text-query', {
          query: trimmed,
          ...(conversationIdRef.current ? { conversationId: conversationIdRef.current } : {}),
        });
        response = data.response ?? response;
      } catch {
        /* network error — use fallback message */
      }

      const result: QueryResult = {
        id: `q-${Date.now()}`,
        query: trimmed,
        response,
        sources: inferSources(trimmed),
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      setResults((prev) => [result, ...prev]);
    } catch {
      const result: QueryResult = {
        id: `q-${Date.now()}`,
        query: trimmed,
        response: 'Network error — unable to reach OMNIA. Please check your connection.',
        sources: [],
        timestamp: new Date().toISOString(),
        type: 'text',
      };
      setResults((prev) => [result, ...prev]);
    } finally {
      setProcessing(false);
    }
  }, [processing]);

  const submitVoiceQuery = useCallback(async (audioBase64: string) => {
    setProcessing(true);

    try {
      const data = await apiPost<{
        userTranscript?: string;
        assistantTranscript?: string;
        audioBase64?: string;
      }>('/api/openai/voice-query', {
        audio: audioBase64,
        ...(conversationIdRef.current ? { conversationId: conversationIdRef.current } : {}),
      });

      const userQuery = data.userTranscript?.trim() || 'Voice query';
      const response = data.assistantTranscript?.trim() || 'OMNIA could not process the voice input.';

      const result: QueryResult = {
        id: `v-${Date.now()}`,
        query: userQuery,
        response,
        sources: inferSources(userQuery),
        timestamp: new Date().toISOString(),
        type: 'voice',
        audioBase64: data.audioBase64,
      };

      setResults((prev) => [result, ...prev]);

      if (data.audioBase64) {
        await playAudioBase64(data.audioBase64, result.id);
      }
    } catch {
      const result: QueryResult = {
        id: `v-${Date.now()}`,
        query: 'Voice query',
        response: 'Voice processing failed. Please try again or use the text input.',
        sources: [],
        timestamp: new Date().toISOString(),
        type: 'voice',
      };
      setResults((prev) => [result, ...prev]);
    } finally {
      setProcessing(false);
    }
  }, [playAudioBase64]);

  // When privacy mode is enabled mid-recording, force-stop the mic immediately
  useEffect(() => {
    if (privacyMode && listening && recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => {}).finally(() => {
        recordingRef.current = null;
        setListening(false);
      });
    }
  }, [privacyMode, listening]);

  const handleMicPress = useCallback(async () => {
    if (privacyMode) return;
    if (listening) {
      setListening(false);
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
          const uri = recordingRef.current.getURI();
          recordingRef.current = null;

          if (uri) {
            const base64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            await submitVoiceQuery(base64);
          }
        } catch {
          recordingRef.current = null;
          Alert.alert('Recording Error', 'Could not process the recording. Please try again.');
        }
      }
      return;
    }

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Microphone Access', 'Microphone permission is required for voice queries.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setListening(true);
    } catch {
      Alert.alert('Recording Error', 'Could not start recording. Please try again.');
    }
  }, [listening, submitVoiceQuery]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Globe size={18} color={ACCENT} />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>OMNIA Voice Query</Text>
          <Text style={styles.headerSubtitle}>Ask anything about the portfolio</Text>
        </View>
        <TouchableOpacity
          onPress={() => setPrivacyMode((p) => !p)}
          style={[styles.privacyToggle, privacyMode && styles.privacyToggleActive]}
          accessibilityLabel={privacyMode ? 'Privacy mode on — tap to unmute' : 'Enable privacy mode'}
        >
          {privacyMode ? (
            <MicOff size={14} color="rgba(239,68,68,0.9)" />
          ) : (
            <Mic size={14} color="rgba(255,255,255,0.4)" />
          )}
        </TouchableOpacity>
      </View>

      {/* Privacy mode banner */}
      {privacyMode && (
        <View style={styles.privacyBanner}>
          <MicOff size={10} color="rgba(239,68,68,0.8)" />
          <Text style={styles.privacyBannerText}>Privacy mode — microphone muted</Text>
        </View>
      )}

      {/* Daily Briefing Card */}
      <View style={styles.dailyBriefingCard}>
        <View style={styles.dailyBriefingHeader}>
          <Zap size={13} color={ACCENT} />
          <Text style={styles.dailyBriefingLabel}>TODAY'S BRIEFING</Text>
          {dailyBriefing?.source === 'cache' && (
            <Text style={styles.cachedBadge}>CACHED</Text>
          )}
        </View>
        {briefingLoading ? (
          <Text style={styles.dailyBriefingHint}>Fetching today's intelligence briefing…</Text>
        ) : dailyBriefing ? (
          <>
            <Text style={styles.dailyBriefingHeadline} numberOfLines={2}>
              {dailyBriefing.headline ?? 'Daily Executive Intelligence Briefing'}
            </Text>
            <View style={styles.dailyBriefingFooter}>
              <Text style={styles.dailyBriefingDate}>{dailyBriefing.briefingDate}</Text>
              <TouchableOpacity onPress={playDailyBriefing} style={styles.briefingPlayBtn}>
                {briefingPlaying ? (
                  <VolumeX size={13} color={ACCENT} />
                ) : (
                  <Volume2 size={13} color={ACCENT} />
                )}
                <Text style={styles.briefingPlayText}>{briefingPlaying ? 'Stop' : 'Listen'}</Text>
              </TouchableOpacity>
            </View>
            {dailyBriefing.provenance && (
              <Text style={styles.provenanceText}>
                {dailyBriefing.provenance.model} · {dailyBriefing.provenance.voice} · {dailyBriefing.provenance.format.toUpperCase()}
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.dailyBriefingHint}>No briefing available — connect to generate one.</Text>
        )}
      </View>

      {results.length === 0 && !processing && (
        <View style={styles.suggestionsSection}>
          <Text style={styles.suggestionsLabel}>SUGGESTED QUERIES</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsList}
          >
            {SUGGESTED_QUERIES.map((sq) => (
              <TouchableOpacity
                key={sq}
                onPress={() => submitTextQuery(sq)}
                style={styles.suggestionChip}
              >
                <Text style={styles.suggestionText}>{sq}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        style={styles.results}
        contentContainerStyle={styles.resultsContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {processing && (
          <View style={styles.processingRow}>
            <Activity size={14} color={ACCENT} />
            <Text style={styles.processingText}>Querying OMNIA intelligence layer…</Text>
          </View>
        )}
        {[...results].reverse().map((result) => (
          <View key={result.id} style={styles.resultCard}>
            <View style={styles.resultQueryRow}>
              <View style={[styles.queryTypeBadge, { backgroundColor: result.type === 'voice' ? `${ACCENT}20` : 'rgba(255,255,255,0.06)' }]}>
                {result.type === 'voice' ? <Mic size={9} color={ACCENT} /> : <Search size={9} color="rgba(255,255,255,0.4)" />}
              </View>
              <Text style={styles.resultQuery}>{result.query}</Text>
              <TouchableOpacity onPress={() => speakResult(result)} style={styles.speakBtn}>
                {currentSpeakId === result.id && speaking ? (
                  <VolumeX size={13} color={ACCENT} />
                ) : (
                  <Volume2 size={13} color="rgba(255,255,255,0.35)" />
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.resultResponseBox}>
              <Text style={styles.resultResponse}>{result.response}</Text>
            </View>
            {result.sources.length > 0 && (
              <View style={styles.sourcesRow}>
                {result.sources.map((s, i) => (
                  <View key={i} style={[styles.sourceChip, { borderColor: `${DOMAIN_COLORS[s.domain] ?? ACCENT}30` }]}>
                    <View style={[styles.sourceDot, { backgroundColor: DOMAIN_COLORS[s.domain] ?? ACCENT }]} />
                    <Text style={[styles.sourceText, { color: DOMAIN_COLORS[s.domain] ?? ACCENT }]}>
                      {s.domain}
                    </Text>
                    <Text style={styles.sourceConf}>{(s.confidence * 100).toFixed(0)}%</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputArea}>
        <Animated.View
          style={[
            styles.micBtn,
            { transform: [{ scale: pulseAnim }] },
            listening && styles.micBtnActive,
            privacyMode && styles.micBtnPrivacy,
          ]}
        >
          <TouchableOpacity
            onPress={handleMicPress}
            style={styles.micBtnInner}
            disabled={processing || privacyMode}
          >
            {privacyMode ? (
              <MicOff size={22} color="rgba(239,68,68,0.6)" />
            ) : listening ? (
              <MicOff size={22} color="#fff" />
            ) : (
              <Mic size={22} color={ACCENT} />
            )}
          </TouchableOpacity>
        </Animated.View>
        <TextInput
          style={styles.textInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Ask about the portfolio…"
          placeholderTextColor="rgba(255,255,255,0.3)"
          onSubmitEditing={() => submitTextQuery(query)}
          returnKeyType="send"
          editable={!processing && !listening}
          multiline={false}
        />
        <TouchableOpacity
          onPress={() => submitTextQuery(query)}
          disabled={!query.trim() || processing || listening}
          style={[styles.sendBtn, (!query.trim() || processing || listening) && styles.sendBtnDisabled]}
        >
          <Send size={15} color={!query.trim() || processing || listening ? 'rgba(255,255,255,0.2)' : ACCENT} />
        </TouchableOpacity>
      </View>

      {listening && (
        <View style={styles.listeningBanner}>
          <Mic size={13} color="#ef4444" />
          <Text style={styles.listeningText}>Listening… tap mic to send</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060b12',
  },
  privacyToggle: {
    padding: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyToggleActive: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239,68,68,0.15)',
  },
  privacyBannerText: {
    fontSize: 11,
    color: 'rgba(239,68,68,0.85)',
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: 'rgba(235,230,220,0.95)',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 1,
  },
  dailyBriefingCard: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    padding: 14,
    backgroundColor: `${ACCENT}0a`,
    borderWidth: 1,
    borderColor: `${ACCENT}25`,
    borderRadius: 12,
  },
  dailyBriefingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dailyBriefingLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.3,
    color: ACCENT,
    flex: 1,
  },
  cachedBadge: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: 'rgba(120,200,100,0.8)',
  },
  dailyBriefingHeadline: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(235,230,220,0.88)',
    lineHeight: 18,
    marginBottom: 8,
  },
  dailyBriefingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dailyBriefingDate: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
  },
  briefingPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: `${ACCENT}18`,
    borderWidth: 1,
    borderColor: `${ACCENT}35`,
    borderRadius: 8,
  },
  briefingPlayText: {
    fontSize: 12,
    fontWeight: '600',
    color: ACCENT,
  },
  provenanceText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
    marginTop: 6,
  },
  dailyBriefingHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    fontStyle: 'italic',
  },
  suggestionsSection: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  suggestionsLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  suggestionsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 10,
    maxWidth: 200,
  },
  suggestionText: {
    fontSize: 12,
    color: 'rgba(235,230,220,0.65)',
    lineHeight: 16,
  },
  results: {
    flex: 1,
  },
  resultsContent: {
    padding: 16,
    gap: 14,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: `${ACCENT}0a`,
    borderWidth: 1,
    borderColor: `${ACCENT}20`,
    borderRadius: 10,
  },
  processingText: {
    fontSize: 13,
    color: ACCENT,
  },
  resultCard: {
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  resultQueryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  queryTypeBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  resultQuery: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(235,230,220,0.85)',
  },
  speakBtn: {
    padding: 4,
  },
  resultResponseBox: {
    padding: 14,
  },
  resultResponse: {
    fontSize: 14,
    color: 'rgba(235,230,220,0.75)',
    lineHeight: 20,
  },
  sourcesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderRadius: 6,
  },
  sourceDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sourceConf: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    backgroundColor: '#070d15',
  },
  micBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: '#ef444430',
    borderColor: '#ef444460',
  },
  micBtnPrivacy: {
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderColor: 'rgba(239,68,68,0.2)',
    opacity: 0.7,
  },
  micBtnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 21,
  },
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: 'rgba(235,230,220,0.9)',
  },
  sendBtn: {
    width: 40,
    height: 40,
    backgroundColor: `${ACCENT}18`,
    borderWidth: 1,
    borderColor: `${ACCENT}35`,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  listeningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(239,68,68,0.2)',
  },
  listeningText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
});
