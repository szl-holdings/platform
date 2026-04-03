import type { MetricCollector } from "../collector.js";

let trackerInitialized = false;

export function initInteractionTracker(collector: MetricCollector, appSlug: string) {
  if (trackerInitialized || typeof window === "undefined") return;
  trackerInitialized = true;

  let clickCount = 0;
  let navCount = 0;
  let errorCount = 0;
  const sessionStart = Date.now();

  document.addEventListener("click", () => {
    clickCount++;
    collector.record("client_interactions", clickCount);
  }, { passive: true });

  const originalPushState = history.pushState.bind(history);
  history.pushState = function (...args) {
    navCount++;
    collector.record("client_navigations", navCount);
    return originalPushState(...args);
  };

  window.addEventListener("popstate", () => {
    navCount++;
    collector.record("client_navigations", navCount);
  }, { passive: true });

  window.addEventListener("error", (event) => {
    errorCount++;
    collector.record("client_errors", errorCount);
    collector.addEvent({
      type: "error",
      message: `Client error: ${event.message || "Unknown error"}`,
      pillar: "userExperience",
      severity: "warning",
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    errorCount++;
    collector.record("client_errors", errorCount);
    collector.addEvent({
      type: "error",
      message: `Unhandled promise rejection: ${String(event.reason).slice(0, 100)}`,
      pillar: "userExperience",
      severity: "warning",
    });
  });

  setInterval(() => {
    const sessionDuration = (Date.now() - sessionStart) / 1000;
    collector.record("session_duration", sessionDuration);

    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav) {
      collector.record("page_load_time", nav.loadEventEnd - nav.startTime);
      collector.record("dom_interactive", nav.domInteractive - nav.startTime);
    }
  }, 10000);

  const reportPerformance = () => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav && nav.loadEventEnd > 0) {
      collector.record("page_load_time", nav.loadEventEnd - nav.startTime);
      collector.record("dom_interactive", nav.domInteractive - nav.startTime);
      collector.record("ttfb_metric", nav.responseStart - nav.requestStart);
    }
  };

  if (document.readyState === "complete") {
    reportPerformance();
  } else {
    window.addEventListener("load", reportPerformance, { once: true });
  }
}
