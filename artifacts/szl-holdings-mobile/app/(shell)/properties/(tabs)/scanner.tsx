import { Feather } from '@expo/vector-icons';
import { useSyncEngine } from '@szl-holdings/mobile-shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? 'https://' + process.env.EXPO_PUBLIC_DOMAIN + '/api'
  : '/api';

interface ScannerCard {
  id: string;
  address: string;
  borough: string;
  distressType: string;
  score: number;
  price: string;
  daysListed: number;
  ownerName: string;
  thesis: string;
}

const DIST_TYPE_COLORS: Record<string, string> = {
  'Pre-Foreclosure': '#b8943c',
  Foreclosure: '#c0503a',
  Auction: '#ef4444',
  REO: '#3a7ad4',
  'Tax Lien': '#8b5cf6',
};

function formatCurrency(n: number) {
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
  return '$' + n;
}

function SwipeCard({
  card,
  onSwipeRight,
  onSwipeLeft,
  isTop,
  stackIndex,
}: {
  card: ScannerCard;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  isTop: boolean;
  stackIndex: number;
}) {
  const colors = useColors();
  const pan = useRef(new Animated.ValueXY()).current;
  const [action, setAction] = useState<'right' | 'left' | null>(null);
  const typeColor = DIST_TYPE_COLORS[card.distressType] ?? colors.gold;
  const scoreColor =
    card.score >= 80 ? colors.emerald : card.score >= 60 ? colors.amber : colors.rose;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gs) => isTop && Math.abs(gs.dx) > 10,
    onPanResponderMove: (_, gs) => {
      pan.setValue({ x: gs.dx, y: gs.dy * 0.2 });
      if (gs.dx > 50) setAction('right');
      else if (gs.dx < -50) setAction('left');
      else setAction(null);
    },
    onPanResponderRelease: (_, gs) => {
      if (gs.dx > 80) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Animated.spring(pan, { toValue: { x: 400, y: 0 }, useNativeDriver: true }).start(
          onSwipeRight,
        );
      } else if (gs.dx < -80) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Animated.spring(pan, { toValue: { x: -400, y: 0 }, useNativeDriver: true }).start(
          onSwipeLeft,
        );
      } else {
        setAction(null);
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
      }
    },
  });

  const rotate = pan.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-12deg', '0deg', '12deg'],
  });
  const scale = isTop ? 1 : 1 - stackIndex * 0.04;
  const translateY = isTop ? 0 : stackIndex * 10;

  return (
    <Animated.View
      {...(isTop ? panResponder.panHandlers : {})}
      style={[
        styles.swipeCard,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor:
            action === 'right'
              ? colors.emerald + '60'
              : action === 'left'
                ? colors.rose + '60'
                : colors.border,
          transform: [
            { translateX: isTop ? pan.x : 0 },
            { translateY: isTop ? pan.y : translateY },
            { rotate: isTop ? rotate : '0deg' },
            { scale },
          ],
          zIndex: 10 - stackIndex,
        },
      ]}
    >
      {action && (
        <View
          style={[
            styles.swipeLabel,
            {
              backgroundColor: action === 'right' ? colors.emerald + '20' : colors.rose + '20',
              borderColor: action === 'right' ? colors.emerald + '40' : colors.rose + '40',
            },
          ]}
        >
          <Text
            style={[
              styles.swipeLabelText,
              { color: action === 'right' ? colors.emerald : colors.rose },
            ]}
          >
            {action === 'right' ? 'ADD TO PIPELINE' : 'DISMISS'}
          </Text>
        </View>
      )}

      <View style={styles.cardTop}>
        <View
          style={[
            styles.distressChip,
            { backgroundColor: typeColor + '15', borderColor: typeColor + '30' },
          ]}
        >
          <Text style={[styles.distressText, { color: typeColor }]}>{card.distressType}</Text>
        </View>
        <View
          style={[
            styles.scoreBox,
            { borderColor: scoreColor + '40', backgroundColor: scoreColor + '10' },
          ]}
        >
          <Text style={[styles.scoreLarge, { color: scoreColor }]}>{card.score}</Text>
          <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>score</Text>
        </View>
      </View>

      <Text style={[styles.cardAddress, { color: colors.cream }]}>{card.address}</Text>
      <Text style={[styles.cardBorough, { color: colors.mutedForeground }]}>{card.borough}</Text>

      <View
        style={[
          styles.cardStats,
          { borderTopColor: colors.border, borderBottomColor: colors.border },
        ]}
      >
        {[
          { label: 'ASKING', value: card.price },
          { label: 'DAYS', value: String(card.daysListed) },
          { label: 'OWNER', value: card.ownerName.split(' ').slice(-1)[0] },
        ].map((stat, i) => (
          <View
            key={stat.label}
            style={[
              styles.stat,
              { borderLeftWidth: i > 0 ? 1 : 0, borderLeftColor: colors.border },
            ]}
          >
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            <Text style={[styles.statValue, { color: colors.cream }]} numberOfLines={1}>
              {stat.value}
            </Text>
          </View>
        ))}
      </View>

      <Text style={[styles.thesisLabel, { color: colors.goldSubtle }]}>AI THESIS</Text>
      <Text style={[styles.thesis, { color: colors.creamDim }]}>{card.thesis}</Text>

      <View style={styles.cardActions}>
        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onSwipeLeft();
          }}
          style={[
            styles.cardAction,
            { backgroundColor: colors.rose + '10', borderColor: colors.rose + '30' },
          ]}
        >
          <Feather name="x" size={22} color={colors.rose} />
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSwipeRight();
          }}
          style={[
            styles.cardAction,
            { backgroundColor: colors.emerald + '10', borderColor: colors.emerald + '30' },
          ]}
        >
          <Feather name="check" size={22} color={colors.emerald} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function ScannerTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [cards, setCards] = useState<ScannerCard[]>([]);
  const [addedCount, setAddedCount] = useState(0);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);

  const [dismissedCount, setDismissedCount] = useState(0);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const syncEngine = useSyncEngine();

  const addToPipeline = useMutation({
    mutationFn: async (card: ScannerCard) => {
      const url = `${API_BASE}/terra/convert/distress-to-lead`;
      const idempotencyKey = `terra-convert-distress-${card.id}`;

      if (!syncEngine.isOnline) {
        await syncEngine.enqueue({
          domain: 'terra',
          method: 'POST',
          url,
          body: { propertyId: card.id },
          idempotencyKey,
        });
        return;
      }

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ propertyId: card.id }),
      });
    },
  });

  useEffect(() => {
    const loadDistressCards = async () => {
      setIsLoadingCards(true);
      try {
        const res = await fetch(
          API_BASE + '/terra/distress/search?limit=10&minScore=60&sort=opportunityScore',
        );
        if (res.ok) {
          const json = await res.json();
          const props = json.data?.properties ?? json.properties ?? [];
          if (props.length >= 3) {
            const mapped: ScannerCard[] = props
              .slice(0, 10)
              .map(
                (p: {
                  id: string;
                  address: string;
                  borough: string;
                  distressType: string;
                  opportunityScore: number;
                  estimatedValue: number;
                  daysInDistress: number;
                  ownerName: string;
                  thesis: string;
                }) => ({
                  id: p.id ?? String(Math.random()),
                  address: p.address,
                  borough: p.borough,
                  distressType:
                    p.distressType
                      ?.replace(/-/g, ' ')
                      ?.replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? 'Distress',
                  score: p.opportunityScore ?? 70,
                  price:
                    p.estimatedValue >= 1e6
                      ? '$' + (p.estimatedValue / 1e6).toFixed(1) + 'M'
                      : '$' + Math.round(p.estimatedValue / 1e3) + 'K',
                  daysListed: p.daysInDistress ?? 0,
                  ownerName: p.ownerName ?? 'Owner Unknown',
                  thesis:
                    p.thesis ?? 'High distress signal detected. Direct owner outreach recommended.',
                }),
              );
            setCards(mapped);
            setApiLoaded(true);
          }
        }
      } catch {}
      setIsLoadingCards(false);
    };
    loadDistressCards();
  }, []);

  const handleSwipeRight = (card: ScannerCard) => {
    addToPipeline.mutate(card);
    setAddedCount((n) => n + 1);
    setCards((prev) => prev.filter((c) => c.id !== card.id));
  };

  const handleSwipeLeft = (card: ScannerCard) => {
    setDismissedCount((n) => n + 1);
    setCards((prev) => prev.filter((c) => c.id !== card.id));
  };

  const resetCards = useCallback(async () => {
    setAddedCount(0);
    setDismissedCount(0);
    setCards([]);
    setIsLoadingCards(true);
    try {
      const res = await fetch(
        API_BASE + '/terra/distress/search?limit=10&minScore=60&sort=opportunityScore',
      );
      if (res.ok) {
        const json = await res.json();
        const props = json.data?.properties ?? json.properties ?? [];
        if (props.length > 0) {
          const mapped: ScannerCard[] = props
            .slice(0, 10)
            .map(
              (p: {
                id: string;
                address: string;
                borough: string;
                distressType: string;
                opportunityScore: number;
                estimatedValue: number;
                daysInDistress: number;
                ownerName: string;
                thesis: string;
              }) => ({
                id: p.id ?? String(Math.random()),
                address: p.address,
                borough: p.borough,
                distressType:
                  p.distressType
                    ?.replace(/-/g, ' ')
                    ?.replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? 'Distress',
                score: p.opportunityScore ?? 70,
                price:
                  p.estimatedValue >= 1e6
                    ? '$' + (p.estimatedValue / 1e6).toFixed(1) + 'M'
                    : '$' + Math.round(p.estimatedValue / 1e3) + 'K',
                daysListed: p.daysInDistress ?? 0,
                ownerName: p.ownerName ?? 'Owner Unknown',
                thesis:
                  p.thesis ?? 'High distress signal detected. Direct owner outreach recommended.',
              }),
            );
          setCards(mapped);
          setApiLoaded(true);
        }
      }
    } catch {}
    setIsLoadingCards(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(184,148,60,0.06)', 'transparent']}
        style={[styles.headerGradient, { height: topPad + 120 }]}
      />

      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.goldSubtle }]}>
            TERRA · DISTRESS SCANNER
          </Text>
          <Text style={[styles.title, { color: colors.cream }]}>Swipe to Decide</Text>
        </View>
        <View style={styles.counters}>
          <View style={[styles.counter, { backgroundColor: colors.emerald + '15' }]}>
            <Feather name="check" size={10} color={colors.emerald} />
            <Text style={[styles.counterText, { color: colors.emerald }]}>{addedCount}</Text>
          </View>
          <View style={[styles.counter, { backgroundColor: colors.rose + '15' }]}>
            <Feather name="x" size={10} color={colors.rose} />
            <Text style={[styles.counterText, { color: colors.rose }]}>{dismissedCount}</Text>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.dataSourceBadge,
          { backgroundColor: apiLoaded ? colors.emerald + '10' : colors.gold + '10' },
        ]}
      >
        <View
          style={[
            styles.dataSourceDot,
            { backgroundColor: apiLoaded ? colors.emerald : colors.gold },
          ]}
        />
        <Text
          style={[
            styles.dataSourceText,
            { color: apiLoaded ? colors.emerald : colors.mutedForeground },
          ]}
        >
          {apiLoaded ? 'Live API data' : isLoadingCards ? 'Loading…' : 'No data — pull to refresh'}
        </Text>
      </View>
      <View style={styles.instructions}>
        <View style={styles.instrItem}>
          <Feather name="arrow-right" size={12} color={colors.emerald} />
          <Text style={[styles.instrText, { color: colors.mutedForeground }]}>
            Swipe right to add to pipeline
          </Text>
        </View>
        <View style={styles.instrItem}>
          <Feather name="arrow-left" size={12} color={colors.rose} />
          <Text style={[styles.instrText, { color: colors.mutedForeground }]}>
            Swipe left to dismiss
          </Text>
        </View>
      </View>

      <View style={styles.deck}>
        {isLoadingCards ? (
          <View
            style={[
              styles.emptyDeck,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Feather name="loader" size={32} color={colors.gold} />
            <Text style={[styles.emptyTitle, { color: colors.cream }]}>Loading Properties...</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Fetching top distress properties
            </Text>
          </View>
        ) : cards.length === 0 ? (
          <View
            style={[
              styles.emptyDeck,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Feather name="check-circle" size={40} color={colors.emerald} />
            <Text style={[styles.emptyTitle, { color: colors.cream }]}>All Done!</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              {addedCount} added to pipeline · {dismissedCount} dismissed
            </Text>
            <Pressable
              onPress={resetCards}
              style={[
                styles.resetBtn,
                { backgroundColor: colors.goldDim, borderColor: colors.goldBorder },
              ]}
            >
              <Feather name="refresh-cw" size={14} color={colors.gold} />
              <Text style={[styles.resetText, { color: colors.gold }]}>Reload Properties</Text>
            </Pressable>
          </View>
        ) : (
          cards
            .slice(0, 3)
            .reverse()
            .map((card, i) => (
              <SwipeCard
                key={card.id}
                card={card}
                isTop={i === cards.slice(0, 3).length - 1}
                stackIndex={cards.slice(0, 3).length - 1 - i}
                onSwipeRight={() => handleSwipeRight(card)}
                onSwipeLeft={() => handleSwipeLeft(card)}
              />
            ))
        )}
      </View>

      {cards.length > 0 && (
        <Text style={[styles.remaining, { color: colors.mutedForeground }]}>
          {cards.length} properties remaining
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  eyebrow: { fontSize: 9, fontFamily: 'Inter_500Medium', letterSpacing: 3, marginBottom: 4 },
  title: { fontSize: 22, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3 },
  counters: { flexDirection: 'row', gap: 6 },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  counterText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  instructions: { flexDirection: 'row', gap: 16, paddingHorizontal: 20, paddingBottom: 10 },
  instrItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  instrText: { fontSize: 10, fontFamily: 'Inter_300Light' },
  deck: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  swipeCard: { position: 'absolute', width: '100%', borderRadius: 16, borderWidth: 1, padding: 20 },
  swipeLabel: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  swipeLabelText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  distressChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  distressText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  scoreBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreLarge: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  scoreLabel: { fontSize: 8, fontFamily: 'Inter_300Light' },
  cardAddress: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginBottom: 3 },
  cardBorough: { fontSize: 12, fontFamily: 'Inter_300Light', marginBottom: 14 },
  cardStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 10,
    marginBottom: 14,
  },
  stat: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  statLabel: {
    fontSize: 8,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  statValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  thesisLabel: { fontSize: 8, fontFamily: 'Inter_500Medium', letterSpacing: 2, marginBottom: 6 },
  thesis: { fontSize: 12, fontFamily: 'Inter_300Light', lineHeight: 18, marginBottom: 16 },
  cardActions: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  cardAction: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDeck: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_600SemiBold' },
  emptySubtitle: { fontSize: 13, fontFamily: 'Inter_300Light', textAlign: 'center' },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  resetText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  remaining: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Inter_300Light',
    paddingBottom: 100,
  },
  dataSourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  dataSourceDot: { width: 5, height: 5, borderRadius: 3 },
  dataSourceText: { fontSize: 9, fontFamily: 'Inter_500Medium' },
});
