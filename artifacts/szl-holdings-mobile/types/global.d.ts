declare module 'expo-glass-effect' {
  import { ViewProps } from 'react-native';
  import React from 'react';
  export interface GlassViewProps extends ViewProps {
    blurAmount?: number;
    blurType?: string;
    reducedTransparencyFallbackColor?: string;
  }
  export const GlassView: React.FC<GlassViewProps>;
  export function isLiquidGlassAvailable(): boolean;
  export default GlassView;
}

declare module 'expo-sensors' {
  export interface AccelerometerMeasurement {
    x: number;
    y: number;
    z: number;
  }
  export interface GyroscopeMeasurement {
    x: number;
    y: number;
    z: number;
  }
  export interface MagnetometerMeasurement {
    x: number;
    y: number;
    z: number;
  }
  export interface DeviceMotionMeasurement {
    acceleration: AccelerometerMeasurement | null;
    accelerationIncludingGravity: AccelerometerMeasurement | null;
    rotation: { alpha: number; beta: number; gamma: number } | null;
    orientation: number;
    rotationRate: GyroscopeMeasurement | null;
  }
  export const Accelerometer: {
    addListener: (listener: (data: AccelerometerMeasurement) => void) => { remove: () => void };
    removeAllListeners: () => void;
    setUpdateInterval: (interval: number) => void;
    isAvailableAsync: () => Promise<boolean>;
  };
  export const Gyroscope: {
    addListener: (listener: (data: GyroscopeMeasurement) => void) => { remove: () => void };
    removeAllListeners: () => void;
    setUpdateInterval: (interval: number) => void;
    isAvailableAsync: () => Promise<boolean>;
  };
  export const DeviceMotion: {
    addListener: (listener: (data: DeviceMotionMeasurement) => void) => { remove: () => void };
    removeAllListeners: () => void;
    setUpdateInterval: (interval: number) => void;
    isAvailableAsync: () => Promise<boolean>;
  };
  export const Magnetometer: {
    addListener: (listener: (data: MagnetometerMeasurement) => void) => { remove: () => void };
    removeAllListeners: () => void;
    setUpdateInterval: (interval: number) => void;
    isAvailableAsync: () => Promise<boolean>;
  };
}

declare module 'expo-location' {
  export interface LocationObject {
    coords: {
      latitude: number;
      longitude: number;
      altitude: number | null;
      accuracy: number | null;
      altitudeAccuracy: number | null;
      heading: number | null;
      speed: number | null;
    };
    timestamp: number;
  }
  export interface LocationPermissionResponse {
    status: 'granted' | 'denied' | 'undetermined';
    granted: boolean;
  }
  export interface LocationOptions {
    accuracy?: number;
    timeInterval?: number;
    distanceInterval?: number;
    mayShowUserSettingsDialog?: boolean;
  }
  export enum Accuracy {
    Lowest = 1,
    Low = 2,
    Balanced = 3,
    High = 4,
    Highest = 5,
    BestForNavigation = 6,
  }
  export function requestForegroundPermissionsAsync(): Promise<LocationPermissionResponse>;
  export function requestBackgroundPermissionsAsync(): Promise<LocationPermissionResponse>;
  export function getForegroundPermissionsAsync(): Promise<LocationPermissionResponse>;
  export function getCurrentPositionAsync(options?: LocationOptions): Promise<LocationObject>;
  export function watchPositionAsync(
    options: LocationOptions,
    callback: (location: LocationObject) => void,
  ): Promise<{ remove: () => void }>;
  export function reverseGeocodeAsync(location: { latitude: number; longitude: number }): Promise<
    Array<{
      city: string | null;
      country: string | null;
      district: string | null;
      isoCountryCode: string | null;
      name: string | null;
      postalCode: string | null;
      region: string | null;
      street: string | null;
      streetNumber: string | null;
      subregion: string | null;
      timezone: string | null;
    }>
  >;
}

declare module 'expo-image-picker' {
  export interface ImagePickerAsset {
    uri: string;
    width: number;
    height: number;
    type?: 'image' | 'video';
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    base64?: string;
    exif?: Record<string, unknown>;
    duration?: number;
  }
  export interface ImagePickerResult {
    canceled: boolean;
    assets: ImagePickerAsset[] | null;
  }
  export interface MediaLibraryPermissionResponse {
    status: 'granted' | 'denied' | 'undetermined';
    granted: boolean;
  }
  export enum MediaTypeOptions {
    All = 'All',
    Videos = 'Videos',
    Images = 'Images',
  }
  export function requestMediaLibraryPermissionsAsync(): Promise<MediaLibraryPermissionResponse>;
  export function requestCameraPermissionsAsync(): Promise<MediaLibraryPermissionResponse>;
  export function launchImageLibraryAsync(options?: {
    mediaTypes?: MediaTypeOptions;
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
    base64?: boolean;
    exif?: boolean;
    allowsMultipleSelection?: boolean;
  }): Promise<ImagePickerResult>;
  export function launchCameraAsync(options?: {
    mediaTypes?: MediaTypeOptions;
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
    base64?: boolean;
    exif?: boolean;
  }): Promise<ImagePickerResult>;
}

declare module 'expo-symbols' {
  import React from 'react';
  import { ViewStyle } from 'react-native';
  export interface SymbolViewProps {
    name: string;
    size?: number;
    tintColor?: string;
    style?: ViewStyle;
    weight?: string;
    type?: string;
    fallback?: React.ReactNode;
  }
  export const SymbolView: React.FC<SymbolViewProps>;
  export function SymbolViewNativeComponent(props: SymbolViewProps): React.ReactElement | null;
  export type SFSymbols7_0 = string;
  export type SFSymbols6_0 = string;
  export type SFSymbols5_0 = string;
  export type SFSymbols4_0 = string;
  export type SFSymbol = string;
  export type SymbolWeight =
    | 'ultralight'
    | 'thin'
    | 'light'
    | 'regular'
    | 'medium'
    | 'semibold'
    | 'bold'
    | 'heavy'
    | 'black';
  export type SymbolScale = 'small' | 'medium' | 'large';
  export type SymbolType = 'hierarchical' | 'monochrome' | 'multicolor' | 'palette';
  export type SymbolAnimationEffect = object;
}

declare module '@expo-google-fonts/space-grotesk' {
  export const SpaceGrotesk_300Light: number;
  export const SpaceGrotesk_400Regular: number;
  export const SpaceGrotesk_500Medium: number;
  export const SpaceGrotesk_600SemiBold: number;
  export const SpaceGrotesk_700Bold: number;
  export function useFonts(fonts: Record<string, number>): [boolean, Error | null];
}

declare module 'react-native-keyboard-controller' {
  import React from 'react';
  import { ViewProps } from 'react-native';
  export interface KeyboardAwareScrollViewProps extends ViewProps {
    children?: React.ReactNode;
    bottomOffset?: number;
    disableScrollOnKeyboardHide?: boolean;
    keyboardShouldPersistTaps?: 'always' | 'never' | 'handled' | boolean;
    scrollEventThrottle?: number;
    showsVerticalScrollIndicator?: boolean;
    contentContainerStyle?: object;
    style?: object;
  }
  export const KeyboardAwareScrollView: React.FC<KeyboardAwareScrollViewProps>;
  export const KeyboardControllerView: React.FC<ViewProps>;
  export const KeyboardProvider: React.FC<{ children: React.ReactNode }>;
  export const KeyboardAvoidingView: React.FC<
    ViewProps & {
      behavior?: string;
      keyboardVerticalOffset?: number;
      keyboardShouldPersistTaps?: string;
    }
  >;
  export function useKeyboardController(): { enabled: boolean; setEnabled: (v: boolean) => void };
  export function useReanimatedKeyboardAnimation(): {
    height: { value: number };
    progress: { value: number };
  };
}

declare module '@react-native-community/netinfo' {
  export interface NetInfoState {
    type: string;
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    details: Record<string, unknown> | null;
  }
  export type NetInfoSubscription = () => void;
  export function addEventListener(listener: (state: NetInfoState) => void): NetInfoSubscription;
  export function fetch(): Promise<NetInfoState>;
  export function useNetInfo(): NetInfoState;
  const NetInfo: {
    addEventListener: typeof addEventListener;
    fetch: typeof fetch;
    useNetInfo: typeof useNetInfo;
  };
  export default NetInfo;
}

declare module 'expo-document-picker' {
  export interface DocumentPickerAsset {
    uri: string;
    name: string;
    mimeType?: string;
    size?: number;
  }
  export interface DocumentPickerResult {
    canceled: boolean;
    assets: DocumentPickerAsset[] | null;
  }
  export function getDocumentAsync(options?: {
    type?: string | string[];
    copyToCacheDirectory?: boolean;
    multiple?: boolean;
  }): Promise<DocumentPickerResult>;
}
