import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useFusionHistory } from '@/hooks/useFusionHistory';
import { apiFetch } from '@/lib/apiClient';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ACCENT = '#c9a84c';

interface DomainSignal {
  title: string;
  summary: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  timestamp: number;
}

interface DomainResult {
  domain: string;
  domainLabel: string;
  relevanceScore: number;
  signals: DomainSignal[];
  insight: string;
}

interface Correlation {
  title: string;
  domains: string[];
  description: string;
  confidence: number;
}

interface FusedResult {
  query: string;
  fusedAnswer: string;
  domainResults: DomainResult[];
  correlations: Correlation[];
  overallRisk: 'critical' | 'high' | 'medium' | 'low' | 'nominal';
  confidence: number;
}

const SUGGESTIONS = [
  'Brief me on compound risks this week',
  "What's the maritime impact on real estate?",
  'Current cyber threat posture and legal implications?',
  'Portfolio risk snapshot across all domains',
];

function severityColor(sev: string, colors: ReturnType<typeof useColors>): string {
  switch (sev) {
    case 'critical':
      return colors.red;
    case 'high':
      return colors.amber;
    case 'medium':
      return '#f59e0b';
    case 'low':
      return colors.blue;
    default:
      return colors.mutedForeground;
  }
}

function riskColor(risk: string, colors: ReturnType<typeof useColors>): string {
  switch (risk) {
    case 'critical':
      return colors.red;
    case 'high':
      return colors.amber;
    case 'medium':
      return '#f59e0b';
    case 'low':
      return colors.blue;
    default:
      return colors.green;
  }
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <View style={scoreStyles.track}>
      <View
        style={[scoreStyles.fill, { width: `${Math.round(score * 100)}%`, backgroundColor: color }]}
      />
    </View>
  );
}

const scoreStyles = StyleSheet.create({
  track: { height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, flex: 1 },
  fill: { height: 3, borderRadius: 2 },
});

function DomainResultCard({
  result,
  colors,
}: {
  result: DomainResult;
  colors: ReturnType<typeof useColors>;
}) {
  const [expanded, setExpanded] = useState(false);
  const scoreColor =
    result.relevanceScore >= 0.9
      ? colors.red
      : result.relevanceScore >= 0.8
        ? colors.amber
        : colors.blue;

  return (
    <View style={[drStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.8}
        style={drStyles.cardHeader}
      >
        <View style={drStyles.headerLeft}>
          <Text style={[drStyles.domainLabel, { color: colors.foreground }]} numberOfLines={1}>
            {result.domainLabel}
          </Text>
          <View style={drStyles.scoreRow}>
            <ScoreBar score={result.relevanceScore} color={scoreColor} />
            <Text style={[drStyles.scoreText, { color: scoreColor }]}>
              {Math.round(result.relevanceScore * 100)}%
            </Text>
          </View>
        </View>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>

      <Text
        style={[drStyles.insight, { color: colors.mutedForeground }]}
        numberOfLines={expanded ? undefined : 2}
      >
        {result.insight}
      </Text>

      {expanded &&
        result.signals.map((sig, i) => {
          const sColor = severityColor(sig.severity, colors);
          return (
            <View key={i} style={[drStyles.signalRow, { borderTopColor: colors.border }]}>
              <View style={[drStyles.sevDot, { backgroundColor: sColor }]} />
              <View style={{ flex: 1 }}>
                <Text
                  style={[drStyles.signalTitle, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {sig.title}
                </Text>
                <Text
                  style={[drStyles.signalSummary, { color: colors.mutedForeground }]}
                  numberOfLines={2}
                >
                  {sig.summary}
                </Text>
              </View>
              <View
                style={[
                  drStyles.sevBadge,
                  { backgroundColor: `${sColor}18`, borderColor: `${sColor}30` },
                ]}
              >
                <Text style={[drStyles.sevText, { color: sColor }]}>
                  {sig.severity.toUpperCase()}
                </Text>
              </View>
            </View>
          );
        })}
    </View>
  );
}

const drStyles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLeft: { flex: 1, gap: 4 },
  domainLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', width: 30 },
  insight: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  sevDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0, marginTop: 3 },
  signalTitle: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  signalSummary: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 2, lineHeight: 14 },
  sevBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  sevText: { fontSize: 8, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.4 },
});

export function FusionBar() {
  const colors = useColors();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FusedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const { history, addQuery, clearHistory } = useFusionHistory();

  const submit = async (q?: string) => {
    const finalQuery = (q ?? query).trim();
    if (!finalQuery || finalQuery.length < 3) return;
    setLoading(true);
    setResult(null);
    setError(null);
    if (!expanded) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(true);
    }
    try {
      const body = await apiFetch<{ success: boolean; result: FusedResult }>(
        '/api/cross-domain-query',
        { method: 'POST', body: JSON.stringify({ query: finalQuery }) },
      );
      if (!body.success) throw new Error('Query failed');
      setResult(body.result);
      addQuery(finalQuery);
      if (q) setQuery(q);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Query failed');
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setResult(null);
    setError(null);
    setExpanded(false);
    setQuery('');
  };

  const overallRiskColor = result ? riskColor(result.overallRisk, colors) : ACCENT;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: expanded ? `${ACCENT}40` : colors.border },
      ]}
    >
      <View style={styles.inputRow}>
        <Feather name="zap" size={14} color={ACCENT} style={styles.zapIcon} />
        <TextInput
          style={[styles.input, { color: colors.foreground }]}
          placeholder="Ask across all domains…"
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => submit()}
          returnKeyType="search"
          blurOnSubmit={false}
          editable={!loading}
        />
        {loading ? (
          <ActivityIndicator size="small" color={ACCENT} style={styles.actionBtn} />
        ) : result || error ? (
          <TouchableOpacity onPress={clear} style={styles.actionBtn}>
            <Feather name="x" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => submit()}
            style={[
              styles.submitBtn,
              { backgroundColor: query.trim().length >= 3 ? ACCENT : `${ACCENT}30` },
            ]}
            disabled={query.trim().length < 3}
          >
            <Feather
              name="arrow-right"
              size={13}
              color={query.trim().length >= 3 ? '#000' : ACCENT}
            />
          </TouchableOpacity>
        )}
      </View>

      {!expanded && !loading && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsRow}
          >
            {SUGGESTIONS.map((s, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => submit(s)}
                style={[
                  styles.suggestionChip,
                  { backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}25` },
                ]}
              >
                <Text style={[styles.suggestionText, { color: ACCENT }]} numberOfLines={1}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {history.length > 0 && (
            <View style={styles.recentRowWrap}>
              <View style={styles.recentLabelRow}>
                <Feather name="clock" size={10} color={colors.mutedForeground} />
                <Text style={[styles.recentLabel, { color: colors.mutedForeground }]}>RECENT</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={clearHistory} accessibilityLabel="Clear recent queries">
                  <Text style={[styles.recentClear, { color: colors.mutedForeground }]}>Clear</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsRow}
              >
                {history.map((h, i) => (
                  <TouchableOpacity
                    key={`${h}-${i}`}
                    onPress={() => submit(h)}
                    style={[
                      styles.suggestionChip,
                      { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                  >
                    <Text
                      style={[styles.suggestionText, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {h}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </>
      )}

      {expanded && (
        <View style={styles.resultsContainer}>
          {loading && (
            <View style={styles.loadingState}>
              <ActivityIndicator color={ACCENT} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                Querying across all domains…
              </Text>
            </View>
          )}

          {error && (
            <View
              style={[
                styles.errorState,
                { borderColor: `${colors.red}30`, backgroundColor: `${colors.red}10` },
              ]}
            >
              <Feather name="alert-circle" size={14} color={colors.red} />
              <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text>
            </View>
          )}

          {result && (
            <>
              <View
                style={[
                  styles.fusedAnswerCard,
                  { backgroundColor: colors.background, borderColor: `${overallRiskColor}30` },
                ]}
              >
                <View style={styles.fusedAnswerHeader}>
                  <View
                    style={[
                      styles.riskBadge,
                      {
                        backgroundColor: `${overallRiskColor}18`,
                        borderColor: `${overallRiskColor}40`,
                      },
                    ]}
                  >
                    <Text style={[styles.riskText, { color: overallRiskColor }]}>
                      {result.overallRisk.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.confidenceText, { color: colors.mutedForeground }]}>
                    {Math.round(result.confidence * 100)}% confidence ·{' '}
                    {result.domainResults.length} domains
                  </Text>
                </View>
                <Text style={[styles.fusedAnswerText, { color: colors.foreground }]}>
                  {result.fusedAnswer}
                </Text>
              </View>

              {result.correlations.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                    CORRELATIONS
                  </Text>
                  {result.correlations.map((c, i) => (
                    <View key={i} style={[styles.correlationRow, { borderColor: colors.border }]}>
                      <View style={styles.correlationHeader}>
                        <Text
                          style={[styles.correlationTitle, { color: colors.foreground }]}
                          numberOfLines={1}
                        >
                          {c.title}
                        </Text>
                        <Text style={[styles.correlationConf, { color: ACCENT }]}>
                          {Math.round(c.confidence * 100)}%
                        </Text>
                      </View>
                      <Text
                        style={[styles.correlationDesc, { color: colors.mutedForeground }]}
                        numberOfLines={2}
                      >
                        {c.description}
                      </Text>
                    </View>
                  ))}
                </>
              )}

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                DOMAIN BREAKDOWN
              </Text>
              {result.domainResults.map((dr) => (
                <DomainResultCard key={dr.domain} result={dr} colors={colors} />
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  zapIcon: { flexShrink: 0 },
  input: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 2,
  },
  actionBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsRow: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 6,
  },
  recentRowWrap: {
    paddingTop: 2,
  },
  recentLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  recentLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.2,
  },
  recentClear: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },
  suggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 200,
  },
  suggestionText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  resultsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  loadingState: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  errorState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  fusedAnswerCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  fusedAnswerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },
  riskText: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
  },
  confidenceText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  fusedAnswerText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  correlationRow: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    gap: 4,
  },
  correlationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  correlationTitle: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  correlationConf: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  correlationDesc: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    lineHeight: 14,
  },
});
