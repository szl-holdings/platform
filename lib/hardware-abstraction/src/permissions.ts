import type { PermissionState, PermissionStatus } from "./types";

export async function queryWebPermissions(): Promise<PermissionState> {
  const result: PermissionState = {
    camera: "unavailable",
    microphone: "unavailable",
    location: "unavailable",
    notifications: "unavailable",
  };

  if (typeof navigator === "undefined") return result;

  const permissionsAPI = (navigator as Navigator & { permissions?: { query: (opts: { name: string }) => Promise<{ state: string }> } }).permissions;

  const checkPermission = async (name: string): Promise<PermissionStatus> => {
    if (!permissionsAPI) return "prompt";
    try {
      const status = await permissionsAPI.query({ name });
      const s = status.state as string;
      if (s === "granted") return "granted";
      if (s === "denied") return "denied";
      return "prompt";
    } catch {
      return "prompt";
    }
  };

  const [camera, microphone, location, notifications] = await Promise.all([
    checkPermission("camera"),
    checkPermission("microphone"),
    checkPermission("geolocation"),
    checkPermission("notifications"),
  ]);

  return {
    camera: typeof navigator.mediaDevices !== "undefined" ? camera : "unavailable",
    microphone: typeof navigator.mediaDevices !== "undefined" ? microphone : "unavailable",
    location: typeof navigator.geolocation !== "undefined" ? location : "unavailable",
    notifications: "Notification" in window ? notifications : "unavailable",
  };
}

export async function requestWebPermission(type: keyof PermissionState): Promise<PermissionStatus> {
  try {
    if (type === "camera" || type === "microphone") {
      const constraints = type === "camera"
        ? { video: true }
        : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach(t => t.stop());
      return "granted";
    }
    if (type === "location") {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve("granted"),
          (err) => resolve(err.code === 1 ? "denied" : "prompt"),
          { timeout: 5000 },
        );
      });
    }
    if (type === "notifications") {
      const perm = await Notification.requestPermission();
      return perm === "granted" ? "granted" : perm === "denied" ? "denied" : "prompt";
    }
    return "unavailable";
  } catch {
    return "denied";
  }
}
