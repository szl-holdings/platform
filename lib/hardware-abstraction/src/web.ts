import type {
  HALInterface,
  HardwareCapabilities,
  PermissionState,
  PermissionStatus,
  CapturedPhoto,
  AudioChunk,
  LocationUpdate,
  SensorReading,
  CameraScanConfig,
  VoiceActivationConfig,
  GeofenceConfig,
} from "./types";
import { queryWebPermissions, requestWebPermission } from "./permissions";

export class WebHAL implements HALInterface {
  private activeStreams: Map<string, MediaStream> = new Map();
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private locationWatchId: number | null = null;
  private sensorListeners: Array<() => void> = [];
  private geofences: Map<string, GeofenceConfig & { watchId?: number }> = new Map();

  async getCapabilities(): Promise<HardwareCapabilities> {
    const hasMediaDevices = typeof navigator !== "undefined" && !!navigator.mediaDevices;
    const hasGeolocation = typeof navigator !== "undefined" && !!navigator.geolocation;

    let videoDevices: MediaDeviceInfo[] = [];
    if (hasMediaDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        videoDevices = devices.filter(d => d.kind === "videoinput");
      } catch { }
    }

    return {
      platform: "web",
      camera: {
        supported: hasMediaDevices && videoDevices.length > 0,
        facingModes: videoDevices.length > 1 ? ["user", "environment"] : ["user"],
        supportsZoom: false,
        supportsFlash: false,
        supportsTorch: "mediaDevices" in navigator && "getSupportedConstraints" in navigator.mediaDevices
          ? !!(navigator.mediaDevices.getSupportedConstraints() as Record<string, boolean>)["torch"]
          : false,
        supportsQRScan: typeof window !== "undefined" && "BarcodeDetector" in window,
      },
      microphone: {
        supported: hasMediaDevices,
        sampleRates: [8000, 16000, 22050, 44100, 48000],
        channels: 1,
        supportsVAD: true,
        supportsNoiseCancellation: hasMediaDevices && !!navigator.mediaDevices.getSupportedConstraints?.()["noiseSuppression" as keyof MediaTrackSupportedConstraints],
      },
      location: {
        supported: hasGeolocation,
        supportsHighAccuracy: true,
        supportsBackground: false,
        supportsGeofencing: hasGeolocation,
        supportsCompass: typeof window !== "undefined" && "ondeviceorientationabsolute" in window,
      },
      sensors: {
        accelerometer: typeof window !== "undefined" && ("DeviceMotionEvent" in window || "Accelerometer" in window),
        gyroscope: typeof window !== "undefined" && ("DeviceMotionEvent" in window || "Gyroscope" in window),
        magnetometer: typeof window !== "undefined" && "ondeviceorientationabsolute" in window,
        barometer: false,
        proximityDetector: false,
      },
      maxConcurrentStreams: 4,
    };
  }

  async getPermissions(): Promise<PermissionState> {
    return queryWebPermissions();
  }

  async requestPermission(type: keyof PermissionState): Promise<PermissionStatus> {
    return requestWebPermission(type);
  }

  async capturePhoto(options?: { quality?: number; facingMode?: "user" | "environment" }): Promise<CapturedPhoto> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: options?.facingMode ?? "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
    });

    try {
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0);

      const quality = options?.quality ?? 0.9;
      const dataUrl = canvas.toDataURL("image/jpeg", quality);

      let location: GeolocationCoordinates | undefined;
      if (navigator.geolocation) {
        try {
          location = await new Promise<GeolocationCoordinates>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(p => resolve(p.coords), reject, { timeout: 2000 })
          );
        } catch { }
      }

      return {
        dataUrl,
        width: canvas.width,
        height: canvas.height,
        mimeType: "image/jpeg",
        timestamp: Date.now(),
        location,
      };
    } finally {
      stream.getTracks().forEach(t => t.stop());
    }
  }

  async startCameraStream(config: CameraScanConfig): Promise<{ stop: () => void }> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", frameRate: { ideal: config.frameRate } },
    });
    this.activeStreams.set("camera", stream);

    const video = document.createElement("video");
    video.srcObject = stream;
    await video.play();

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    const intervalMs = Math.max(Math.round(1000 / config.frameRate), 33);
    let barcodeDetector: { detect: (source: HTMLCanvasElement) => Promise<Array<{ rawValue: string }>> } | null = null;

    if ("BarcodeDetector" in window && (config.mode === "qr" || config.mode === "barcode")) {
      try {
        const BD = (window as unknown as { BarcodeDetector: { new(opts: object): typeof barcodeDetector } }).BarcodeDetector;
        barcodeDetector = new BD({ formats: ["qr_code", "code_128", "ean_13", "data_matrix"] });
      } catch { }
    }

    const intervalId = setInterval(async () => {
      if (video.readyState < 2) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const frameData = canvas.toDataURL("image/jpeg", 0.7).split(",")[1] ?? "";
      config.onFrame(frameData, Date.now());

      if (barcodeDetector && config.onQRResult) {
        try {
          const codes = await barcodeDetector.detect(canvas);
          if (codes.length > 0 && codes[0]) {
            config.onQRResult(codes[0].rawValue);
          }
        } catch { }
      }
    }, intervalMs);

    return {
      stop: () => {
        clearInterval(intervalId);
        stream.getTracks().forEach(t => t.stop());
        this.activeStreams.delete("camera");
      },
    };
  }

  stopCameraStream(): void {
    const stream = this.activeStreams.get("camera");
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      this.activeStreams.delete("camera");
    }
  }

  async startMicrophone(config?: { sampleRate?: number; channels?: number }): Promise<{ stop: () => void }> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: config?.sampleRate ?? 16000,
        channelCount: config?.channels ?? 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    this.activeStreams.set("microphone", stream);

    return {
      stop: () => {
        stream.getTracks().forEach(t => t.stop());
        this.activeStreams.delete("microphone");
        this.audioContext?.close();
        this.audioContext = null;
      },
    };
  }

  async startVoiceActivation(config: VoiceActivationConfig): Promise<{ stop: () => void }> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });

    this.audioContext = new AudioContext({ sampleRate: 16000 });
    const source = this.audioContext.createMediaStreamSource(stream);
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);

    const dataArray = new Float32Array(analyser.fftSize);
    let isSpeaking = false;
    let silenceStart = 0;

    const checkVAD = () => {
      analyser.getFloatTimeDomainData(dataArray);
      const rms = Math.sqrt(dataArray.reduce((sum, val) => sum + val * val, 0) / dataArray.length);
      const threshold = config.threshold ?? 0.01;

      if (rms > threshold) {
        if (!isSpeaking) {
          isSpeaking = true;
        }
        silenceStart = 0;
        const chunk: AudioChunk = {
          data: dataArray.slice(),
          sampleRate: 16000,
          timestamp: Date.now(),
          vadScore: rms,
        };
        config.onActivation(chunk);
      } else if (isSpeaking) {
        if (!silenceStart) silenceStart = Date.now();
        if (Date.now() - silenceStart > (config.silenceDuration ?? 1500)) {
          isSpeaking = false;
          silenceStart = 0;
          config.onSilence();
        }
      }
    };

    const intervalId = setInterval(checkVAD, 100);

    return {
      stop: () => {
        clearInterval(intervalId);
        stream.getTracks().forEach(t => t.stop());
        this.audioContext?.close();
        this.audioContext = null;
      },
    };
  }

  stopMicrophone(): void {
    const stream = this.activeStreams.get("microphone");
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      this.activeStreams.delete("microphone");
    }
    this.audioContext?.close();
    this.audioContext = null;
  }

  async getCurrentLocation(options?: { highAccuracy?: boolean }): Promise<LocationUpdate> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude ?? undefined,
          heading: pos.coords.heading ?? undefined,
          speed: pos.coords.speed ?? undefined,
          timestamp: pos.timestamp,
        }),
        (err) => reject(new Error(`Location error: ${err.message}`)),
        { enableHighAccuracy: options?.highAccuracy ?? true, timeout: 10000, maximumAge: 0 },
      );
    });
  }

  async startLocationTracking(interval: number, onUpdate: (loc: LocationUpdate) => void): Promise<{ stop: () => void }> {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => onUpdate({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        altitude: pos.coords.altitude ?? undefined,
        heading: pos.coords.heading ?? undefined,
        speed: pos.coords.speed ?? undefined,
        timestamp: pos.timestamp,
      }),
      (err) => console.warn("Location tracking error:", err),
      { enableHighAccuracy: true, timeout: interval, maximumAge: interval / 2 },
    );
    this.locationWatchId = watchId;

    return {
      stop: () => {
        navigator.geolocation.clearWatch(watchId);
        this.locationWatchId = null;
      },
    };
  }

  async addGeofence(config: GeofenceConfig): Promise<{ remove: () => void }> {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const dist = haversineDistance(
          pos.coords.latitude, pos.coords.longitude,
          config.latitude, config.longitude,
        );

        const wasInside = (this.geofences.get(config.id) as (GeofenceConfig & { _inside?: boolean }) | undefined)?._inside ?? false;
        const isInside = dist <= config.radius;

        if (isInside && !wasInside) {
          config.onEnter?.({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          });
        } else if (!isInside && wasInside) {
          config.onExit?.({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          });
        }

        this.geofences.set(config.id, { ...config, _inside: isInside, watchId } as GeofenceConfig & { _inside: boolean; watchId: number });
      },
      undefined,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );

    this.geofences.set(config.id, { ...config, watchId });

    return {
      remove: () => {
        navigator.geolocation.clearWatch(watchId);
        this.geofences.delete(config.id);
      },
    };
  }

  async startSensorTracking(onReading: (reading: SensorReading) => void): Promise<{ stop: () => void }> {
    const handlers: Array<() => void> = [];

    if ("DeviceMotionEvent" in window) {
      const motionHandler = (e: DeviceMotionEvent) => {
        if (!e.acceleration) return;
        onReading({
          accelerometer: {
            x: e.acceleration.x ?? 0,
            y: e.acceleration.y ?? 0,
            z: e.acceleration.z ?? 0,
            timestamp: Date.now(),
          },
        });
      };
      window.addEventListener("devicemotion", motionHandler);
      handlers.push(() => window.removeEventListener("devicemotion", motionHandler));
    }

    if ("DeviceOrientationEvent" in window) {
      const orientationHandler = (e: DeviceOrientationEvent) => {
        onReading({
          gyroscope: {
            alpha: e.alpha ?? 0,
            beta: e.beta ?? 0,
            gamma: e.gamma ?? 0,
            timestamp: Date.now(),
          },
        });
      };
      window.addEventListener("deviceorientation", orientationHandler);
      handlers.push(() => window.removeEventListener("deviceorientation", orientationHandler));
    }

    this.sensorListeners = handlers;

    return {
      stop: () => {
        handlers.forEach(h => h());
        this.sensorListeners = [];
      },
    };
  }
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
