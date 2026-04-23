import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { promptBiometric, useBiometricLock } from '@/context/BiometricLockContext';
import { useColors } from '@/hooks/useColors';

const QUARTERLY_LETTERS = [
  {
    id: 'q1-2026',
    title: 'Q1 2026 Investor Letter',
    quarter: 'Q1 2026',
    excerpt:
      'PARAGON FedRAMP track opens. Enterprise client expansion across SEXTANT and Lyte. Platform architecture milestone delivered.',
    date: 'March 31, 2026',
  },
  {
    id: 'q4-2025',
    title: 'Q4 2025 Investor Letter',
    quarter: 'Q4 2025',
    excerpt:
      'Year in review: 6 live platforms, FORGE 2.0 convergence, KORA executive command launch, mobile platform launch.',
    date: 'December 31, 2025',
  },
  {
    id: 'q3-2025',
    title: 'Q3 2025 Investor Letter',
    quarter: 'Q3 2025',
    excerpt:
      'SEXTANT dark vessel detection lead time improvements. DOMAINE NYC expansion progressing. PARAGON SOC capabilities expanded.',
    date: 'September 30, 2025',
  },
];

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

const STRATEGIC_PRIORITIES: Array<{
  title: string;
  body: string;
  color: string;
  icon: FeatherIconName;
}> = [
  {
    title: 'FedRAMP & Federal Expansion',
    body: 'PARAGON is on the federal readiness track. Defense and intelligence capabilities position the platform for federal sector expansion.',
    color: '#6366f1',
    icon: 'shield',
  },
  {
    title: 'FORGE Scenario API',
    body: 'External API offering built on the FORGE scenario modeling engine — creates a new commercial revenue vector for enterprise integrations.',
    color: '#8b5cf6',
    icon: 'zap',
  },
  {
    title: 'Maritime Climate Routing',
    body: 'SEXTANT climate routing overlay for charter optimization and route risk intelligence.',
    color: '#3b82f6',
    icon: 'anchor',
  },
  {
    title: 'DOMAINE National Coverage',
    body: 'Expanding beyond NYC to national distressed property coverage with API-first architecture for institutional integrations.',
    color: '#4d7c0f',
    icon: 'map',
  },
];

const CAP_TABLE_ITEMS = [
  { entity: 'Founder & Management', ownership: 'Majority', color: '#c9a84c' },
  { entity: 'Strategic Investors', ownership: 'Minority', color: '#8b5cf6' },
  { entity: 'Advisory & Option Pool', ownership: 'Reserved', color: '#3b82f6' },
];

const DOCUMENTS: Array<{ name: string; type: string; icon: FeatherIconName }> = [
  { name: 'SZL Holdings One-Pager', type: 'Overview', icon: 'file-text' },
  { name: 'Platform Architecture Brief', type: 'Technical', icon: 'layers' },
  { name: 'Market Opportunity Summary', type: 'Strategic', icon: 'trending-up' },
  { name: 'Q1 2026 Investor Letter', type: 'Letter', icon: 'mail' },
];

function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : '';
}

export default function InvestorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { biometricEnabled } = useBiometricLock();
  const [biometricUnlocked, setBiometricUnlocked] = useState(false);
  const [biometricChecking, setBiometricChecking] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedLetter, setExpandedLetter] = useState<string | null>(null);
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);

  useEffect(() => {
    if (!biometricEnabled || Platform.OS === 'web') {
      setBiometricUnlocked(true);
      setBiometricChecking(false);
      return;
    }
    promptBiometric('Authenticate to view Investor Relations').then((ok) => {
      setBiometricUnlocked(ok);
      setBiometricChecking(false);
    });
  }, [biometricEnabled]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 + 84 : 90;

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  }, []);

  const handleDocDownload = useCallback(async (docName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoadingDoc(docName);
    try {
      const slug = encodeURIComponent(docName.toLowerCase().replace(/\s+/g, '-'));
      const apiBase = getApiBase();
      const endpoint = `${apiBase}/api/holdings/documents/${slug}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const { url } = (await res.json()) as { url: string };
        await WebBrowser.openBrowserAsync(url, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        });
      } else {
        Alert.alert(
          'Document Unavailable',
          'This document is not yet available for download. Contact investor relations to request access.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Email IR Team',
              onPress: () =>
                Linking.openURL(
                  `mailto:hello@szlholdings.com?subject=Document Request: ${encodeURIComponent(docName)}`,
                ),
            },
          ],
        );
      }
    } catch {
      Alert.alert(
        'Document Unavailable',
        'Unable to retrieve the document. Please try again or contact investor relations.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Email IR Team',
            onPress: () =>
              Linking.openURL(
                `mailto:hello@szlholdings.com?subject=Document Request: ${encodeURIComponent(docName)}`,
              ),
          },
        ],
      );
    } finally {
      setLoadingDoc(null);
    }
  }, []);

  const handleDocRequest = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Request Documents',
      'Contact investor relations to request full document access.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email IR Team',
          onPress: () =>
            Linking.openURL('mailto:hello@szlholdings.com?subject=Investor Document Request'),
        },
      ],
    );
  }, []);

  if (biometricChecking) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <ActivityIndicator color="#c9a84c" size="large" />
      </View>
    );
  }

  if (biometricEnabled && !biometricUnlocked) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          },
        ]}
      >
        <Feather name="lock" size={36} color="#c9a84c" />
        <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.textPrimary, fontSize: 18 }}>
          Authentication Required
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            color: colors.textSecondary,
            fontSize: 13,
            textAlign: 'center',
            maxWidth: 260,
          }}
        >
          Biometric authentication is required to view investor relations.
        </Text>
        <Pressable
          style={{
            backgroundColor: '#c9a84c',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 10,
            marginTop: 8,
          }}
          onPress={() => {
            setBiometricChecking(true);
            promptBiometric('Authenticate to view Investor Relations').then((ok) => {
              setBiometricUnlocked(ok);
              setBiometricChecking(false);
            });
          }}
        >
          <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#090810', fontSize: 14 }}>
            Authenticate
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(201,168,76,0.05)', 'transparent']}
        style={[styles.headerGradient, { height: topPad + 120 }]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPad + 16, paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.goldSubtle }]}>INVESTOR RELATIONS</Text>
          <Text style={[styles.title, { color: colors.cream }]}>
            One company.{'\n'}Three revenue tracks.
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            SZL Holdings is building command-layer infrastructure for organizations where
            unreliability is not a recoverable condition.
          </Text>
        </View>

        <View style={[styles.section, { borderTopColor: colors.borderSubtle }]}>
          <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>CAP TABLE SUMMARY</Text>
          <View
            style={[
              styles.capTable,
              { backgroundColor: colors.card, borderColor: colors.borderSubtle },
            ]}
          >
            {CAP_TABLE_ITEMS.map((item, i) => (
              <View
                key={item.entity}
                style={[
                  styles.capTableRow,
                  {
                    borderBottomColor: colors.borderSubtle,
                    borderBottomWidth: i < CAP_TABLE_ITEMS.length - 1 ? 1 : 0,
                  },
                ]}
              >
                <View style={[styles.capDot, { backgroundColor: item.color }]} />
                <Text style={[styles.capEntity, { color: colors.cream }]}>{item.entity}</Text>
                <Text style={[styles.capOwnership, { color: item.color }]}>{item.ownership}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, { borderTopColor: colors.borderSubtle }]}>
          <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>QUARTERLY LETTERS</Text>
          <View style={{ gap: 8 }}>
            {QUARTERLY_LETTERS.map((letter) => (
              <Pressable
                key={letter.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setExpandedLetter(expandedLetter === letter.id ? null : letter.id);
                }}
              >
                <View
                  style={[
                    styles.letterCard,
                    {
                      backgroundColor: colors.card,
                      borderColor:
                        expandedLetter === letter.id ? colors.goldBorder : colors.borderSubtle,
                    },
                  ]}
                >
                  <View style={styles.letterTop}>
                    <View style={styles.letterLeft}>
                      <Text style={[styles.letterQuarter, { color: colors.gold }]}>
                        {letter.quarter}
                      </Text>
                      <Text style={[styles.letterTitle, { color: colors.cream }]}>
                        {letter.title}
                      </Text>
                      <Text style={[styles.letterDate, { color: colors.mutedForeground }]}>
                        {letter.date}
                      </Text>
                    </View>
                    <Feather
                      name={expandedLetter === letter.id ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={colors.mutedForeground}
                    />
                  </View>
                  {expandedLetter === letter.id && (
                    <View style={[styles.letterExpanded, { borderTopColor: colors.borderSubtle }]}>
                      <Text style={[styles.letterExcerpt, { color: colors.creamDim }]}>
                        {letter.excerpt}
                      </Text>
                      <Pressable
                        style={[styles.downloadBtn, { borderColor: colors.goldBorder }]}
                        onPress={handleDocRequest}
                      >
                        <Feather name="download" size={13} color={colors.gold} />
                        <Text style={[styles.downloadBtnText, { color: colors.gold }]}>
                          Request PDF
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.section, { borderTopColor: colors.borderSubtle }]}>
          <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>
            STRATEGIC PRIORITIES
          </Text>
          <View style={{ gap: 8 }}>
            {STRATEGIC_PRIORITIES.map((p) => (
              <View
                key={p.title}
                style={[
                  styles.priorityCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: `${p.color}20`,
                  },
                ]}
              >
                <View style={[styles.priorityIcon, { backgroundColor: `${p.color}15` }]}>
                  <Feather name={p.icon} size={14} color={p.color} />
                </View>
                <View style={styles.priorityContent}>
                  <Text style={[styles.priorityTitle, { color: colors.cream }]}>{p.title}</Text>
                  <Text style={[styles.priorityBody, { color: colors.mutedForeground }]}>
                    {p.body}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, { borderTopColor: colors.borderSubtle }]}>
          <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>DOCUMENTS</Text>
          <View style={[styles.docList, { borderColor: colors.borderSubtle }]}>
            {DOCUMENTS.map((doc, i) => (
              <Pressable
                key={doc.name}
                onPress={() => handleDocDownload(doc.name)}
                disabled={loadingDoc === doc.name}
              >
                <View
                  style={[
                    styles.docRow,
                    {
                      borderBottomColor: colors.borderSubtle,
                      borderBottomWidth: i < DOCUMENTS.length - 1 ? 1 : 0,
                      opacity: loadingDoc === doc.name ? 0.5 : 1,
                    },
                  ]}
                >
                  <View style={[styles.docIcon, { backgroundColor: colors.goldDim }]}>
                    <Feather name={doc.icon} size={13} color={colors.gold} />
                  </View>
                  <View style={styles.docContent}>
                    <Text style={[styles.docName, { color: colors.cream }]}>{doc.name}</Text>
                    <Text style={[styles.docType, { color: colors.mutedForeground }]}>
                      {doc.type}
                    </Text>
                  </View>
                  <Feather
                    name={loadingDoc === doc.name ? 'loader' : 'download'}
                    size={14}
                    color={colors.goldSubtle}
                  />
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          style={[styles.contactBtn, { borderColor: colors.goldBorder }]}
          onPress={() => Linking.openURL('mailto:hello@szlholdings.com?subject=Investor Inquiry')}
        >
          <Feather name="mail" size={15} color={colors.gold} />
          <Text style={[styles.contactBtnText, { color: colors.gold }]}>hello@szlholdings.com</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: { marginBottom: 20 },
  eyebrow: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 3,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_300Light',
    lineHeight: 30,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter_300Light',
    lineHeight: 20,
  },
  section: {
    borderTopWidth: 1,
    paddingTop: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 3,
    marginBottom: 14,
  },
  capTable: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  capTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  capDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  capEntity: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_300Light',
  },
  capOwnership: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  letterCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  letterTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  letterLeft: { flex: 1, gap: 3, paddingRight: 12 },
  letterQuarter: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  letterTitle: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  letterDate: {
    fontSize: 10,
    fontFamily: 'Inter_300Light',
  },
  letterExpanded: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
    gap: 10,
  },
  letterExcerpt: {
    fontSize: 13,
    fontFamily: 'Inter_300Light',
    lineHeight: 20,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  downloadBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  priorityCard: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  priorityIcon: {
    width: 32,
    height: 32,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  priorityContent: { flex: 1, gap: 4 },
  priorityTitle: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  priorityBody: {
    fontSize: 12,
    fontFamily: 'Inter_300Light',
    lineHeight: 18,
  },
  docList: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  docIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docContent: { flex: 1, gap: 2 },
  docName: {
    fontSize: 13,
    fontFamily: 'Inter_300Light',
  },
  docType: {
    fontSize: 9,
    fontFamily: 'Inter_300Light',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  contactBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
