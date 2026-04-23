import { Feather } from '@expo/vector-icons';
import { getApiBaseUrl } from '@szl-holdings/api-client-react';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { trackEvent } from '@/lib/analytics';

const ACCENT = '#c9a84c';
const SCREEN_W = Dimensions.get('window').width;

interface PropertyPin {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'commercial' | 'residential' | 'industrial';
  value: string;
}

const PORTFOLIO_PROPERTIES: PropertyPin[] = [
  {
    id: 'p1',
    name: '425 Park Ave Tower',
    address: '425 Park Ave, New York, NY',
    lat: 40.758,
    lng: -73.972,
    type: 'commercial',
    value: '$2.4B',
  },
  {
    id: 'p2',
    name: 'SZL Miami Hub',
    address: '1111 Brickell Ave, Miami, FL',
    lat: 25.761,
    lng: -80.192,
    type: 'commercial',
    value: '$380M',
  },
  {
    id: 'p3',
    name: 'London Gateway',
    address: '30 St Mary Axe, London, UK',
    lat: 51.514,
    lng: -0.083,
    type: 'commercial',
    value: '$620M',
  },
  {
    id: 'p4',
    name: 'Singapore PRAXIS',
    address: '1 Raffles Place, Singapore',
    lat: 1.284,
    lng: 103.851,
    type: 'commercial',
    value: '$510M',
  },
];

function buildMapUrl(props: PropertyPin[], selected?: PropertyPin): string {
  const apiBase = getApiBaseUrl();
  const w = Math.round(SCREEN_W - 32);
  const h = 360;
  const zoom = selected ? '15' : '2';
  const center = selected ? `${selected.lat},${selected.lng}` : '25,10';

  const markers = selected
    ? `color:cyan|label:★|${selected.lat},${selected.lng}`
    : props.map((p) => `color:0xc9a84c|label:•|${p.lat},${p.lng}`).join('&markers=');

  const markerParam = selected
    ? `markers=${markers}`
    : props.map((p) => `markers=color:0xc9a84c|label:•|${p.lat},${p.lng}`).join('&');

  return `${apiBase}/api/maps/static?center=${encodeURIComponent(center)}&zoom=${zoom}&size=${w}x${h}&maptype=satellite&${markerParam}`;
}

export default function PortfolioMapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<PropertyPin | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    trackEvent('page_view', { page: 'portfolio_map', product: 'szl-holdings-mobile' });
    trackEvent('feature_used', {
      feature: 'portfolio_map',
      product: 'szl-holdings-mobile',
      source: 'spotlight',
    });
  }, []);

  function handleSelectProperty(prop: PropertyPin) {
    setSelected(selected?.id === prop.id ? null : prop);
    setImgLoaded(false);
    trackEvent('feature_used', {
      feature: 'portfolio_map_property_selected',
      property_id: prop.id,
      product: 'szl-holdings-mobile',
    });
  }

  const mapUrl = buildMapUrl(PORTFOLIO_PROPERTIES, selected ?? undefined);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}
      >
        <Feather name="map" size={18} color={ACCENT} />
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Portfolio Map</Text>
        {selected && (
          <TouchableOpacity
            onPress={() => {
              setSelected(null);
              setImgLoaded(false);
            }}
            style={styles.clearBtn}
          >
            <Feather name="x" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mapContainer, { borderColor: colors.border }]}>
          {!imgLoaded && (
            <View style={styles.mapPlaceholder}>
              <ActivityIndicator color={ACCENT} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                Loading satellite map…
              </Text>
            </View>
          )}
          <Image
            source={{ uri: mapUrl }}
            style={[styles.mapImage, !imgLoaded && styles.hidden]}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgLoaded(true)}
            resizeMode="cover"
          />
          <View style={styles.mapBadge}>
            <Feather name="map-pin" size={10} color={ACCENT} />
            <Text style={styles.mapBadgeText}>Google Maps — Satellite</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          PORTFOLIO PROPERTIES
        </Text>
        {PORTFOLIO_PROPERTIES.map((prop) => (
          <TouchableOpacity
            key={prop.id}
            onPress={() => handleSelectProperty(prop)}
            style={[
              styles.propertyCard,
              {
                backgroundColor: colors.card,
                borderColor: selected?.id === prop.id ? ACCENT : colors.border,
              },
            ]}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.pinDot,
                { backgroundColor: selected?.id === prop.id ? ACCENT : `${ACCENT}40` },
              ]}
            />
            <View style={styles.propText}>
              <Text style={[styles.propName, { color: colors.foreground }]}>{prop.name}</Text>
              <Text style={[styles.propAddress, { color: colors.mutedForeground }]}>
                {prop.address}
              </Text>
            </View>
            <Text style={[styles.propValue, { color: ACCENT }]}>{prop.value}</Text>
          </TouchableOpacity>
        ))}
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
    gap: 10,
  },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3 },
  clearBtn: { padding: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  mapContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 360,
    position: 'relative',
  },
  mapPlaceholder: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 1,
  },
  loadingText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  mapImage: { width: SCREEN_W - 32, height: 360 },
  hidden: { opacity: 0 },
  mapBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mapBadgeText: { fontSize: 10, color: '#c9a84c', fontFamily: 'Inter_500Medium' },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  propertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  pinDot: { width: 10, height: 10, borderRadius: 5 },
  propText: { flex: 1, gap: 2 },
  propName: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  propAddress: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  propValue: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});
