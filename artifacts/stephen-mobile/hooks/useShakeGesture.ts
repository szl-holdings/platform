import { useEffect, useCallback } from "react";
import { Platform } from "react-native";

interface UseShakeGestureOptions {
  onShake: () => void;
  threshold?: number;
  enabled?: boolean;
}

export function useShakeGesture({
  onShake,
  threshold = 800,
  enabled = true,
}: UseShakeGestureOptions) {
  const handleMotion = useCallback(
    (event: DeviceMotionEvent) => {
      if (!event.accelerationIncludingGravity) return;
      const { x, y, z } = event.accelerationIncludingGravity;
      const magnitude = Math.sqrt(
        (x ?? 0) * (x ?? 0) + (y ?? 0) * (y ?? 0) + (z ?? 0) * (z ?? 0)
      );
      if (magnitude > threshold / 100) {
        onShake();
      }
    },
    [onShake, threshold]
  );

  useEffect(() => {
    if (!enabled) return;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      let lastShake = 0;
      let lastAcc = { x: 0, y: 0, z: 9.8 };

      const handler = (e: DeviceMotionEvent) => {
        const a = e.accelerationIncludingGravity;
        if (!a) return;
        const dx = Math.abs((a.x ?? 0) - lastAcc.x);
        const dy = Math.abs((a.y ?? 0) - lastAcc.y);
        const dz = Math.abs((a.z ?? 0) - lastAcc.z);
        const shake = dx + dy + dz;

        lastAcc = { x: a.x ?? 0, y: a.y ?? 0, z: a.z ?? 0 };

        if (shake > 30) {
          const now = Date.now();
          if (now - lastShake > 1000) {
            lastShake = now;
            onShake();
          }
        }
      };

      window.addEventListener("devicemotion", handler);
      return () => window.removeEventListener("devicemotion", handler);
    }
  }, [enabled, handleMotion, onShake]);
}
