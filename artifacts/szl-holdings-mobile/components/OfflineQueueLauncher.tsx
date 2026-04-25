import { Feather } from '@expo/vector-icons';
import { useSyncEngine } from '@szl-holdings/mobile-shared';
import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadAllQueued, OfflineQueuePanel } from '@/components/OfflineQueuePanel';
import { useColors } from '@/hooks/useColors';
import { giColors, giProductAccent, palette } from '@/lib/gi-bridge';

const ACCENT = giProductAccent.holdings;
const AMBER = palette.high;

export function useOfflineQueueCount(): number {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const items = await loadAllQueued();
      setCount(items.length);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return count;
}

interface OfflineQueueLauncherProps {
  count: number;
  isOffline: boolean;
}

export function OfflineQueueLauncherTab({ count, isOffline }: OfflineQueueLauncherProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (count === 0) return null;

  const accent = isOffline ? AMBER : ACCENT;

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={styles.tab}
        activeOpacity={0.7}
        accessibilityLabel={`Offline queue, ${count} pending`}
      >
        <View style={styles.tabInner}>
          <View style={styles.iconWrap}>
            <Feather name={isOffline ? 'wifi-off' : 'upload-cloud'} size={20} color={accent} />
            <View style={[styles.badge, { backgroundColor: accent }]}>
              <Text style={styles.badgeText}>{count > 99 ? '99+' : String(count)}</Text>
            </View>
          </View>
          <Text style={[styles.label, { color: accent, fontFamily: 'Inter_600SemiBold' }]}>
            Queue
          </Text>
        </View>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: colors.background ?? '#070a14',
                borderColor: colors.border ?? '#1e2433',
                paddingBottom: (insets.bottom || 12) + 12,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                <Feather name={isOffline ? 'wifi-off' : 'upload-cloud'} size={16} color={accent} />
                <Text style={[styles.sheetTitle, { color: colors.foreground ?? '#e5e7eb' }]}>
                  Offline Queue
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={20} color={colors.mutedForeground ?? '#6b7280'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground ?? '#6b7280' }]}>
              Actions queued while offline will sync automatically when connectivity returns.
              Discard any you no longer want submitted.
            </Text>
            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 8 }}>
              <OfflineQueuePanel
                isOffline={isOffline}
                refreshKey={refreshKey}
                onChanged={() => setRefreshKey((k) => k + 1)}
                defaultExpanded
              />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export function OfflineQueueLauncher() {
  const count = useOfflineQueueCount();
  const engine = useSyncEngine();
  const isOffline = !(engine?.isOnline ?? true);
  return <OfflineQueueLauncherTab count={count} isOffline={isOffline} />;
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 4,
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: giColors.bg.base,
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: '80%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: giColors.bg.raised,
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
  sheetSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 12,
  },
  scroll: {
    maxHeight: 480,
  },
});

export default OfflineQueueLauncher;
