import { getApiBase } from '@/lib/apiClient';
import * as Speech from 'expo-speech';
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

interface QueryResult {
  id: string;
  query: string;
  response: string;
  sources: { domain: string; entity: string; confidence: number }[];
  timestamp: string;
  type: 'voice' | 'text';
}

const SUGGESTED_QUERIES = [
  'What is the current portfolio NAV?',
  'Show me active threat alerts',
  'Which vessels are off course?',
  'Summarize DOMAINE covenant compliance',
  'What HITL approvals are pending in A11oy?',
  'Any legal matter deadlines today?',
];

const DOMAIN_COLORS: Record<string, string> = {
  aegis: '#ef4444',
  sentra: '#22c55e',
  vessels: '#0ea5e9',
  terra: '#22c55e',
  counsel: '#8b5cf6',
  command: '#8b7ac8',
  a11oy: '#c9b787',
  holdings: '#c9b787',
  pulse: '#f59e0b',
  lyte: '#3b82f6',
};

const MOCK_RESPONSES: Record<string, string> = {
  nav: 'Portfolio NAV stands at $1.24B — up 0.4% over the last 24 hours. Real estate: $841M · Maritime: $243M · Liquid: $112M · Advisory fees: $44M.',
  threat: 'Two active threat alerts: (1) APT-41 cluster elevated to HIGH confidence — 14 IOC matches across PARAGON; (2) MV Stellarwind route deviation — 82% insurance tier breach probability.',
  vessel: 'MV Stellarwind is 14 nm off its planned route. All other 6 vessels are tracking normally. Weather radar clear across all active corridors.',
  terra: '14 of 16 properties are fully covenant-compliant. TER-4402 is on watch with DSCR 1.01x. TER-8821 was restored to compliance yesterday after a governance action.',
  hitl: 'Three HITL approvals are pending in A11oy: (1) Counterparty risk model update; (2) Maritime reinsurance renewal; (3) Legal matter CJL-2291 posture change.',
  legal: 'One urgent matter: CJL-2291 — response deadline in 48 hours. Assigned to M. Okafor. No draft filed yet. Two supporting matters are in discovery.',
};

function getAutoResponse(query: string): { response: string; sources: QueryResult['sources'] } {
  const q = query.toLowerCase();
  let response = 'OMNIA synthesis is processing your query across the portfolio world model. Please check the Command portal for detailed cross-domain analysis.';
  let sources: QueryResult['sources'] = [{ domain: 'command', entity: 'World Model', confidence: 0.92 }];

  if (q.includes('nav') || q.includes('portfolio') || q.includes('value')) {
    response = MOCK_RESPONSES.nav;
    sources = [{ domain: 'holdings', entity: 'Portfolio NAV', confidence: 0.96 }, { domain: 'a11oy', entity: 'Proof Ledger', confidence: 0.99 }];
  } else if (q.includes('threat') || q.includes('alert') || q.includes('security')) {
    response = MOCK_RESPONSES.threat;
    sources = [{ domain: 'aegis', entity: 'APT-41 Cluster', confidence: 0.92 }, { domain: 'vessels', entity: 'MV Stellarwind', confidence: 0.88 }];
  } else if (q.includes('vessel') || q.includes('ship') || q.includes('course')) {
    response = MOCK_RESPONSES.vessel;
    sources = [{ domain: 'vessels', entity: 'MV Stellarwind', confidence: 0.98 }];
  } else if (q.includes('terra') || q.includes('property') || q.includes('real estate')) {
    response = MOCK_RESPONSES.terra;
    sources = [{ domain: 'terra', entity: 'Portfolio Compliance', confidence: 0.95 }];
  } else if (q.includes('hitl') || q.includes('approval') || q.includes('a11oy')) {
    response = MOCK_RESPONSES.hitl;
    sources = [{ domain: 'a11oy', entity: 'HITL Queue', confidence: 0.99 }];
  } else if (q.includes('legal') || q.includes('matter') || q.includes('counsel')) {
    response = MOCK_RESPONSES.legal;
    sources = [{ domain: 'counsel', entity: 'Matter CJL-2291', confidence: 0.87 }];
  }

  return { response, sources };
}

export default function OmniaVoiceScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QueryResult[]>([]);
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [currentSpeakId, setCurrentSpeakId] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);

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

  const submitQuery = useCallback(
    async (q: string) => {
      if (!q.trim() || processing) return;
      const trimmed = q.trim();
      setQuery('');
      setProcessing(true);

      await new Promise((r) => setTimeout(r, 900));

      const { response, sources } = getAutoResponse(trimmed);
      const result: QueryResult = {
        id: `q-${Date.now()}`,
        query: trimmed,
        response,
        sources,
        timestamp: new Date().toISOString(),
        type: listening ? 'voice' : 'text',
      };

      setResults((prev) => [result, ...prev]);
      setProcessing(false);
      setListening(false);
    },
    [processing, listening],
  );

  const handleMicPress = useCallback(() => {
    if (listening) {
      setListening(false);
      if (query.trim()) submitQuery(query);
    } else {
      setListening(true);
      setTimeout(() => {
        setListening(false);
      }, 5000);
    }
  }, [listening, query, submitQuery]);

  const speakResult = useCallback((result: QueryResult) => {
    if (currentSpeakId === result.id && speaking) {
      Speech.stop();
      setSpeaking(false);
      setCurrentSpeakId(null);
      return;
    }
    Speech.stop();
    setSpeaking(true);
    setCurrentSpeakId(result.id);
    Speech.speak(result.response, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.95,
      onDone: () => { setSpeaking(false); setCurrentSpeakId(null); },
      onError: () => { setSpeaking(false); setCurrentSpeakId(null); },
    });
  }, [currentSpeakId, speaking]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Globe size={18} color={ACCENT} />
        <View>
          <Text style={styles.headerTitle}>OMNIA Voice Query</Text>
          <Text style={styles.headerSubtitle}>Ask anything about the portfolio</Text>
        </View>
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
                onPress={() => submitQuery(sq)}
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
            <Text style={styles.processingText}>Querying portfolio world model…</Text>
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
        <Animated.View style={[styles.micBtn, { transform: [{ scale: pulseAnim }] }, listening && styles.micBtnActive]}>
          <TouchableOpacity onPress={handleMicPress} style={styles.micBtnInner}>
            {listening ? <MicOff size={22} color="#fff" /> : <Mic size={22} color={ACCENT} />}
          </TouchableOpacity>
        </Animated.View>
        <TextInput
          style={styles.textInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Ask about the portfolio…"
          placeholderTextColor="rgba(255,255,255,0.3)"
          onSubmitEditing={() => submitQuery(query)}
          returnKeyType="send"
          editable={!processing}
          multiline={false}
        />
        <TouchableOpacity
          onPress={() => submitQuery(query)}
          disabled={!query.trim() || processing}
          style={[styles.sendBtn, (!query.trim() || processing) && styles.sendBtnDisabled]}
        >
          <Send size={15} color={!query.trim() || processing ? 'rgba(255,255,255,0.2)' : ACCENT} />
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
