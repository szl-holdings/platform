export type Platform = "web" | "mobile" | "unknown";

export type PermissionStatus = "granted" | "denied" | "prompt" | "unavailable";

export interface PermissionState {
  camera: PermissionStatus;
  microphone: PermissionStatus;
  location: PermissionStatus;
  notifications: PermissionStatus;
}

export interface CameraCapabilities {
  supported: boolean;
  facingModes: string[];
  maxResolution?: { width: number; height: number };
  supportsZoom: boolean;
  supportsFlash: boolean;
  supportsTorch: boolean;
  supportsQRScan: boolean;
}

export interface MicrophoneCapabilities {
  supported: boolean;
  sampleRates: number[];
  channels: number;
  supportsVAD: boolean;
  supportsNoiseCancellation: boolean;
}

export interface LocationCapabilities {
  supported: boolean;
  supportsHighAccuracy: boolean;
  supportsBackground: boolean;
  supportsGeofencing: boolean;
  supportsCompass: boolean;
}

export interface SensorCapabilities {
  accelerometer: boolean;
  gyroscope: boolean;
  magnetometer: boolean;
  barometer: boolean;
  proximityDetector: boolean;
}

export interface HardwareCapabilities {
  platform: Platform;
  camera: CameraCapabilities;
  microphone: MicrophoneCapabilities;
  location: LocationCapabilities;
  sensors: SensorCapabilities;
  maxConcurrentStreams: number;
}

export interface CapturedPhoto {
  dataUrl: string;
  width: number;
  height: number;
  mimeType: string;
  timestamp: number;
  location?: GeolocationCoordinates;
}

export interface AudioChunk {
  data: Float32Array | Int16Array;
  sampleRate: number;
  timestamp: number;
  vadScore?: number;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface SensorReading {
  accelerometer?: { x: number; y: number; z: number; timestamp: number };
  gyroscope?: { alpha: number; beta: number; gamma: number; timestamp: number };
  magnetometer?: { x: number; y: number; z: number; timestamp: number };
}

export interface VoiceActivationConfig {
  threshold: number;
  silenceDuration: number;
  wakeWord?: string;
  onActivation: (audioChunk: AudioChunk) => void;
  onSilence: () => void;
}

export interface CameraScanConfig {
  mode: "qr" | "barcode" | "document" | "object" | "continuous";
  frameRate: number;
  onFrame: (frameData: string, timestamp: number) => void;
  onQRResult?: (result: string) => void;
}

export interface GeofenceConfig {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
  onEnter?: (coords: LocationUpdate) => void;
  onExit?: (coords: LocationUpdate) => void;
}

export interface HALInterface {
  getCapabilities(): Promise<HardwareCapabilities>;
  getPermissions(): Promise<PermissionState>;
  requestPermission(type: keyof PermissionState): Promise<PermissionStatus>;

  capturePhoto(options?: { quality?: number; facingMode?: "user" | "environment" }): Promise<CapturedPhoto>;
  startCameraStream(config: CameraScanConfig): Promise<{ stop: () => void }>;
  stopCameraStream(): void;

  startMicrophone(config?: { sampleRate?: number; channels?: number }): Promise<{ stop: () => void }>;
  startVoiceActivation(config: VoiceActivationConfig): Promise<{ stop: () => void }>;
  stopMicrophone(): void;

  getCurrentLocation(options?: { highAccuracy?: boolean }): Promise<LocationUpdate>;
  startLocationTracking(interval: number, onUpdate: (loc: LocationUpdate) => void): Promise<{ stop: () => void }>;
  addGeofence(config: GeofenceConfig): Promise<{ remove: () => void }>;

  startSensorTracking(onReading: (reading: SensorReading) => void): Promise<{ stop: () => void }>;
}
