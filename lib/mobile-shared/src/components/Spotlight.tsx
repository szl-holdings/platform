import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

/**
 * Mobile command interface — structurally aligned with CommandItem from
 * @szl-holdings/shared-ui/command-palette for cross-platform compatibility.
 * Use SpotlightCommand in mobile apps and CommandItem in web apps interchangeably.
 */
export interface SpotlightCommand {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  group?: string;
  keywords?: string[];
  action: () => void | Promise<void>;
  isQuickAction?: boolean;
  isSlashCommand?: boolean;
  shortcut?: string;
}

interface SpotlightModalProps {
  visible: boolean;
  onClose: () => void;
  commands: SpotlightCommand[];
  accentColor?: string;
  appName?: string;
  placeholder?: string;
}

interface SpotlightFabProps {
  onPress: () => void;
  accentColor?: string;
  bottom?: number;
  right?: number;
}

const RECENT_KEY_PREFIX = 'spotlight_recent_';
const MAX_RECENT = 5;

async function getRecentIds(key: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function recordRecentId(key: string, id: string): Promise<void> {
  try {
    const prev = await getRecentIds(key);
    const next = [id, ...prev.filter((x) => x !== id)].slice(0, MAX_RECENT);
    await AsyncStorage.setItem(key, JSON.stringify(next));
  } catch {}
}

function fuzzyMatch(query: string, text: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

type ListItem =
  | { type: 'header'; group: string }
  | { type: 'command'; command: SpotlightCommand; flatIndex: number };

export function SpotlightModal({
  visible,
  onClose,
  commands,
  accentColor = '#8b7ac8',
  appName,
  placeholder = 'Search screens & actions...',
}: SpotlightModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const storageKey = RECENT_KEY_PREFIX + (appName ?? 'app');

  useEffect(() => {
    if (visible) {
      setQuery('');
      setSelectedIndex(0);
      getRecentIds(storageKey).then(setRecentIds);
    }
  }, [visible, storageKey]);

  const recentCommands: SpotlightCommand[] = recentIds
    .map((id) => commands.find((c) => c.id === id))
    .filter(Boolean)
    .map((c) => ({ ...c!, group: 'Recent' })) as SpotlightCommand[];

  const quickActions = commands.filter((c) => c.isQuickAction);

  const flatFiltered: SpotlightCommand[] = query.trim()
    ? commands.filter((cmd) => {
        const text = [cmd.label, cmd.description ?? '', ...(cmd.keywords ?? [])].join(' ');
        return fuzzyMatch(query, text);
      })
    : [
        ...recentCommands,
        ...quickActions
          .filter((c) => !recentIds.includes(c.id))
          .map((c) => ({ ...c, group: 'Quick Actions' })),
        ...commands
          .filter((c) => !recentIds.includes(c.id) && !c.isQuickAction)
          .map((c) => ({ ...c })),
      ];

  const groupMap: Record<string, SpotlightCommand[]> = {};
  for (const cmd of flatFiltered) {
    const g = cmd.group ?? 'Navigate';
    if (!groupMap[g]) groupMap[g] = [];
    groupMap[g].push(cmd);
  }

  const listData: ListItem[] = [];
  let flatIdx = 0;
  for (const [group, items] of Object.entries(groupMap)) {
    listData.push({ type: 'header', group });
    for (const cmd of items) {
      listData.push({ type: 'command', command: cmd, flatIndex: flatIdx });
      flatIdx++;
    }
  }

  const runCommand = useCallback(
    async (cmd: SpotlightCommand) => {
      await recordRecentId(storageKey, cmd.id);
      cmd.action();
      onClose();
    },
    [storageKey, onClose],
  );

  const { width } = Dimensions.get('window');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOuter}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { width: Math.min(width - 32, 560) }]}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.androidBg]} />
          )}

          <View style={styles.sheetContent}>
            <View style={styles.inputRow}>
              <Text style={[styles.searchIcon, { color: `${accentColor}aa` }]}>⌕</Text>
              <TextInput
                value={query}
                onChangeText={(t) => {
                  setQuery(t);
                  setSelectedIndex(0);
                }}
                placeholder={placeholder}
                placeholderTextColor="rgba(255,255,255,0.25)"
                style={styles.input}
                autoFocus
                returnKeyType="go"
                onSubmitEditing={() => {
                  const first = flatFiltered[0];
                  if (first) runCommand(first);
                }}
              />
              {appName && (
                <View
                  style={[
                    styles.appBadge,
                    { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}44` },
                  ]}
                >
                  <Text style={[styles.appBadgeText, { color: accentColor }]}>{appName}</Text>
                </View>
              )}
              <TouchableOpacity onPress={onClose} style={styles.escButton}>
                <Text style={styles.escText}>ESC</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={listData}
              keyExtractor={(item, i) =>
                item.type === 'header' ? `h-${item.group}` : `c-${item.command.id}-${i}`
              }
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                query.trim() ? <Text style={styles.emptyText}>No results for "{query}"</Text> : null
              }
              renderItem={({ item }) => {
                if (item.type === 'header') {
                  return (
                    <Text
                      style={[
                        styles.groupHeader,
                        item.group === 'Recent' && { color: `${accentColor}99` },
                        item.group === 'Quick Actions' && { color: `${accentColor}cc` },
                      ]}
                    >
                      {item.group.toUpperCase()}
                    </Text>
                  );
                }
                const cmd = item.command;
                const isSelected = item.flatIndex === selectedIndex;
                return (
                  <TouchableOpacity
                    onPress={() => runCommand(cmd)}
                    style={[
                      styles.row,
                      isSelected
                        ? { backgroundColor: `${accentColor}18`, borderLeftColor: accentColor }
                        : { borderLeftColor: 'transparent' },
                    ]}
                    activeOpacity={0.7}
                  >
                    {cmd.icon ? (
                      <Text style={styles.rowIcon}>{cmd.icon}</Text>
                    ) : (
                      <View
                        style={[styles.rowIconPlaceholder, { backgroundColor: `${accentColor}18` }]}
                      >
                        <Text style={[styles.rowIconPlaceholderText, { color: accentColor }]}>
                          {cmd.label[0]}
                        </Text>
                      </View>
                    )}
                    <View style={styles.rowText}>
                      <Text
                        style={[styles.rowLabel, isSelected && { color: '#fff' }]}
                        numberOfLines={1}
                      >
                        {cmd.label}
                      </Text>
                      {cmd.description ? (
                        <Text style={styles.rowDesc} numberOfLines={1}>
                          {cmd.description}
                        </Text>
                      ) : null}
                    </View>
                    {cmd.isQuickAction && (
                      <View
                        style={[
                          styles.quickBadge,
                          { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}44` },
                        ]}
                      >
                        <Text style={[styles.quickBadgeText, { color: accentColor }]}>Action</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>tap to navigate · tap outside to close</Text>
              <Text style={[styles.footerCount, { color: `${accentColor}66` }]}>
                {flatFiltered.length} commands
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function SpotlightFab({
  onPress,
  accentColor = '#8b7ac8',
  bottom = 100,
  right = 20,
}: SpotlightFabProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.fab,
        {
          bottom,
          right,
          backgroundColor: `${accentColor}22`,
          borderColor: `${accentColor}55`,
        },
      ]}
      activeOpacity={0.8}
    >
      <Text style={[styles.fabIcon, { color: accentColor }]}>⌕</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 22,
    fontWeight: '300',
  },
  modalOuter: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    maxHeight: '70%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 20,
  },
  androidBg: {
    backgroundColor: 'rgba(8,10,18,0.97)',
  },
  sheetContent: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    gap: 8,
  },
  searchIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    padding: 0,
    margin: 0,
  },
  appBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  appBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  escButton: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  escText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  list: {
    maxHeight: 380,
  },
  emptyText: {
    padding: 40,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
  },
  groupHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.3)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 10,
    borderLeftWidth: 2,
  },
  rowIcon: {
    fontSize: 16,
    width: 22,
    textAlign: 'center',
  },
  rowIconPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconPlaceholderText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
  },
  rowDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 1,
  },
  quickBadge: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  quickBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  footerText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
  },
  footerCount: {
    fontSize: 10,
  },
});
