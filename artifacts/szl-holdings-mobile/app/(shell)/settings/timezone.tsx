import { Feather } from '@expo/vector-icons';
import {
  formatInUserTimeZone,
  getDeviceTimeZone,
  useUserPreferences,
} from '@szl-holdings/mobile-shared';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const ACCENT = '#c9a84c';

// Curated list of common IANA zones — keeps the picker scannable without
// shipping the full ~600-entry tzdata. Users can search for any other zone
// and we'll accept it as long as Intl.DateTimeFormat resolves it.
const COMMON_ZONES: Array<{ id: string; label: string }> = [
  { id: 'Pacific/Honolulu', label: 'Hawaii' },
  { id: 'America/Anchorage', label: 'Alaska' },
  { id: 'America/Los_Angeles', label: 'Los Angeles · Pacific' },
  { id: 'America/Denver', label: 'Denver · Mountain' },
  { id: 'America/Chicago', label: 'Chicago · Central' },
  { id: 'America/New_York', label: 'New York · Eastern' },
  { id: 'America/Toronto', label: 'Toronto' },
  { id: 'America/Sao_Paulo', label: 'São Paulo' },
  { id: 'Europe/London', label: 'London' },
  { id: 'Europe/Dublin', label: 'Dublin' },
  { id: 'Europe/Paris', label: 'Paris' },
  { id: 'Europe/Berlin', label: 'Berlin' },
  { id: 'Europe/Madrid', label: 'Madrid' },
  { id: 'Europe/Athens', label: 'Athens' },
  { id: 'Africa/Johannesburg', label: 'Johannesburg' },
  { id: 'Asia/Dubai', label: 'Dubai' },
  { id: 'Asia/Karachi', label: 'Karachi' },
  { id: 'Asia/Kolkata', label: 'Mumbai · India' },
  { id: 'Asia/Bangkok', label: 'Bangkok' },
  { id: 'Asia/Singapore', label: 'Singapore' },
  { id: 'Asia/Hong_Kong', label: 'Hong Kong' },
  { id: 'Asia/Shanghai', label: 'Shanghai' },
  { id: 'Asia/Tokyo', label: 'Tokyo' },
  { id: 'Asia/Seoul', label: 'Seoul' },
  { id: 'Australia/Perth', label: 'Perth' },
  { id: 'Australia/Sydney', label: 'Sydney' },
  { id: 'Pacific/Auckland', label: 'Auckland' },
  { id: 'UTC', label: 'UTC' },
];

function isValidTimeZone(zone: string): boolean {
  if (!zone || zone.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

function offsetLabel(zone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date());
    const offset = parts.find((p) => p.type === 'timeZoneName')?.value;
    return offset ?? '';
  } catch {
    return '';
  }
}

export default function TimezonePickerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prefs, setPreference } = useUserPreferences();
  const deviceZone = useMemo(() => getDeviceTimeZone(), []);
  const [query, setQuery] = useState('');

  const selectedZone = prefs.time_zone;
  const previewZone = selectedZone ?? deviceZone;
  const nowSample = useMemo(
    () =>
      formatInUserTimeZone(
        new Date(),
        {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        },
        'en-US',
        previewZone,
      ),
    [previewZone, selectedZone],
  );

  const filteredZones = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMON_ZONES;
    return COMMON_ZONES.filter(
      (z) => z.id.toLowerCase().includes(q) || z.label.toLowerCase().includes(q),
    );
  }, [query]);

  // Allow selecting an exact-match IANA zone the user typed even if it's not
  // in the curated list (e.g. "Europe/Lisbon").
  const customCandidate = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    if (COMMON_ZONES.some((z) => z.id.toLowerCase() === q.toLowerCase())) return null;
    if (!isValidTimeZone(q)) return null;
    return q;
  }, [query]);

  function selectZone(zone: string | null) {
    setPreference('time_zone', zone);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Time Zone</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.previewCard,
            { backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}30` },
          ]}
        >
          <Text style={[styles.previewLabel, { color: `${ACCENT}` }]}>CURRENT</Text>
          <Text style={[styles.previewZone, { color: colors.foreground }]}>{previewZone}</Text>
          <Text style={[styles.previewSample, { color: colors.mutedForeground }]}>{nowSample}</Text>
          {!selectedZone && (
            <Text style={[styles.previewHint, { color: colors.mutedForeground }]}>
              Using your device's time zone. Pick one below to keep timestamps consistent across web
              and mobile.
            </Text>
          )}
        </View>

        <View
          style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="search" size={14} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search city or IANA zone…"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DEFAULT</Text>
        <TouchableOpacity
          onPress={() => selectZone(null)}
          style={[
            styles.zoneRow,
            {
              backgroundColor: colors.card,
              borderColor: selectedZone === null ? `${ACCENT}50` : colors.border,
            },
          ]}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.zoneLabel, { color: colors.foreground }]}>
              Use device time zone
            </Text>
            <Text style={[styles.zoneId, { color: colors.mutedForeground }]}>{deviceZone}</Text>
          </View>
          {selectedZone === null && <Feather name="check" size={16} color={ACCENT} />}
        </TouchableOpacity>

        {customCandidate && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CUSTOM</Text>
            <TouchableOpacity
              onPress={() => selectZone(customCandidate)}
              style={[
                styles.zoneRow,
                {
                  backgroundColor: colors.card,
                  borderColor: selectedZone === customCandidate ? `${ACCENT}50` : colors.border,
                },
              ]}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.zoneLabel, { color: colors.foreground }]}>
                  {customCandidate}
                </Text>
                <Text style={[styles.zoneId, { color: colors.mutedForeground }]}>
                  {offsetLabel(customCandidate) || 'Custom IANA zone'}
                </Text>
              </View>
              {selectedZone === customCandidate && (
                <Feather name="check" size={16} color={ACCENT} />
              )}
            </TouchableOpacity>
          </>
        )}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>COMMON ZONES</Text>
        {filteredZones.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No matches. Type a full IANA identifier (e.g. "Europe/Lisbon") to use a zone that
              isn't in the list.
            </Text>
          </View>
        ) : (
          filteredZones.map((zone) => {
            const selected = selectedZone === zone.id;
            return (
              <TouchableOpacity
                key={zone.id}
                onPress={() => selectZone(zone.id)}
                style={[
                  styles.zoneRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: selected ? `${ACCENT}50` : colors.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.zoneLabel, { color: colors.foreground }]}>{zone.label}</Text>
                  <Text style={[styles.zoneId, { color: colors.mutedForeground }]}>
                    {zone.id} · {offsetLabel(zone.id)}
                  </Text>
                </View>
                {selected && <Feather name="check" size={16} color={ACCENT} />}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 8 },
  previewCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  previewLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontFamily: 'Inter_600SemiBold',
  },
  previewZone: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  previewSample: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  previewHint: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 6,
    lineHeight: 16,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 0,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.5,
    marginTop: 12,
    marginBottom: 4,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  zoneLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  zoneId: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  emptyState: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
  },
});
