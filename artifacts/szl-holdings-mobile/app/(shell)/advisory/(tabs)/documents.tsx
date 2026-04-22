import { Feather } from '@expo/vector-icons';
import { fromDocumentPickerResult, useFileUpload } from '@szl-holdings/mobile-shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : '';

type Document = {
  id: number | string;
  name: string;
  date: string;
  status: string;
  category: string;
  size: string;
};

const CATEGORIES = ['All', 'Governance', 'Operations', 'Staffing', 'Vendors', 'Reporting'];

function getStatusStyle(status: string) {
  if (status === 'New' || status === 'Awaiting review') {
    return { isHighlight: true };
  }
  return { isHighlight: false };
}

function BiometricGate({
  onUnlock,
  colors,
}: {
  onUnlock: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [authError, setAuthError] = useState('');
  const [authing, setAuthing] = useState(false);
  const shakeVal = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeVal.value }],
  }));

  const handleAuth = async () => {
    if (Platform.OS === 'web') {
      onUnlock();
      return;
    }
    setAuthing(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Document Vault',
        fallbackLabel: 'Enter Passcode',
      });
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onUnlock();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setAuthError('Authentication failed — tap to try again');
        shakeVal.value = withTiming(0, { duration: 0 });
        setTimeout(() => {
          shakeVal.value = withTiming(10, { duration: 60 });
          setTimeout(() => {
            shakeVal.value = withTiming(-10, { duration: 60 });
          }, 60);
          setTimeout(() => {
            shakeVal.value = withTiming(6, { duration: 60 });
          }, 120);
          setTimeout(() => {
            shakeVal.value = withTiming(0, { duration: 60 });
          }, 180);
        }, 10);
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAuthError('Authentication error — tap to try again');
    }
    setAuthing(false);
  };

  return (
    <View
      style={[
        gateStyles.container,
        { backgroundColor: colors.background, paddingTop: topPad + 40 },
      ]}
    >
      <LinearGradient
        colors={['rgba(200,169,106,0.05)', 'transparent']}
        style={[gateStyles.gradient, { height: topPad + 100 }]}
      />
      <Animated.View style={[gateStyles.content, shakeStyle]}>
        <View
          style={[
            gateStyles.iconWrap,
            { borderColor: colors.goldBorder, backgroundColor: colors.goldDim },
          ]}
        >
          <Feather name="lock" size={28} color={colors.gold} />
        </View>
        <Text style={[gateStyles.eyebrow, { color: colors.goldSubtle }]}>DOCUMENT VAULT</Text>
        <Text style={[gateStyles.title, { color: colors.cream }]}>Secured Access</Text>
        <Text style={[gateStyles.desc, { color: colors.mutedForeground }]}>
          Your document vault is protected.{'\n'}Authenticate to continue.
        </Text>
        {authError ? (
          <Text style={[gateStyles.error, { color: '#ef4444' }]}>{authError}</Text>
        ) : null}
        <Pressable
          onPress={handleAuth}
          disabled={authing}
          style={({ pressed }) => [
            gateStyles.authBtn,
            { backgroundColor: colors.gold, opacity: pressed || authing ? 0.8 : 1 },
          ]}
        >
          <Feather
            name={Platform.OS === 'web' ? 'unlock' : 'shield'}
            size={16}
            color={colors.inkDeep}
          />
          <Text style={[gateStyles.authBtnText, { color: colors.inkDeep }]}>
            {Platform.OS === 'web' ? 'Open Vault' : 'Authenticate'}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const gateStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0 },
  content: { alignItems: 'center', paddingHorizontal: 40 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  eyebrow: { fontSize: 9, fontFamily: 'Inter_500Medium', letterSpacing: 3, marginBottom: 8 },
  title: {
    fontSize: 28,
    fontFamily: 'CormorantGaramond_400Regular',
    marginBottom: 12,
    textAlign: 'center',
  },
  desc: {
    fontSize: 13,
    fontFamily: 'Inter_300Light',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  error: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 8, textAlign: 'center' },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 0,
    marginTop: 16,
  },
  authBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});

export default function DocumentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    upload,
    status: uploadStatus,
    progress: uploadProgress,
    error: uploadError,
    reset: resetUpload,
  } = useFileUpload({
    apiBase: API_BASE,
    context: 'carlota-jo-vault',
    onProgress: (p) => {
      if (p === 100) {
        setTimeout(() => {
          qc.invalidateQueries({ queryKey: ['carlota-documents'] });
          resetUpload();
        }, 1000);
      }
    },
  });

  const handleUpload = useCallback(
    async (file: { uri: string; name: string; type: string; size?: number }) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await upload(file);
      qc.invalidateQueries({ queryKey: ['carlota-documents'] });
    },
    [upload, qc],
  );

  const triggerUpload = useCallback(() => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    } else {
      import('expo-document-picker')
        .then(async ({ getDocumentAsync }) => {
          const result = await getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true,
            multiple: false,
          });
          if (!result.canceled && result.assets?.[0]) {
            handleUpload(fromDocumentPickerResult(result.assets?.[0]));
          }
        })
        .catch(() => {});
    }
  }, [handleUpload]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 + 84 : 90;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['carlota-documents'],
    queryFn: async (): Promise<Document[]> => {
      const res = await fetch(`${API_BASE}/carlotajo/documents`);
      if (!res.ok) throw new Error('fetch failed');
      const json = await res.json();
      return json.data ?? json.documents ?? json ?? [];
    },
    retry: 1,
    enabled: unlocked,
  });

  const documents: Document[] = data ?? [];

  if (!unlocked) {
    return <BiometricGate onUnlock={() => setUnlocked(true)} colors={colors} />;
  }

  const filtered = filter === 'All' ? documents : documents.filter((d) => d.category === filter);

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const awaitingCount = documents.filter(
    (d) => d.status === 'Awaiting review' || d.status === 'New',
  ).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(200,169,106,0.05)', 'transparent']}
        style={[styles.headerGradient, { height: topPad + 80 }]}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 16, paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
        }
      >
        <Text style={[styles.eyebrow, { color: colors.goldSubtle }]}>DOCUMENT VAULT</Text>
        <Text style={[styles.title, { color: colors.cream }]}>Shared Materials</Text>

        {Platform.OS === 'web' && (
          <input
            ref={fileInputRef as React.RefObject<HTMLInputElement>}
            type="file"
            accept="*/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const uri = URL.createObjectURL(file);
                handleUpload({ uri, name: file.name, type: file.type, size: file.size });
              }
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          />
        )}

        {awaitingCount > 0 && (
          <View
            style={[
              styles.alertBanner,
              { borderColor: colors.goldBorder, backgroundColor: colors.goldDim },
            ]}
          >
            <Feather name="bell" size={12} color={colors.gold} />
            <Text style={[styles.alertText, { color: colors.gold }]}>
              {awaitingCount} document{awaitingCount > 1 ? 's' : ''} awaiting your review
            </Text>
          </View>
        )}

        <Pressable
          onPress={triggerUpload}
          disabled={
            uploadStatus === 'uploading' ||
            uploadStatus === 'requesting' ||
            uploadStatus === 'registering'
          }
          style={({ pressed }) => [
            styles.uploadBtn,
            {
              borderColor: colors.goldBorder,
              backgroundColor: colors.goldDim,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="upload" size={13} color={colors.gold} />
          <Text style={[styles.uploadBtnText, { color: colors.gold }]}>
            {uploadStatus === 'uploading'
              ? `Uploading ${uploadProgress}%…`
              : uploadStatus === 'requesting'
                ? 'Preparing upload…'
                : uploadStatus === 'registering'
                  ? 'Saving…'
                  : uploadStatus === 'done'
                    ? 'Upload complete'
                    : 'Upload Document'}
          </Text>
        </Pressable>

        {(uploadStatus === 'uploading' || uploadStatus === 'requesting') && (
          <View style={[styles.progressBar, { borderColor: colors.goldBorder }]}>
            <View
              style={[
                styles.progressFill,
                { flex: Math.max(uploadProgress, 1), backgroundColor: colors.gold },
              ]}
            />
            <View style={{ flex: Math.max(100 - uploadProgress, 0) }} />
          </View>
        )}

        {uploadError && (
          <Text style={[styles.uploadError, { color: '#ef4444' }]}>{uploadError}</Text>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <View style={styles.filterInner}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter(cat);
                }}
              >
                <View
                  style={[
                    styles.filterChip,
                    {
                      borderColor: filter === cat ? colors.gold : colors.creamFaint,
                      backgroundColor: filter === cat ? colors.goldDim : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: filter === cat ? colors.gold : colors.creamDim },
                    ]}
                  >
                    {cat}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {isLoading && (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.gold} />
            <Text style={[styles.footNote, { color: colors.mutedForeground, marginTop: 12 }]}>
              Loading documents…
            </Text>
          </View>
        )}
        {isError && !isLoading && (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <Feather name="alert-circle" size={24} color={colors.mutedForeground} />
            <Text style={[styles.footNote, { color: colors.mutedForeground, marginTop: 8 }]}>
              Unable to load documents
            </Text>
          </View>
        )}
        {!isLoading && !isError && (
          <View style={[styles.docList, { borderColor: colors.creamFaint }]}>
            {filtered.map((doc, idx) => {
              const { isHighlight } = getStatusStyle(doc.status);
              return (
                <Pressable key={doc.id} onPress={() => Haptics.selectionAsync()}>
                  <View
                    style={[
                      styles.docRow,
                      {
                        borderBottomColor:
                          idx < filtered.length - 1 ? colors.creamFaint : 'transparent',
                      },
                    ]}
                  >
                    <View style={styles.docLeft}>
                      <View style={styles.docMeta}>
                        <View
                          style={[styles.categoryBadge, { borderColor: 'rgba(200,169,106,0.12)' }]}
                        >
                          <Text
                            style={[styles.categoryBadgeText, { color: 'rgba(200,169,106,0.4)' }]}
                          >
                            {doc.category}
                          </Text>
                        </View>
                        {isHighlight && (
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: 'rgba(200,169,106,0.1)' },
                            ]}
                          >
                            <Text style={[styles.statusBadgeText, { color: colors.gold }]}>
                              {doc.status}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.docName, { color: 'rgba(245,240,232,0.75)' }]}>
                        {doc.name}
                      </Text>
                      <Text style={[styles.docInfo, { color: colors.mutedForeground }]}>
                        {doc.date} · {doc.size}
                      </Text>
                    </View>
                    <View style={styles.docActions}>
                      <Pressable style={styles.docAction} onPress={() => Haptics.selectionAsync()}>
                        <Feather name="eye" size={14} color="rgba(245,240,232,0.25)" />
                      </Pressable>
                      <Pressable style={styles.docAction} onPress={() => Haptics.selectionAsync()}>
                        <Feather name="download" size={14} color="rgba(245,240,232,0.25)" />
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            })}
            {filtered.length === 0 && (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Feather name="folder" size={20} color={colors.mutedForeground} />
                <Text style={[styles.footNote, { color: colors.mutedForeground, marginTop: 8 }]}>
                  No documents in this category
                </Text>
              </View>
            )}
          </View>
        )}

        <Text style={[styles.footNote, { color: colors.mutedForeground }]}>
          {filtered.length} document{filtered.length !== 1 ? 's' : ''}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0 },
  content: { paddingHorizontal: 20 },
  eyebrow: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 3,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: 'CormorantGaramond_400Regular',
    marginBottom: 20,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  alertText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.3,
  },
  filterRow: { marginBottom: 16 },
  filterInner: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  filterChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipText: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  docList: {
    borderWidth: 1,
    marginBottom: 16,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  docLeft: { flex: 1 },
  docMeta: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    fontSize: 8,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 8,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  docName: {
    fontSize: 13,
    fontFamily: 'Inter_300Light',
    lineHeight: 18,
    marginBottom: 4,
  },
  docInfo: {
    fontSize: 10,
    fontFamily: 'Inter_300Light',
  },
  docActions: {
    flexDirection: 'row',
    gap: 8,
  },
  docAction: {
    padding: 6,
  },
  footNote: {
    fontSize: 10,
    fontFamily: 'Inter_300Light',
    textAlign: 'center',
    marginBottom: 8,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  uploadBtnText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  progressBar: {
    height: 2,
    borderTopWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progressFill: {
    height: 2,
  },
  uploadError: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
});
