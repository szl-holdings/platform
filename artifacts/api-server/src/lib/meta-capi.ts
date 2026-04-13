import { logger } from "./logger";

const CAPI_VERSION = "v19.0";

export interface MetaCAPIEvent {
  eventName: string;
  eventId: string;
  eventTime: number;
  sourceUrl?: string;
  userData?: {
    clientUserAgent?: string;
    clientIpAddress?: string;
    fbc?: string;
    fbp?: string;
  };
  customData?: Record<string, unknown>;
}

export async function sendMetaCAPIEvent(
  pixelId: string,
  accessToken: string,
  event: MetaCAPIEvent
): Promise<void> {
  const url = `https://graph.facebook.com/${CAPI_VERSION}/${pixelId}/events`;
  const payload = {
    data: [
      {
        event_name: event.eventName,
        event_id: event.eventId,
        event_time: event.eventTime,
        event_source_url: event.sourceUrl,
        action_source: "website",
        user_data: {
          client_user_agent: event.userData?.clientUserAgent,
          client_ip_address: event.userData?.clientIpAddress,
          fbc: event.userData?.fbc,
          fbp: event.userData?.fbp,
        },
        custom_data: event.customData,
      },
    ],
    access_token: accessToken,
    test_event_code: process.env["META_CAPI_TEST_CODE"],
  };

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      logger.warn({ status: resp.status, body: text }, "[meta-capi] CAPI call failed");
    }
  } catch (err) {
    logger.error({ err }, "[meta-capi] CAPI request error");
  }
}

const CONVERSION_EVENT_MAP: Record<string, string> = {
  demo_requested: "Lead",
  demo_request: "Lead",
  contact_submitted: "Lead",
  form_submit: "Lead",
  checkout_completed: "Purchase",
};

export function getMetaEventName(analyticsEventName: string): string | undefined {
  return CONVERSION_EVENT_MAP[analyticsEventName];
}
