import type { HALInterface, Platform } from "./types";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/Expo|React Native/.test(ua)) return "mobile";
  if (typeof window !== "undefined" && window.navigator) return "web";
  return "unknown";
}

let _instance: HALInterface | null = null;

export class HardwareAbstractionLayer {
  private static _hal: HALInterface | null = null;

  static async getInstance(): Promise<HALInterface> {
    if (HardwareAbstractionLayer._hal) return HardwareAbstractionLayer._hal;

    const platform = detectPlatform();

    if (platform === "web" || platform === "unknown") {
      const { WebHAL } = await import("./web");
      HardwareAbstractionLayer._hal = new WebHAL();
    } else {
      const { WebHAL } = await import("./web");
      HardwareAbstractionLayer._hal = new WebHAL();
    }

    return HardwareAbstractionLayer._hal;
  }

  static reset(): void {
    HardwareAbstractionLayer._hal = null;
  }
}

export async function createHAL(platform?: Platform): Promise<HALInterface> {
  const { WebHAL } = await import("./web");
  return new WebHAL();
}
