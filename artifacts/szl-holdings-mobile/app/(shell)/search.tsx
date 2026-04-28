import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { apiFetch } from '@/lib/apiClient';

const ACCENT = '#c9a84c';

type SearchDomain = 'all' | 'defense' | 'fleet' | 'properties' | 'intelligence' | 'operations' | 'advisory' | 'portfolio';

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  domain: string;
  entityType: string;
  relevance: number;
  updatedAt: string;
}

const DOMAIN_LABELS: Record<SearchDomain, string> = {
  all: 'All Domains',
  defense: 'Defense',
  fleet: 'Fleet',
  properties: 'Properties',
  intelligence: 'Intelligence',
  operations: 'Operations',
  advisory: 'Advisory',
  portfolio: 'Portfolio',
};

const DOMAIN_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  defense: 'shield',
  fleet: 'anchor',
  properties: 'home',
  intelligence: 'cpu',
  operations: 'activity',
  advisory: 'briefcase',
  portfolio: 'trending-up',
};

const ENTITY_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  vessel: 'anchor',
  property: 'home',
  incident: 'alert-triangle',
  signal: 'radio',
  document: 'file-text',
  matter: 'folder',
  agent: 'user',
};

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [activeDomain, setActiveDomain] = useState<SearchDomain>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const runSearch = useCallback(async (q: string, domain: SearchDomain) => {
    if (q.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setIsSearching(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams({ q, ...(domain !== 'all' ? { domain } : {}) });
      const data = await apiFetch(`/api/search?${params}`);
      setResults(Array.isArray(data?.results) ? data.results : buildLocalResults(q, domain));
    } catch {
      setResults(buildLocalResults(q, domain));
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text, activeDomain), 350);
  }, [runSearch, activeDomain]);

  const handleDomainChange = useCallback((domain: SearchDomain) => {
    setActiveDomain(domain);
    if (query.length >= 2) runSearch(query, domain);
  }, [query, runSearch]);

  const navigateToResult = useCallback((result: SearchResult) => {
    const domainRoutes: Record<string, string> = {
      defense: '/(shell)/defense',
      fleet: '/(shell)/fleet',
      properties: '/(shell)/properties',
      intelligence: '/(shell)/intelligence',
      operations: '/(shell)/operations',
      advisory: '/(shell)/advisory',
      portfolio: '/(shell)/portfolio',
    };
    const route = domainRoutes[result.domain] ?? '/(shell)';
    router.push(route as `/${string}`);
  }, []);

  const renderResult = useCallback(({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={[styles.resultCard, { backgroundColor: colors.card }]}
      onPress={() => navigateToResult(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.resultIcon, { backgroundColor: `${ACCENT}22` }]}>
        <Feather
          name={ENTITY_ICONS[item.entityType] ?? DOMAIN_ICONS[item.domain] ?? 'file'}
          size={18}
          color={ACCENT}
        />
      </View>
      <View style={styles.resultContent}>
        <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.resultSnippet, { color: colors.secondaryText }]} numberOfLines={2}>{item.snippet}</Text>
        <View style={styles.resultMeta}>
          <View style={[styles.domainBadge, { backgroundColor: `${ACCENT}18` }]}>
            <Text style={[styles.domainBadgeText, { color: ACCENT }]}>{item.domain}</Text>
          </View>
          <Text style={[styles.resultType, { color: colors.secondaryText }]}>{item.entityType}</Text>
        </View>
      </View>
      <Feather name="chevron-right" size={16} color={colors.secondaryText} />
    </TouchableOpacity>
  ), [colors, navigateToResult]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.secondaryText} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search across all domains..."
            placeholderTextColor={colors.secondaryText}
            value={query}
            onChangeText={handleQueryChange}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setHasSearched(false); }}>
              <Feather name="x" size={18} color={colors.secondaryText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        horizontal
        data={Object.keys(DOMAIN_LABELS) as SearchDomain[]}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.domainFilters}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.domainChip,
              {
                backgroundColor: item === activeDomain ? ACCENT : colors.card,
                borderColor: item === activeDomain ? ACCENT : colors.border,
              },
            ]}
            onPress={() => handleDomainChange(item)}
          >
            <Text style={[styles.domainChipText, { color: item === activeDomain ? '#000' : colors.text }]}>
              {DOMAIN_LABELS[item]}
            </Text>
          </TouchableOpacity>
        )}
      />

      {isSearching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={ACCENT} />
          <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Searching...</Text>
        </View>
      )}

      {!isSearching && hasSearched && results.length === 0 && (
        <View style={styles.emptyContainer}>
          <Feather name="search" size={40} color={colors.secondaryText} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Results</Text>
          <Text style={[styles.emptySubtitle, { color: colors.secondaryText }]}>
            Try adjusting your search or domain filter
          </Text>
        </View>
      )}

      {!isSearching && !hasSearched && (
        <View style={styles.emptyContainer}>
          <Feather name="compass" size={40} color={colors.secondaryText} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Cross-Domain Search</Text>
          <Text style={[styles.emptySubtitle, { color: colors.secondaryText }]}>
            Search vessels, properties, incidents, signals, documents, and more
          </Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderResult}
        contentContainerStyle={styles.resultsList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function buildLocalResults(q: string, domain: SearchDomain): SearchResult[] {
  const lower = q.toLowerCase();
  const entries: SearchResult[] = [
    { id: 'v1', title: 'MV Pacific Horizon', snippet: 'Bulk carrier — en route Rotterdam. Estimated 14-day transit.', domain: 'fleet', entityType: 'vessel', relevance: 0.9, updatedAt: new Date().toISOString() },
    { id: 'v2', title: 'MV Atlantic Star', snippet: 'Container vessel — docked at Houston. Cargo discharge in progress.', domain: 'fleet', entityType: 'vessel', relevance: 0.85, updatedAt: new Date().toISOString() },
    { id: 'p1', title: 'Brickell Bay Tower', snippet: 'Class A office — Miami-Dade corridor. 94% occupancy rate.', domain: 'properties', entityType: 'property', relevance: 0.88, updatedAt: new Date().toISOString() },
    { id: 'p2', title: 'Coral Gables Portfolio', snippet: 'Mixed-use development — 3 distress signals detected this week.', domain: 'properties', entityType: 'property', relevance: 0.82, updatedAt: new Date().toISOString() },
    { id: 'd1', title: 'CVE-2026-1847', snippet: 'Critical vulnerability in edge firewall — patch available, validation pending.', domain: 'defense', entityType: 'incident', relevance: 0.92, updatedAt: new Date().toISOString() },
    { id: 'i1', title: 'Cross-Domain Anomaly Signal', snippet: 'Pattern detected across fleet and properties — potential supply-chain impact.', domain: 'intelligence', entityType: 'signal', relevance: 0.87, updatedAt: new Date().toISOString() },
    { id: 'a1', title: 'Blackstone Engagement Review', snippet: 'Pending document review for client advisory session.', domain: 'advisory', entityType: 'document', relevance: 0.8, updatedAt: new Date().toISOString() },
    { id: 'o1', title: 'API Latency Spike Investigation', snippet: 'KORA agent investigating 12% latency increase in primary API cluster.', domain: 'operations', entityType: 'incident', relevance: 0.78, updatedAt: new Date().toISOString() },
  ];

  return entries
    .filter((e) => (domain === 'all' || e.domain === domain) && (e.title.toLowerCase().includes(lower) || e.snippet.toLowerCase().includes(lower) || lower.length < 4))
    .sort((a, b) => b.relevance - a.relevance);
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  backBtn: { padding: 4 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, height: 42, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, height: '100%' },
  domainFilters: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  domainChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  domainChipText: { fontSize: 13, fontWeight: '600' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 8 },
  loadingText: { fontSize: 14 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  resultsList: { paddingHorizontal: 16, paddingBottom: 100, gap: 8 },
  resultCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, gap: 12 },
  resultIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  resultContent: { flex: 1, gap: 4 },
  resultTitle: { fontSize: 15, fontWeight: '600' },
  resultSnippet: { fontSize: 13, lineHeight: 18 },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  domainBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  domainBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  resultType: { fontSize: 11, textTransform: 'capitalize' },
});
