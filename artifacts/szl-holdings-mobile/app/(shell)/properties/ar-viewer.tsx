import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

const ACCENT = '#c9a84c';

interface ARProperty {
  address: string;
  estimatedValue: string;
  valueChange: string;
  owner: string;
  zoning: string;
  distressScore: number;
  capRate: string;
  sqft: string;
  yearBuilt: number;
  opportunity: 'buy' | 'watch' | 'avoid';
  signals: string[];
}

const MOCK_PROPERTIES: ARProperty[] = [
  {
    address: '1400 Brickell Ave, Miami FL',
    estimatedValue: '$18.5M',
    valueChange: '+3.2%',
    owner: 'Brickell RE Holdings LLC',
    zoning: 'B-2 Commercial',
    distressScore: 62,
    capRate: '5.8%',
    sqft: '42,000',
    yearBuilt: 2002,
    opportunity: 'buy',
    signals: ['NOD filed 30 days ago', '2 liens on title', 'Vacancy 34%'],
  },
  {
    address: '501 NW 1st Ave, Miami FL',
    estimatedValue: '$6.2M',
    valueChange: '-0.8%',
    owner: 'Wynwood Capital Partners',
    zoning: 'T6-24 Urban Core',
    distressScore: 28,
    capRate: '4.1%',
    sqft: '18,500',
    yearBuilt: 1989,
    opportunity: 'watch',
    signals: ['Permit pulled for renovation', 'No liens detected'],
  },
];

function ScanLine() {
  const position = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(position, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(position, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const translateY = position.interpolate({ inputRange: [0, 1], outputRange: [-200, 200] });

  return <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />;
}

function CornerMarker({ style }: { style?: object }) {
  return <View style={[styles.corner, style]} />;
}

function ARDataCard({ property, visible }: { property: ARProperty; visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const oppColor =
    property.opportunity === 'buy'
      ? '#22c55e'
      : property.opportunity === 'watch'
        ? '#f59e0b'
        : '#ef4444';
  const oppLabel =
    property.opportunity === 'buy'
      ? 'BUY SIGNAL'
      : property.opportunity === 'watch'
        ? 'WATCH'
        : 'AVOID';

  return (
    <Animated.View style={[styles.arCard, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.arCardHeader}>
        <Text style={styles.arAddress} numberOfLines={1}>
          {property.address}
        </Text>
        <View
          style={[
            styles.oppBadge,
            { backgroundColor: `${oppColor}20`, borderColor: `${oppColor}40` },
          ]}
        >
          <Text style={[styles.oppText, { color: oppColor }]}>{oppLabel}</Text>
        </View>
      </View>

      <View style={styles.arMetricRow}>
        <View style={styles.arMetric}>
          <Text style={styles.arMetricLabel}>Estimated Value</Text>
          <Text style={styles.arMetricValue}>{property.estimatedValue}</Text>
          <Text
            style={[
              styles.arMetricSub,
              { color: property.valueChange.startsWith('+') ? '#22c55e' : '#ef4444' },
            ]}
          >
            {property.valueChange}
          </Text>
        </View>
        <View style={styles.arMetric}>
          <Text style={styles.arMetricLabel}>Cap Rate</Text>
          <Text style={styles.arMetricValue}>{property.capRate}</Text>
        </View>
        <View style={styles.arMetric}>
          <Text style={styles.arMetricLabel}>Distress</Text>
          <Text
            style={[
              styles.arMetricValue,
              { color: property.distressScore > 50 ? '#f59e0b' : '#22c55e' },
            ]}
          >
            {property.distressScore}/100
          </Text>
        </View>
      </View>

      <View style={styles.arDivider} />

      <View style={styles.arInfoRow}>
        <View style={styles.arInfoItem}>
          <Feather name="user" size={10} color="rgba(201,168,76,0.6)" />
          <Text style={styles.arInfoText}>{property.owner}</Text>
        </View>
        <View style={styles.arInfoItem}>
          <Feather name="map-pin" size={10} color="rgba(201,168,76,0.6)" />
          <Text style={styles.arInfoText}>{property.zoning}</Text>
        </View>
      </View>

      <View style={styles.arSignals}>
        {property.signals.map((sig, i) => (
          <View key={i} style={styles.arSignal}>
            <View style={styles.arSignalDot} />
            <Text style={styles.arSignalText}>{sig}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

function CameraBackground({ scanning }: { scanning: boolean }) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.cameraPlaceholder}>
        <View style={styles.cameraGrid}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={i} style={styles.gridCell} />
          ))}
        </View>
        {scanning && <ScanLine />}
      </View>
    );
  }

  return (
    <CameraView style={StyleSheet.absoluteFill} facing="back">
      {scanning && <ScanLine />}
    </CameraView>
  );
}

function PermissionScreen({
  onRequest,
  canAskAgain,
  insets,
}: {
  onRequest: () => void;
  canAskAgain: boolean;
  insets: { top: number; bottom: number };
}) {
  const handleOpenSettings = async () => {
    if (Platform.OS !== 'web') {
      try {
        await Linking.openSettings();
      } catch (_) {
        Alert.alert(
          'Cannot open Settings',
          'Please open your device Settings and grant Camera access to APEX manually.',
        );
      }
    }
  };

  return (
    <View
      style={[
        styles.permissionContainer,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 32 },
      ]}
    >
      <TouchableOpacity style={styles.backBtnAbsolute} onPress={() => router.back()}>
        <Feather name="chevron-left" size={20} color="#fff" />
      </TouchableOpacity>

      <View style={styles.permissionIconWrap}>
        <Feather name="camera" size={40} color={ACCENT} />
      </View>

      <Text style={styles.permissionTitle}>Camera Access Required</Text>
      <Text style={styles.permissionBody}>
        The AR Property Viewer needs camera access to overlay DOMAINE intelligence on buildings around
        you.
      </Text>

      {canAskAgain ? (
        <TouchableOpacity style={styles.permissionBtn} onPress={onRequest}>
          <Text style={styles.permissionBtnText}>Enable Camera</Text>
        </TouchableOpacity>
      ) : (
        <>
          <Text style={styles.permissionDeniedNote}>
            Camera permission was denied. Open Settings to grant access.
          </Text>
          {Platform.OS !== 'web' && (
            <TouchableOpacity style={styles.permissionBtn} onPress={handleOpenSettings}>
              <Text style={styles.permissionBtnText}>Open Settings</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

interface TerraAPIProperty {
  id: number;
  address: string;
  city: string;
  state: string;
  estimatedValue?: number | null;
  capRate?: number | null;
  sqft?: number | null;
  yearBuilt?: number | null;
  zoning?: string | null;
  owner?: string | null;
  distressScore?: number | null;
}

function mapTerraToARProperty(p: TerraAPIProperty, index: number): ARProperty {
  const address = [p.address, p.city, p.state].filter(Boolean).join(', ');
  const value = p.estimatedValue
    ? `$${(p.estimatedValue / 1_000_000).toFixed(1)}M`
    : MOCK_PROPERTIES[index % MOCK_PROPERTIES.length].estimatedValue;
  const cap = p.capRate ? `${p.capRate.toFixed(1)}%` : MOCK_PROPERTIES[index % MOCK_PROPERTIES.length].capRate;
  const distress = p.distressScore ?? MOCK_PROPERTIES[index % MOCK_PROPERTIES.length].distressScore;
  return {
    address: address || MOCK_PROPERTIES[index % MOCK_PROPERTIES.length].address,
    estimatedValue: value,
    valueChange: '+0.0%',
    owner: p.owner ?? 'Unknown Owner',
    zoning: p.zoning ?? 'Commercial',
    distressScore: distress,
    capRate: cap,
    sqft: p.sqft ? p.sqft.toLocaleString() : MOCK_PROPERTIES[index % MOCK_PROPERTIES.length].sqft,
    yearBuilt: p.yearBuilt ?? MOCK_PROPERTIES[index % MOCK_PROPERTIES.length].yearBuilt,
    opportunity: distress > 50 ? 'buy' : distress > 25 ? 'watch' : 'avoid',
    signals:
      distress > 50
        ? ['Distress score elevated', 'Opportunity flagged by DOMAINE AI']
        : ['No active distress signals', 'Market activity normal'],
  };
}

async function fetchNearbyProperties(lat: number, lng: number): Promise<ARProperty[]> {
  try {
    const url = `${BASE_URL}/api/terra/properties?limit=5&nearLat=${lat.toFixed(6)}&nearLng=${lng.toFixed(6)}&radiusKm=2`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: TerraAPIProperty[]; properties?: TerraAPIProperty[] };
    const items: TerraAPIProperty[] = json.data ?? json.properties ?? [];
    if (items.length === 0) return [];
    return items.map((p, i) => mapTerraToARProperty(p, i));
  } catch {
    return [];
  }
}

export default function ARPropertyViewerScreen() {
  const _colors = useColors();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [propertyIndex, setPropertyIndex] = useState(0);
  const [dataVisible, setDataVisible] = useState(false);
  const [liveProperties, setLiveProperties] = useState<ARProperty[]>([]);
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const nearby = await fetchNearbyProperties(loc.coords.latitude, loc.coords.longitude);
          if (nearby.length > 0) {
            setLiveProperties(nearby);
          }
        }
      } catch {
        /* location unavailable — fall back to mocks */
      }
    })();

    scanTimer.current = setTimeout(() => {
      setScanning(false);
      setDataVisible(true);
    }, 2500);
    return () => {
      if (scanTimer.current) clearTimeout(scanTimer.current);
    };
  }, []);

  const properties = liveProperties.length > 0 ? liveProperties : MOCK_PROPERTIES;

  const handleRescan = () => {
    setDataVisible(false);
    setScanning(true);
    const nextIndex = (propertyIndex + 1) % properties.length;
    scanTimer.current = setTimeout(() => {
      setPropertyIndex(nextIndex);
      setScanning(false);
      setDataVisible(true);
    }, 2500);
  };

  const property = properties[propertyIndex] ?? MOCK_PROPERTIES[0];

  useEffect(() => {
    if (Platform.OS !== 'web' && permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  if (Platform.OS !== 'web') {
    if (!permission) {
      return <View style={styles.root} />;
    }

    if (!permission.granted) {
      return (
        <View style={[styles.root, { backgroundColor: '#090810' }]}>
          <PermissionScreen
            onRequest={requestPermission}
            canAskAgain={permission.canAskAgain}
            insets={insets}
          />
        </View>
      );
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: '#000' }]}>
      <CameraBackground scanning={scanning} />

      <View style={[styles.overlay, StyleSheet.absoluteFill]}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="chevron-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.arBadge}>
            <View style={styles.arBadgeDot} />
            <Text style={styles.arBadgeText}>AR PROPERTY INTEL</Text>
          </View>
          <TouchableOpacity style={styles.rescanBtn} onPress={handleRescan}>
            <Feather name="refresh-cw" size={16} color={ACCENT} />
          </TouchableOpacity>
        </View>

        <View style={styles.scanFrameContainer}>
          <View style={styles.scanFrame}>
            <CornerMarker style={styles.cornerTL} />
            <CornerMarker style={styles.cornerTR} />
            <CornerMarker style={styles.cornerBL} />
            <CornerMarker style={styles.cornerBR} />
            {scanning ? (
              <View style={styles.scanningLabel}>
                <Text style={styles.scanningText}>Scanning building…</Text>
                <Text style={styles.scanningSubText}>Pulling DOMAINE data</Text>
              </View>
            ) : (
              <View style={styles.lockedLabel}>
                <Feather name="check-circle" size={14} color="#22c55e" />
                <Text style={styles.lockedText}>Property Identified</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottomPanel}>
          <ARDataCard property={property} visible={dataVisible} />

          {!scanning && (
            <View style={styles.bottomActions}>
              <TouchableOpacity
                style={[styles.arActionBtn, { borderColor: 'rgba(201,168,76,0.3)' }]}
                onPress={() => router.push('/(shell)/properties' as never)}
              >
                <Feather name="external-link" size={14} color={ACCENT} />
                <Text style={styles.arActionBtnText}>Open in DOMAINE</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.arActionBtn, { borderColor: 'rgba(34,197,94,0.3)' }]}
                onPress={() =>
                  router.push({
                    pathname: '/(shell)/properties/(tabs)/pipeline' as never,
                    params: { prefillAddress: property.address },
                  } as never)
                }
              >
                <Feather name="plus" size={14} color="#22c55e" />
                <Text style={[styles.arActionBtnText, { color: '#22c55e' }]}>Add to Pipeline</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  cameraPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0a12',
    overflow: 'hidden',
  },
  cameraGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCell: {
    width: '20%',
    height: '5%',
    borderWidth: 0.5,
    borderColor: 'rgba(201,168,76,0.04)',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: `${ACCENT}80`,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  overlay: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${ACCENT}30`,
  },
  arBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ACCENT,
  },
  arBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: ACCENT,
    letterSpacing: 1,
  },
  rescanBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  scanFrame: {
    width: 260,
    height: 180,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: ACCENT,
    borderWidth: 2,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanningLabel: { alignItems: 'center', gap: 4 },
  scanningText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#fff' },
  scanningSubText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: ACCENT },
  lockedLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lockedText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#22c55e' },
  bottomPanel: {
    padding: 16,
    gap: 10,
    paddingBottom: 32,
  },
  arCard: {
    backgroundColor: 'rgba(9,8,16,0.92)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${ACCENT}25`,
    padding: 14,
    gap: 10,
  },
  arCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  arAddress: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#f0eeff',
    flex: 1,
  },
  oppBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  oppText: { fontSize: 9, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  arMetricRow: { flexDirection: 'row', gap: 12 },
  arMetric: { flex: 1, gap: 2 },
  arMetricLabel: {
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(201,168,76,0.5)',
    letterSpacing: 0.5,
  },
  arMetricValue: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#f0eeff' },
  arMetricSub: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  arDivider: { height: 1, backgroundColor: 'rgba(201,168,76,0.1)' },
  arInfoRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  arInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  arInfoText: { fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(240,238,255,0.5)' },
  arSignals: { gap: 4 },
  arSignal: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  arSignalDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#f59e0b' },
  arSignalText: { fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(240,238,255,0.6)' },
  bottomActions: { flexDirection: 'row', gap: 10 },
  arActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  arActionBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: ACCENT,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  backBtnAbsolute: {
    position: 'absolute',
    top: 60,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${ACCENT}15`,
    borderWidth: 1,
    borderColor: `${ACCENT}30`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  permissionTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#f0eeff',
    textAlign: 'center',
  },
  permissionBody: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(240,238,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionDeniedNote: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(240,238,255,0.4)',
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionBtn: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: ACCENT,
    alignItems: 'center',
  },
  permissionBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#090810',
  },
});
