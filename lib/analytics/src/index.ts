export * from "./events";
export { configurePlausible, trackEvent, trackPageView } from "./plausible";
export { start as startSessionRecorder, stop as stopSessionRecorder, markConversion as markRecordingConversion, isRecording } from "./session-recorder";
export { initHeatmapCollector } from "./heatmap-collector";
export { configureBridge, bridgeEvent } from "./bridge";
export { initConsent, getConsent, setConsent, acceptAll, declineAll, onConsentChange, CONSENT_VERSION } from "./consent";
export type { ConsentState, ConsentCategories } from "./consent";

import { trackEvent } from "./plausible";
import type {
  PageViewProperties,
  CTAClickProperties,
  FormSubmitProperties,
  DemoRequestProperties,
  AccessRequestProperties,
  PrivateInquiryProperties,
  AuthProperties,
  DashboardViewProperties,
  ArticleViewProperties,
  CheckoutProperties,
} from "./events";

export const analytics = {
  pageView: (props?: PageViewProperties) => trackEvent("page_view", props),

  ctaClick: (props: CTAClickProperties) => trackEvent("cta_click", props),

  formSubmit: (props: FormSubmitProperties) => trackEvent("form_submit", props),

  demoRequest: (props?: DemoRequestProperties) => trackEvent("demo_request", props),

  accessRequest: (props?: AccessRequestProperties) => trackEvent("access_request", props),

  privateInquirySubmit: (props?: PrivateInquiryProperties) =>
    trackEvent("private_inquiry_submit", props),

  signIn: (props?: AuthProperties) => trackEvent("sign_in", props),

  signUp: (props?: AuthProperties) => trackEvent("sign_up", props),

  dashboardView: (props?: DashboardViewProperties) => trackEvent("dashboard_view", props),

  articleView: (props: ArticleViewProperties) => trackEvent("article_view", props),

  checkoutStarted: (props?: CheckoutProperties) => trackEvent("checkout_started", props),

  checkoutCompleted: (props?: CheckoutProperties) => trackEvent("checkout_completed", props),
} as const;

export type Analytics = typeof analytics;

let scrollDepthThresholds = [25, 50, 75, 90];
let trackedDepths: number[] = [];

export function initScrollDepthTracking(
  pageSlug: string,
  thresholds: number[] = scrollDepthThresholds
): () => void {
  trackedDepths = [];
  scrollDepthThresholds = thresholds;

  const handler = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const pct = Math.round((scrollTop / docHeight) * 100);
    for (const threshold of scrollDepthThresholds) {
      if (pct >= threshold && !trackedDepths.includes(threshold)) {
        trackedDepths.push(threshold);
        trackEvent("page_view", { page: pageSlug, scroll_depth: threshold });
      }
    }
  };

  window.addEventListener("scroll", handler, { passive: true });
  return () => window.removeEventListener("scroll", handler);
}
