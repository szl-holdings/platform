let initialized = false;

interface VitalsPayload {
  appSlug: string;
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
  inp?: number;
  pathname?: string;
}

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

function isLayoutShift(entry: PerformanceEntry): entry is LayoutShiftEntry {
  return entry.entryType === "layout-shift" && "value" in entry;
}

export function initWebVitals(appSlug: string, apiBase: string) {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const vitals: Partial<VitalsPayload> = { appSlug };

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      switch (entry.entryType) {
        case "largest-contentful-paint":
          vitals.lcp = entry.startTime;
          break;
        case "first-input": {
          const fie = entry as PerformanceEventTiming;
          vitals.fid = fie.processingStart - fie.startTime;
          break;
        }
        case "layout-shift": {
          if (isLayoutShift(entry) && !entry.hadRecentInput) {
            vitals.cls = (vitals.cls || 0) + entry.value;
          }
          break;
        }
        case "paint":
          if (entry.name === "first-contentful-paint") {
            vitals.fcp = entry.startTime;
          }
          break;
      }
    }
  });

  try {
    observer.observe({ type: "largest-contentful-paint", buffered: true });
  } catch { /* not supported */ }
  try {
    observer.observe({ type: "first-input", buffered: true });
  } catch { /* not supported */ }
  try {
    observer.observe({ type: "layout-shift", buffered: true });
  } catch { /* not supported */ }
  try {
    observer.observe({ type: "paint", buffered: true });
  } catch { /* not supported */ }

  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (nav) {
    vitals.ttfb = nav.responseStart - nav.requestStart;
  }

  const sendVitals = () => {
    vitals.pathname = window.location.pathname;
    const url = `${apiBase}observability/vitals`;
    const payload = JSON.stringify(vitals);
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch { /* silent */ }
  };

  if (document.visibilityState === "hidden") {
    sendVitals();
  } else {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        sendVitals();
      }
    }, { once: true });
  }

  window.addEventListener("pagehide", sendVitals, { once: true });

  setTimeout(sendVitals, 30000);
}
