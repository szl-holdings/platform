import { Router, type IRouter } from "express";
import { bodyShape } from "@szl-holdings/contracts/common";
import { z } from "zod";
import { db, notificationRecipientsTable } from "@szl-holdings/db";
import { eq, and } from "drizzle-orm";
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendNoContent,
  sendNotFound,
  handleRouteError,
} from "../lib/api-response";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";
import { notificationRecipientCreateSchema, notificationRecipientUpdateSchema, validateBody } from "../lib/validation";

const router: IRouter = Router();

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

router.get("/notification-recipients", authMiddleware(), requireRole("ops"), async (_req, res) => {
  try {
    const recipients = await db
      .select()
      .from(notificationRecipientsTable)
      .where(eq(notificationRecipientsTable.isActive, true));
    sendSuccess(res, recipients);
  } catch (err) {
    handleRouteError(res, err, "Failed to list notification recipients");
  }
});

router.post("/notification-recipients", authMiddleware(), requireRole("ops"), validateBody(notificationRecipientCreateSchema), async (req, res) => {
  try {
    const { phoneNumber, label, smsEnabled, voiceEnabled, userId } = req.body;
    const normalized = phoneNumber.trim().replace(/\s+/g, "");

    const existing = await db
      .select()
      .from(notificationRecipientsTable)
      .where(eq(notificationRecipientsTable.phoneNumber, normalized));

    if (existing.length > 0 && existing[0]!.isActive) {
      sendBadRequest(res, "A recipient with this phone number already exists");
      return;
    }

    if (existing.length > 0) {
      const [updated] = await db
        .update(notificationRecipientsTable)
        .set({
          label: label ?? existing[0]!.label,
          smsEnabled: smsEnabled !== undefined ? smsEnabled : existing[0]!.smsEnabled,
          voiceEnabled: voiceEnabled !== undefined ? voiceEnabled : existing[0]!.voiceEnabled,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(notificationRecipientsTable.id, existing[0]!.id))
        .returning();
      sendSuccess(res, updated);
      return;
    }

    const [created] = await db
      .insert(notificationRecipientsTable)
      .values({
        userId: userId ?? req.user!.id,
        phoneNumber: normalized,
        label: label ?? null,
        smsEnabled: smsEnabled !== undefined ? smsEnabled : true,
        voiceEnabled: voiceEnabled !== undefined ? voiceEnabled : false,
      })
      .returning();

    sendCreated(res, created);
  } catch (err) {
    handleRouteError(res, err, "Failed to register notification recipient");
  }
});

router.patch("/notification-recipients/:id", authMiddleware(), requireRole("ops"), validateBody(notificationRecipientUpdateSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const { label, smsEnabled, voiceEnabled } = req.body;

    const [existing] = await db
      .select()
      .from(notificationRecipientsTable)
      .where(eq(notificationRecipientsTable.id, id));

    if (!existing) {
      sendNotFound(res, "Notification recipient");
      return;
    }

    const [updated] = await db
      .update(notificationRecipientsTable)
      .set({
        label: label !== undefined ? label : existing.label,
        smsEnabled: smsEnabled !== undefined ? smsEnabled : existing.smsEnabled,
        voiceEnabled: voiceEnabled !== undefined ? voiceEnabled : existing.voiceEnabled,
        updatedAt: new Date(),
      })
      .where(eq(notificationRecipientsTable.id, id))
      .returning();

    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to update notification recipient");
  }
});

router.delete("/notification-recipients/:id", validateBody(bodyShape({})), authMiddleware(), requireRole("ops"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [existing] = await db
      .select()
      .from(notificationRecipientsTable)
      .where(eq(notificationRecipientsTable.id, id));

    if (!existing) {
      sendNotFound(res, "Notification recipient");
      return;
    }

    await db
      .update(notificationRecipientsTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(notificationRecipientsTable.id, id));

    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to remove notification recipient");
  }
});

export default router;
