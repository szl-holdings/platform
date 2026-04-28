import { Feather } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : '/api';

interface CapturedPhoto {
  uri: string;
  lat?: number;
  lng?: number;
  timestamp: string;
  address?: string;
}

export default function CaptureScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [notes, setNotes] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'ok' | 'denied'>(
    'idle',
  );

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom + 20;

  const saveCapture = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('address', propertyAddress);
      formData.append('notes', notes);
      formData.append('timestamp', new Date().toISOString());
      if (photos[0]?.lat != null) {
        formData.append('lat', String(photos[0].lat));
        formData.append('lng', String(photos[0].lng));
      }
      photos.forEach((photo, i) => {
        const filename = `capture_${i}_${Date.now()}.jpg`;
        formData.append('photos', {
          uri: photo.uri,
          name: filename,
          type: 'image/jpeg',
        } as unknown as Blob);
      });
      await fetch(`${API_BASE}/terra/captures`, {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },
  });

  const getLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    setLocationStatus('loading');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('denied');
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocationStatus('ok');
      const { latitude, longitude } = loc.coords;
      if (!propertyAddress) {
        try {
          const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (geocoded[0]) {
            const g = geocoded[0];
            const parts = [g.streetNumber, g.street, g.city, g.region].filter(Boolean);
            if (parts.length > 0) setPropertyAddress(parts.join(' '));
          }
        } catch {}
      }
      return { lat: latitude, lng: longitude };
    } catch {
      setLocationStatus('denied');
      return null;
    }
  };

  const handleTakePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === 'web') {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const gps = await getLocation();
        setPhotos((prev) => [
          ...prev,
          {
            uri: asset.uri,
            lat: gps?.lat ?? 0,
            lng: gps?.lng ?? 0,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
      return;
    }
    const camPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (camPerm.status !== 'granted') {
      Alert.alert('Camera Access', 'Camera permission is required to capture property photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      exif: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const gps = await getLocation();
      const asset = result.assets?.[0];
      setPhotos((prev) => [
        ...prev,
        {
          uri: asset.uri,
          lat: (asset.exif?.GPSLatitude as number | undefined) ?? gps?.lat,
          lng: (asset.exif?.GPSLongitude as number | undefined) ?? gps?.lng,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  const handleSave = () => {
    if (photos.length === 0 && !notes) {
      Alert.alert('Nothing to save', 'Take at least one photo or add notes before saving.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    saveCapture.mutate();
  };

  const locStatusConfig = {
    idle: { icon: 'map-pin' as const, color: colors.mutedForeground, label: 'GPS ready' },
    loading: { icon: 'loader' as const, color: colors.gold, label: 'Getting GPS...' },
    ok: { icon: 'check-circle' as const, color: colors.emerald, label: 'GPS tagged' },
    denied: { icon: 'x-circle' as const, color: colors.rose, label: 'GPS denied' },
  }[locationStatus];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(184,148,60,0.06)', 'transparent']}
        style={[styles.headerGradient, { height: topPad + 120 }]}
      />

      <View style={[styles.topBar, { paddingTop: topPad + 12 }]}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backBtn,
            { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: colors.border },
          ]}
        >
          <Feather name="x" size={16} color={colors.cream} />
        </Pressable>
        <View>
          <Text style={[styles.eyebrow, { color: colors.goldSubtle }]}>DOMAINE · FIELD CAPTURE</Text>
          <Text style={[styles.title, { color: colors.cream }]}>Property Capture</Text>
        </View>
        <View style={[styles.locStatus, { backgroundColor: `${locStatusConfig.color}15` }]}>
          <Feather name={locStatusConfig.icon} size={12} color={locStatusConfig.color} />
          <Text style={[styles.locText, { color: locStatusConfig.color }]}>
            {locStatusConfig.label}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Address input */}
        <View
          style={[
            styles.inputBlock,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Feather name="home" size={14} color={colors.mutedForeground} />
          <TextInput
            value={propertyAddress}
            onChangeText={setPropertyAddress}
            placeholder="Property address..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.textInput, { color: colors.cream }]}
          />
        </View>

        {/* Camera area */}
        <View style={styles.photoSection}>
          {photos.length === 0 ? (
            <Pressable
              onPress={handleTakePhoto}
              style={[
                styles.cameraPlaceholder,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.cameraIconBg,
                  { backgroundColor: colors.goldDim, borderColor: colors.goldBorder },
                ]}
              >
                <Feather name="camera" size={28} color={colors.gold} />
              </View>
              <Text style={[styles.cameraHint, { color: colors.cream }]}>
                {Platform.OS === 'web' ? 'Select Photo' : 'Take Photo'}
              </Text>
              <Text style={[styles.cameraSubhint, { color: colors.mutedForeground }]}>
                Automatically GPS-tagged
              </Text>
            </Pressable>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoRow}
            >
              {photos.map((photo, i) => (
                <View key={i} style={styles.photoThumbWrapper}>
                  <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setPhotos((prev) => prev.filter((_, j) => j !== i));
                    }}
                    style={[styles.photoDelete, { backgroundColor: colors.rose }]}
                  >
                    <Feather name="x" size={10} color="white" />
                  </Pressable>
                  {photo.lat && (
                    <View style={[styles.gpsTag, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                      <Feather name="map-pin" size={8} color={colors.emerald} />
                    </View>
                  )}
                  <Text style={[styles.photoTime, { color: colors.mutedForeground }]}>
                    {photo.timestamp}
                  </Text>
                </View>
              ))}
              <Pressable
                onPress={handleTakePhoto}
                style={[
                  styles.addPhotoBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Feather name="plus" size={20} color={colors.mutedForeground} />
                <Text style={[styles.addPhotoText, { color: colors.mutedForeground }]}>Add</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>

        {/* Notes */}
        <View
          style={[
            styles.notesBlock,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.notesLabel, { color: colors.goldSubtle }]}>FIELD NOTES</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Condition of property, visible distress signals, owner activity, neighbor notes..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={[styles.notesInput, { color: colors.cream }]}
          />
          <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
            {notes.length} characters
          </Text>
        </View>

        {photos.length > 0 && (
          <View
            style={[
              styles.captureStats,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.captureStatRow}>
              <Feather name="camera" size={12} color={colors.gold} />
              <Text style={[styles.captureStatText, { color: colors.cream }]}>
                {photos.length} photo{photos.length !== 1 ? 's' : ''} captured
              </Text>
            </View>
            {photos.some((p) => p.lat) && (
              <View style={styles.captureStatRow}>
                <Feather name="map-pin" size={12} color={colors.emerald} />
                <Text style={[styles.captureStatText, { color: colors.cream }]}>
                  GPS: {photos[0].lat?.toFixed(4)}, {photos[0].lng?.toFixed(4)}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.cancelBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={saveCapture.isPending}
            style={[
              styles.saveBtn,
              {
                backgroundColor: colors.goldDim,
                borderColor: colors.goldBorder,
                opacity: saveCapture.isPending ? 0.6 : 1,
              },
            ]}
          >
            <Feather
              name={saveCapture.isPending ? 'loader' : 'save'}
              size={16}
              color={colors.gold}
            />
            <Text style={[styles.saveText, { color: colors.gold }]}>
              {saveCapture.isPending ? 'Saving...' : 'Save Capture'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  eyebrow: { fontSize: 8, fontFamily: 'Inter_500Medium', letterSpacing: 3, marginBottom: 2 },
  title: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  locStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 8,
  },
  locText: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  scroll: { flex: 1 },
  inputBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  textInput: { flex: 1, fontSize: 13, fontFamily: 'Inter_300Light' },
  photoSection: { paddingHorizontal: 20, marginBottom: 14 },
  cameraPlaceholder: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  cameraIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraHint: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  cameraSubhint: { fontSize: 11, fontFamily: 'Inter_300Light' },
  photoRow: { gap: 8 },
  photoThumbWrapper: { width: 120, position: 'relative' },
  photoThumb: { width: 120, height: 120, borderRadius: 10 },
  photoDelete: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsTag: {
    position: 'absolute',
    bottom: 24,
    left: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoTime: { fontSize: 9, fontFamily: 'Inter_300Light', textAlign: 'center', marginTop: 4 },
  addPhotoBtn: {
    width: 120,
    height: 120,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addPhotoText: { fontSize: 11, fontFamily: 'Inter_300Light' },
  notesBlock: {
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  notesLabel: { fontSize: 8, fontFamily: 'Inter_500Medium', letterSpacing: 2, marginBottom: 8 },
  notesInput: { minHeight: 90, fontSize: 13, fontFamily: 'Inter_300Light', lineHeight: 20 },
  charCount: { fontSize: 9, fontFamily: 'Inter_300Light', textAlign: 'right', marginTop: 6 },
  captureStats: {
    marginHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  captureStatRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  captureStatText: { fontSize: 12, fontFamily: 'Inter_300Light' },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  saveText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
