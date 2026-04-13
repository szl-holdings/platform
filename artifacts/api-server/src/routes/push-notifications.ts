import { Router, type IRouter } from "express";
import { sendSuccess, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { sendPushToUser, sendPushToApp, sendPushBroadcast } from "../lib/expo-push";
import { buildPushMessage, type NotificationTemplate } from "../lib/push-templates";
import type { PushMessagePayload } from "../lib/expo-push";

const router: IRouter = Router();

const VALID_TEMPLATES: NotificationTemplate[] = [
  "aegis_threat_alert",
  "aegis_incident_update",
  "aegis_system_health",
  "vessels_vessel_alert",
  "vessels_compliance_warning",
  "vessels_port_arrival",
  "terra_deal_update",
  "terra_listing_change",
  "terra_distress_signal",
  "carlota_session_reminder",
  "carlota_document_upload",
  "carlota_message",
  "lyte_kpi_alert",
  "lyte_escalation",
  "lyte_milestone",
  "szl_portfolio_update",
  "szl_digest_ready",
  "szl_approval_required",
  "stephen_contact_received",
  "stephen_system_update",
];

router.post("/push-notifications/send", authMiddleware(), requireRole("ops"), async (req, res) => {
  try {
    const { target, userId, appId, template, vars, title, body, data } = req.body;

    if (!["user", "app", "broadcast"].includes(target)) {
      sendBadRequest(res, "target must be one of: user, app, broadcast");
      return;
    }

    let payload: PushMessagePayload;

    if (template) {
      if (!VALID_TEMPLATES.includes(template as NotificationTemplate)) {
        sendBadRequest(res, `Unknown template. Valid templates: ${VALID_TEMPLATES.join(", ")}`);
        return;
      }
      payload = buildPushMessage(template as NotificationTemplate, vars ?? {});
    } else {
      if (!title || !body) {
        sendBadRequest(res, "Either template or both title and body are required");
        return;
      }
      payload = { title, body, data: data ?? {}, sound: "default" };
    }

    let result;

    if (target === "user") {
      if (!userId || typeof userId !== "number") {
        sendBadRequest(res, "userId is required for user-targeted push");
        return;
      }
      result = await sendPushToUser(userId, payload);
    } else if (target === "app") {
      if (!appId || typeof appId !== "string") {
        sendBadRequest(res, "appId is required for app-targeted push");
        return;
      }
      result = await sendPushToApp(appId, payload);
    } else {
      result = await sendPushBroadcast(payload);
    }

    sendSuccess(res, {
      sent: result.sent,
      failed: result.failed,
      total: result.sent + result.failed,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to send push notification");
  }
});

router.get("/push-notifications/templates", authMiddleware(), requireRole("ops"), async (req, res) => {
  sendSuccess(res, {
    templates: VALID_TEMPLATES,
    domains: {
      aegis: VALID_TEMPLATES.filter((t) => t.startsWith("aegis_")),
      vessels: VALID_TEMPLATES.filter((t) => t.startsWith("vessels_")),
      terra: VALID_TEMPLATES.filter((t) => t.startsWith("terra_")),
      carlota: VALID_TEMPLATES.filter((t) => t.startsWith("carlota_")),
      lyte: VALID_TEMPLATES.filter((t) => t.startsWith("lyte_")),
    },
  });
});

export default router;
