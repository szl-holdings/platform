import { Feather } from '@expo/vector-icons';
import { useFuzzySearch } from '@szl-holdings/mobile-shared';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePropertyAlertsWebSocket } from '@/hooks/properties/usePropertyAlertsWebSocket';
import { useColors } from '@/hooks/useColors';
import { CACHE_KEYS, cacheGetStale, cacheSet } from '@/lib/cache';

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? 'https://' + process.env.EXPO_PUBLIC_DOMAIN + '/api'
  : '/api';

const BOROUGHS = ['All', 'Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
const TYPES = ['All', 'pre-foreclosure', 'foreclosure', 'tax-lien', 'reo', 'auction'];

interface DistressProperty {
  id: string;
  address: string;
  borough: string;
  distressType: string;
  opportunityScore: number;
  estimatedValue: number;
  ownerName: string;
  daysInDistress: number;
  confidenceLevel: string;
}

const TYPE_COLORS: Record<string, string> = {
  'pre-foreclosure': '#b8943c',
  foreclosure: '#c0503a',
  'tax-lien': '#8b5cf6',
  reo: '#3a7ad4',
  auction: '#ef4444',
};

const DEMO_PROPERTIES: DistressProperty[] = [
  {
    id: 'demo-1',
    address: '412 W 124th St, New York, NY 10027',
    borough: 'Manhattan',
    distressType: 'pre-foreclosure',
    opportunityScore: 87,
    estimatedValue: 1850000,
    ownerName: 'Harrington Trust LLC',
    daysInDistress: 142,
    confidenceLevel: 'high',
  },
  {
    id: 'demo-2',
    address: '1847 East New York Ave, Brooklyn, NY 11212',
    borough: 'Brooklyn',
    distressType: 'tax-lien',
    opportunityScore: 73,
    estimatedValue: 920000,
    ownerName: 'P. Okafor',
    daysInDistress: 89,
    confidenceLevel: 'medium',
  },
  {
    id: 'demo-3',
    address: '93-12 Jamaica Ave, Queens, NY 11435',
    borough: 'Queens',
    distressType: 'foreclosure',
    opportunityScore: 91,
    estimatedValue: 1120000,
    ownerName: 'GreenPoint Holdings',
    daysInDistress: 204,
    confidenceLevel: 'high',
  },
  {
    id: 'demo-4',
    address: '2340 Grand Concourse, Bronx, NY 10468',
    borough: 'Bronx',
    distressType: 'reo',
    opportunityScore: 65,
    estimatedValue: 740000,
    ownerName: 'Meridian Bank FSB',
    daysInDistress: 317,
    confidenceLevel: 'medium',
  },
  {
    id: 'demo-5',
    address: '75 Bay St, Staten Island, NY 10301',
    borough: 'Staten Island',
    distressType: 'auction',
    opportunityScore: 78,
    estimatedValue: 680000,
    ownerName: 'Coastal Dev Group',
    daysInDistress: 56,
    confidenceLevel: 'high',
  },
];

function formatCurrency(n: number) {
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
  return '$' + n;
}

const COMP_DATA: Record<
  string,
  Array<{ address: string; salePrice: number; daysAgo: number; sqft: number }>
> = {
  'dp-001': [
    { address: '831 Park Ave, Queens', salePrice: 1980000, daysAgo: 45, sqft: 1820 },
    { address: '862 Park Ave, Queens', salePrice: 2250000, daysAgo: 88, sqft: 2100 },
    { address: '801 Park Ave, Queens', salePrice: 1750000, daysAgo: 120, sqft: 1650 },
  ],
  'dp-002': [
    { address: '1220 Broadway', salePrice: 3700000, daysAgo: 32, sqft: 3400 },
    { address: '1260 Broadway', salePrice: 4100000, daysAgo: 67, sqft: 3800 },
  ],
};

const SWIPE_THRESHOLD = 80;
const SWIPE_FULL = 110;

function PropertyCard({
  property,
  onPress,
  flagged,
  onFlag,
}: {
  property: DistressProperty;
  onPress: () => void;
  flagged: boolean;
  onFlag: (id: string) => void;
}) {
  const colors = useColors();
  const typeColor = TYPE_COLORS[property.distressType] ?? colors.gold;
  const scoreColor =
    property.opportunityScore >= 80
      ? colors.emerald
      : property.opportunityScore >= 60
        ? colors.amber
        : colors.rose;
  const [showComps, setShowComps] = useState(false);
  const comps = COMP_DATA[property.id] ?? [];
  const translateX = useSharedValue(0);
  const [showFlagHint, setShowFlagHint] = useState(false);

  const avgComp =
    comps.length > 0 ? comps.reduce((s, c) => s + c.salePrice, 0) / comps.length : null;
  const vsAvg = avgComp ? (((property.estimatedValue - avgComp) / avgComp) * 100).toFixed(1) : null;

  const handleFlag = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onFlag(property.id);
  }, [property.id, onFlag]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      runOnJS(setShowFlagHint)(e.translationX > SWIPE_THRESHOLD);
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_FULL) {
        runOnJS(handleFlag)();
      }
      translateX.value = withSpring(0, { damping: 15 });
      runOnJS(setShowFlagHint)(false);
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
      <View
        style={[
          styles.swipeReveal,
          { backgroundColor: showFlagHint ? (colors.amber ?? '#b8943c') + '15' : 'transparent' },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Feather name="flag" size={16} color={colors.amber ?? '#b8943c'} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.amber ?? '#b8943c' }}>
            Flag
          </Text>
        </View>
      </View>
      <GestureDetector gesture={panGesture}>
        <Reanimated.View style={[animStyle]}>
          <View
            style={[
              styles.propertyCard,
              {
                borderColor: flagged ? (colors.amber ?? '#b8943c') + '50' : colors.border,
                backgroundColor: flagged
                  ? (colors.amber ?? '#b8943c') + '06'
                  : 'rgba(255,255,255,0.02)',
              },
            ]}
          >
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                onPress();
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  <Text style={[styles.cardAddress, { color: colors.cream }]} numberOfLines={1}>
                    {property.address}
                  </Text>
                  <Text style={[styles.cardBorough, { color: colors.mutedForeground }]}>
                    {property.borough} · {property.daysInDistress}d in distress
                  </Text>
                </View>
                <View
                  style={[
                    styles.scoreCircle,
                    { borderColor: scoreColor + '40', backgroundColor: scoreColor + '10' },
                  ]}
                >
                  <Text style={[styles.scoreNum, { color: scoreColor }]}>
                    {property.opportunityScore}
                  </Text>
                </View>
              </View>
              <View style={styles.cardMeta}>
                <View
                  style={[
                    styles.typeChip,
                    { backgroundColor: typeColor + '15', borderColor: typeColor + '30' },
                  ]}
                >
                  <Text style={[styles.typeText, { color: typeColor }]}>
                    {property.distressType.replace('-', ' ')}
                  </Text>
                </View>
                <Text style={[styles.cardValue, { color: colors.gold }]}>
                  {formatCurrency(property.estimatedValue)}
                </Text>
                {vsAvg && (
                  <View
                    style={[
                      styles.vsAvgChip,
                      {
                        backgroundColor:
                          parseFloat(vsAvg) < 0 ? colors.emerald + '15' : colors.rose + '15',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.vsAvgText,
                        { color: parseFloat(vsAvg) < 0 ? colors.emerald : colors.rose },
                      ]}
                    >
                      {parseFloat(vsAvg) < 0 ? '↓' : '↑'}
                      {Math.abs(parseFloat(vsAvg))}% vs comps
                    </Text>
                  </View>
                )}
                <Text
                  style={[styles.cardOwner, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {property.ownerName}
                </Text>
              </View>
            </Pressable>

            {comps.length > 0 && (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowComps((s) => !s);
                }}
                style={[styles.compToggle, { borderTopColor: colors.border }]}
              >
                <Feather name="bar-chart-2" size={10} color={colors.mutedForeground} />
                <Text style={[styles.compToggleText, { color: colors.mutedForeground }]}>
                  {showComps ? 'Hide' : 'Pull'} {comps.length} Comps
                </Text>
                <Feather
                  name={showComps ? 'chevron-up' : 'chevron-down'}
                  size={10}
                  color={colors.mutedForeground}
                />
              </Pressable>
            )}

            {showComps && comps.length > 0 && (
              <View style={[styles.compList, { borderTopColor: colors.border }]}>
                <Text style={[styles.compHeader, { color: colors.goldSubtle }]}>
                  RECENT COMPARABLE SALES
                </Text>
                {comps.map((comp, i) => (
                  <View key={i} style={[styles.compRow, { borderTopColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.compAddress, { color: colors.creamDim }]}
                        numberOfLines={1}
                      >
                        {comp.address}
                      </Text>
                      <Text style={[styles.compMeta, { color: colors.mutedForeground }]}>
                        {comp.sqft.toLocaleString()} sqft · {comp.daysAgo}d ago
                      </Text>
                    </View>
                    <Text style={[styles.compPrice, { color: colors.cream }]}>
                      {formatCurrency(comp.salePrice)}
                    </Text>
                  </View>
                ))}
                {avgComp && (
                  <View
                    style={[
                      styles.compAvgRow,
                      { backgroundColor: colors.goldDim ?? 'rgba(200,169,106,0.08)' },
                    ]}
                  >
                    <Text style={[styles.compAvgLabel, { color: colors.goldSubtle }]}>
                      Avg comp sale
                    </Text>
                    <Text style={[styles.compAvgValue, { color: colors.gold }]}>
                      {formatCurrency(Math.round(avgComp))}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </Reanimated.View>
      </GestureDetector>
    </View>
  );
}

export default function PropertiesTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  usePropertyAlertsWebSocket();
  const [search, setSearch] = useState('');
  const [selectedBorough, setSelectedBorough] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  const handleFlag = useCallback((id: string) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 + 84 : 90;

  const { data, refetch } = useQuery({
    queryKey: ['terra-properties', selectedBorough, selectedType, search],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({ limit: '50' });
        if (selectedBorough !== 'All') params.set('borough', selectedBorough);
        if (selectedType !== 'All') params.set('distressType', selectedType);
        if (search) params.set('q', search);
        const res = await fetch(API_BASE + '/terra/distress/search?' + params.toString());
        if (!res.ok) throw new Error('fetch failed');
        const json = await res.json();
        setLastFetchedAt(new Date());
        setIsFromCache(false);
        const result = json.data ?? json;
        if (selectedBorough === 'All' && selectedType === 'All' && !search) {
          await cacheSet(CACHE_KEYS.PROPERTIES, result);
        }
        return result;
      } catch {
        setIsFromCache(true);
        const cached = await cacheGetStale<{ properties?: DistressProperty[] }>(
          CACHE_KEYS.PROPERTIES,
        );
        if (cached) return cached;
        Promise.all(DEMO_PROPERTIES.map((p) => cacheSet(`cache_property_detail_${p.id}`, p))).catch(
          () => {},
        );
        return { properties: DEMO_PROPERTIES };
      }
    },
    retry: 1,
  });

  const apiProperties: DistressProperty[] = data?.properties ?? [];
  const fuzzyProperties = useFuzzySearch(apiProperties, search, (p) => [
    p.address,
    p.ownerName ?? '',
    p.distressType ?? '',
    p.borough ?? '',
  ]);
  const displayProperties = fuzzyProperties.filter((p) => {
    const matchBorough = selectedBorough === 'All' || p.borough === selectedBorough;
    const matchType = selectedType === 'All' || p.distressType === selectedType;
    const matchScore = p.opportunityScore >= minScore;
    return matchBorough && matchType && matchScore;
  });

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.goldSubtle }]}>
            TERRA · DISTRESS ENGINE
          </Text>
          <Text style={[styles.title, { color: colors.cream }]}>Properties</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Pressable
            onPress={() => router.push('/(shell)/properties/ar-viewer' as never)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 8,
              backgroundColor: 'rgba(201,168,76,0.1)',
              borderWidth: 1,
              borderColor: 'rgba(201,168,76,0.25)',
            }}
          >
            <Feather name="camera" size={12} color="#c9a84c" />
            <Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: '#c9a84c' }}>
              AR View
            </Text>
          </Pressable>
          {isFromCache ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
                backgroundColor: 'rgba(148,163,184,0.1)',
                borderWidth: 1,
                borderColor: 'rgba(148,163,184,0.2)',
              }}
            >
              <Feather name="wifi-off" size={9} color="#94a3b8" />
              <Text style={{ fontSize: 9, fontFamily: 'Inter_500Medium', color: '#94a3b8' }}>
                OFFLINE
              </Text>
            </View>
          ) : lastFetchedAt != null ? (
            <Text
              style={{ fontSize: 9, fontFamily: 'Inter_400Regular', color: colors.mutedForeground }}
            >
              {(() => {
                const ms = Date.now() - lastFetchedAt.getTime();
                if (ms < 60000) return 'Live';
                if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
                return `${Math.floor(ms / 3600000)}h ago`;
              })()}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={[styles.searchRow, { borderColor: colors.border }]}>
        <Feather name="search" size={14} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search address or owner..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.cream, fontFamily: 'Inter_300Light' }]}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Feather name="x" size={14} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterScroll}
      >
        {BOROUGHS.map((b) => (
          <Pressable
            key={b}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedBorough(b);
            }}
            style={[
              styles.filterChip,
              {
                borderColor: selectedBorough === b ? colors.gold : colors.border,
                backgroundColor: selectedBorough === b ? colors.goldDim : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: selectedBorough === b ? colors.gold : colors.mutedForeground },
              ]}
            >
              {b}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterRow, { marginTop: 0 }]}
        contentContainerStyle={styles.filterScroll}
      >
        {TYPES.map((t) => {
          const typeColor = TYPE_COLORS[t] ?? colors.gold;
          const isSelected = selectedType === t;
          return (
            <Pressable
              key={t}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedType(t);
              }}
              style={[
                styles.filterChip,
                {
                  borderColor: isSelected ? typeColor : colors.border,
                  backgroundColor: isSelected ? typeColor + '15' : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: isSelected ? typeColor : colors.mutedForeground },
                ]}
              >
                {t === 'All' ? 'All Types' : t.replace('-', ' ')}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterRow, { marginTop: 0 }]}
        contentContainerStyle={styles.filterScroll}
      >
        {[0, 50, 60, 70, 80].map((score) => {
          const isSelected = minScore === score;
          const scoreColor =
            score >= 80 ? colors.emerald : score >= 60 ? colors.amber : colors.gold;
          return (
            <Pressable
              key={score}
              onPress={() => {
                Haptics.selectionAsync();
                setMinScore(score);
              }}
              style={[
                styles.filterChip,
                {
                  borderColor: isSelected ? scoreColor : colors.border,
                  backgroundColor: isSelected ? scoreColor + '15' : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: isSelected ? scoreColor : colors.mutedForeground },
                ]}
              >
                {score === 0 ? 'Any Score' : 'Score ' + score + '+'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.resultsRow, { borderTopColor: colors.border }]}>
        <Text style={[styles.resultsCount, { color: colors.mutedForeground }]}>
          {displayProperties.length} properties
        </Text>
        <Text
          style={[
            styles.resultsMode,
            { color: apiProperties.length > 0 ? colors.emerald : colors.mutedForeground },
          ]}
        >
          {apiProperties.length > 0 ? 'Live data' : 'No API data'}
        </Text>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.gold}
          />
        }
      >
        {displayProperties.map((p) => (
          <PropertyCard
            key={p.id}
            property={p}
            flagged={flaggedIds.has(p.id)}
            onFlag={handleFlag}
            onPress={() => router.push({ pathname: '/property/[id]' as any, params: { id: p.id } })}
          />
        ))}
        {displayProperties.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="search" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No properties match your filters
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  eyebrow: { fontSize: 9, fontFamily: 'Inter_500Medium', letterSpacing: 3, marginBottom: 4 },
  title: { fontSize: 22, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 13 },
  filterRow: { marginBottom: 6 },
  filterScroll: { paddingHorizontal: 20, gap: 6 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, borderWidth: 1 },
  filterText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  resultsCount: { fontSize: 10, fontFamily: 'Inter_300Light' },
  resultsMode: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 6 },
  swipeReveal: {
    position: 'absolute',
    inset: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  propertyCard: { borderRadius: 12, borderWidth: 1, padding: 14 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardLeft: { flex: 1, marginRight: 10 },
  cardAddress: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 3 },
  cardBorough: { fontSize: 10, fontFamily: 'Inter_300Light' },
  scoreCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNum: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  typeChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  typeText: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  cardOwner: { flex: 1, fontSize: 10, fontFamily: 'Inter_300Light' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 13, fontFamily: 'Inter_300Light' },
  vsAvgChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  vsAvgText: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  compToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderTopWidth: 1,
  },
  compToggleText: { flex: 1, fontSize: 10, fontFamily: 'Inter_400Regular' },
  compList: { paddingHorizontal: 14, paddingBottom: 10, borderTopWidth: 1 },
  compHeader: { fontSize: 8, fontFamily: 'Inter_500Medium', letterSpacing: 1.5, marginVertical: 8 },
  compRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1 },
  compAddress: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  compMeta: { fontSize: 9, fontFamily: 'Inter_300Light' },
  compPrice: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  compAvgRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 6,
  },
  compAvgLabel: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  compAvgValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
