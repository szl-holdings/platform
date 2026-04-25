import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { type ComponentProps, useCallback, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LYTE_COLORS } from '@/constants/colors';
import { useColors } from '@/hooks/useColors';

type FeatherName = ComponentProps<typeof Feather>['name'];

type BoardSection = 'decisions' | 'risks' | 'asks';

interface BoardItem {
  id: string;
  title: string;
  sub: string;
  urgency: string;
  impact: string;
  owner: string;
  pack: string;
  packColor: string;
  detail: string;
}

const DECISIONS: BoardItem[] = [
  {
    id: 'D-1',
    title: 'Authorize fuel surcharge — 3 vessels',
    sub: '22h stalled — SLA breach in 4h',
    urgency: 'Immediate',
    impact: '$2.1M',
    owner: 'Finance VP',
    pack: 'Vessels',
    packColor: '#38bdf8',
    detail:
      'Three vessels awaiting fuel surcharge approval. SLA breach window is 4 hours. Finance VP sign-off required — calendar conflict must be escalated to CFO.',
  },
  {
    id: 'D-2',
    title: 'Approve Q2 pricing revision',
    sub: '31h overdue — board deadline T+48h',
    urgency: 'Today',
    impact: '$1.2M',
    owner: 'CEO',
    pack: 'PRISM',
    packColor: '#d4a054',
    detail:
      'Pricing revision in executive queue 31h. Board deadline 17h away. Market window closes at midnight if unsigned.',
  },
  {
    id: 'D-3',
    title: 'Resolve AR ownership conflict',
    sub: 'Payments withheld — 18h unresolved',
    urgency: 'Today',
    impact: '$650K',
    owner: 'COO',
    pack: 'PRISM',
    packColor: '#d4a054',
    detail:
      'Single COO assignment decision unlocks $650K in payment processing. Two teams are contested — one choice needed.',
  },
];

const RISKS: BoardItem[] = [
  {
    id: 'R-1',
    title: 'Fleet ETA compliance gap',
    sub: '3 vessels outside SLA — penalty imminent',
    urgency: 'Critical',
    impact: '$2.1M',
    owner: 'Fleet Ops',
    pack: 'Vessels',
    packColor: '#38bdf8',
    detail:
      'M/V Meridian, Pacific Star, and Coral Wind operating outside SLA windows. Penalty clauses activate at 26h mark.',
  },
  {
    id: 'R-2',
    title: 'Q2 pricing miss window',
    sub: '17h to board deadline',
    urgency: 'High',
    impact: '$1.2M',
    owner: 'Revenue',
    pack: 'PRISM',
    packColor: '#d4a054',
    detail:
      'Pricing revision must be signed before market conditions shift at midnight. No second chance on this window.',
  },
  {
    id: 'R-3',
    title: 'Terra lease renewal legal hold',
    sub: '48h past due — tenant window closing',
    urgency: 'High',
    impact: '$320K',
    owner: 'Legal',
    pack: 'Terra',
    packColor: '#a07848',
    detail:
      'Missing exhibit B. Tenant can void renewal in 3 days. Property manager unresponsive for 48h.',
  },
];

const ASKS: BoardItem[] = [
  {
    id: 'A-1',
    title: 'Confirm fuel surcharge escalation path',
    sub: 'Who approves if Finance VP is unavailable?',
    urgency: 'Now',
    impact: '$2.1M at stake',
    owner: 'CFO',
    pack: 'Vessels',
    packColor: '#38bdf8',
    detail:
      'Finance VP is in calendar conflict. Who is the designated backup approver for fleet surcharge decisions? Answer needed in 2h.',
  },
  {
    id: 'A-2',
    title: 'Assign AR account owner',
    sub: 'One decision unblocks $650K',
    urgency: 'Today',
    impact: '$650K',
    owner: 'COO Office',
    pack: 'PRISM',
    packColor: '#d4a054',
    detail:
      'A single COO assignment will immediately unblock $650K in payment processing. No other action needed from leadership.',
  },
  {
    id: 'A-3',
    title: 'Authorize Terra property manager escalation',
    sub: 'PM unresponsive — need escalation auth',
    urgency: 'This week',
    impact: '$320K',
    owner: 'Carlota Jo Account',
    pack: 'Terra',
    packColor: '#a07848',
    detail:
      'Authorization needed to escalate directly to property management firm director and, if needed, engage legal.',
  },
];

type StylesType = ReturnType<typeof makeStyles>;

function BoardItemCard({
  item,
  type,
  expanded,
  onPress,
  styles,
  colors,
}: {
  item: BoardItem;
  type: BoardSection;
  expanded: boolean;
  onPress: () => void;
  styles: StylesType;
  colors: ReturnType<typeof useColors>;
}) {
  const urgencyColor =
    item.urgency === 'Immediate' || item.urgency === 'Critical' || item.urgency === 'Now'
      ? LYTE_COLORS.critical
      : item.urgency === 'Today' || item.urgency === 'High'
        ? LYTE_COLORS.high
        : LYTE_COLORS.medium;

  const typeColor =
    type === 'decisions' ? LYTE_COLORS.medium : type === 'risks' ? LYTE_COLORS.critical : '#8b7ac8';

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
    >
      <View style={[styles.itemCard, { borderColor: expanded ? `${typeColor}30` : colors.border }]}>
        <View style={styles.itemHeader}>
          <View style={styles.itemLeft}>
            <View style={styles.itemMeta}>
              <View style={[styles.packBadge, { backgroundColor: `${item.packColor}18` }]}>
                <Text style={[styles.packText, { color: item.packColor }]}>{item.pack}</Text>
              </View>
              <View style={[styles.urgencyBadge, { backgroundColor: `${urgencyColor}12` }]}>
                <Text style={[styles.urgencyText, { color: urgencyColor }]}>{item.urgency}</Text>
              </View>
            </View>
            <Text style={styles.itemTitle} numberOfLines={expanded ? undefined : 2}>
              {item.title}
            </Text>
            <Text style={styles.itemSub} numberOfLines={1}>
              {item.sub}
            </Text>
          </View>
          <View style={styles.itemRight}>
            <Text style={[styles.itemImpact, { color: LYTE_COLORS.high }]}>{item.impact}</Text>
            <Text style={styles.itemOwner}>{item.owner}</Text>
            <Feather
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.textTertiary}
            />
          </View>
        </View>
        {expanded && (
          <View style={styles.itemDetail}>
            <Text style={styles.itemDetailText}>{item.detail}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function SectionBlock({
  title,
  items,
  type,
  color,
  icon,
  styles,
  colors,
}: {
  title: string;
  items: BoardItem[];
  type: BoardSection;
  color: string;
  icon: FeatherName;
  styles: StylesType;
  colors: ReturnType<typeof useColors>;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconBox, { backgroundColor: `${color}12` }]}>
          <Feather name={icon} size={14} color={color} />
        </View>
        <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
        <View style={[styles.sectionCount, { backgroundColor: `${color}12` }]}>
          <Text style={[styles.sectionCountText, { color }]}>{items.length}</Text>
        </View>
      </View>
      {items.map((item) => (
        <BoardItemCard
          key={item.id}
          item={item}
          type={type}
          expanded={expandedId === item.id}
          onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
          styles={styles}
          colors={colors}
        />
      ))}
    </View>
  );
}

export default function BoardModeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [refreshing, setRefreshing] = useState(false);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 + 84 : 90;

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(212,160,84,0.06)', 'transparent']}
        style={[styles.headerGradient, { height: topPad + 120 }]}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: topPad + 16,
          paddingBottom: bottomPad,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={LYTE_COLORS.medium}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>EXECUTIVE BOARD MODE</Text>
            <Text style={styles.headerTitle}>Board Mode</Text>
            <Text style={styles.headerSub}>3 decisions · 3 risks · 3 asks · zero clutter</Text>
          </View>
          <View
            style={[
              styles.atRisk,
              { backgroundColor: 'rgba(196,90,74,0.10)', borderColor: 'rgba(196,90,74,0.25)' },
            ]}
          >
            <Text style={[styles.atRiskValue, { color: LYTE_COLORS.critical }]}>$4.17M</Text>
            <Text style={styles.atRiskLabel}>At Stake</Text>
          </View>
        </View>

        <View style={styles.dividerNote}>
          <Text style={styles.dividerNoteText}>
            Everything below is the highest-value action in the system. Nothing below this line
            requires your attention today.
          </Text>
        </View>

        <SectionBlock
          title="3 Decisions Required"
          items={DECISIONS}
          type="decisions"
          color={LYTE_COLORS.medium}
          icon="target"
          styles={styles}
          colors={colors}
        />
        <SectionBlock
          title="3 Risks On Your Radar"
          items={RISKS}
          type="risks"
          color={LYTE_COLORS.critical}
          icon="alert-triangle"
          styles={styles}
          colors={colors}
        />
        <SectionBlock
          title="3 Asks From the System"
          items={ASKS}
          type="asks"
          color="#8b7ac8"
          icon="help-circle"
          styles={styles}
          colors={colors}
        />
      </ScrollView>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    headerGradient: { position: 'absolute', top: 0, left: 0, right: 0 },
    scroll: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 14,
      gap: 12,
    },
    eyebrow: {
      fontSize: 9,
      fontFamily: 'Inter_500Medium',
      letterSpacing: 3,
      color: LYTE_COLORS.medium,
      marginBottom: 4,
    },
    headerTitle: {
      fontSize: 26,
      fontFamily: 'Inter_600SemiBold',
      color: c.textPrimary,
      marginBottom: 2,
    },
    headerSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: c.textSecondary },
    atRisk: {
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      alignItems: 'center',
    },
    atRiskValue: { fontSize: 15, fontFamily: 'Inter_700Bold', fontVariant: ['tabular-nums'] },
    atRiskLabel: {
      fontSize: 9,
      fontFamily: 'Inter_400Regular',
      color: c.textMuted,
      letterSpacing: 1,
    },
    dividerNote: {
      backgroundColor: c.surfaceElevated,
      borderRadius: 10,
      padding: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
    dividerNoteText: {
      fontSize: 10,
      fontFamily: 'Inter_400Regular',
      color: c.textTertiary,
      lineHeight: 16,
    },
    section: { marginBottom: 24, gap: 8 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    sectionIconBox: {
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Inter_600SemiBold',
      letterSpacing: 1,
      textTransform: 'uppercase',
      flex: 1,
    },
    sectionCount: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionCountText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
    itemCard: { borderRadius: 12, borderWidth: 1, backgroundColor: c.surface, overflow: 'hidden' },
    itemHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 10 },
    itemLeft: { flex: 1, gap: 6 },
    itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    packBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    packText: {
      fontSize: 8,
      fontFamily: 'Inter_600SemiBold',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    urgencyBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    urgencyText: { fontSize: 8, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
    itemTitle: {
      fontSize: 13,
      fontFamily: 'Inter_500Medium',
      color: c.textPrimary,
      lineHeight: 18,
    },
    itemSub: { fontSize: 10, fontFamily: 'Inter_400Regular', color: c.textSecondary },
    itemRight: { alignItems: 'flex-end', gap: 4 },
    itemImpact: { fontSize: 12, fontFamily: 'Inter_700Bold', fontVariant: ['tabular-nums'] },
    itemOwner: { fontSize: 9, fontFamily: 'Inter_400Regular', color: c.textTertiary },
    itemDetail: {
      paddingHorizontal: 14,
      paddingBottom: 14,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: 10,
    },
    itemDetailText: {
      fontSize: 11,
      fontFamily: 'Inter_400Regular',
      color: c.textSecondary,
      lineHeight: 17,
    },
  });
}
