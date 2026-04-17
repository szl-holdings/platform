import { Router, type IRouter, type Request, type Response, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { logger } from "../lib/logger";
import {
  sendEmail,
  buildCarlotaInvoiceEmail,
  CARLOTA_ADMIN_EMAIL,
  type CarlotaInvoiceEmailData,
} from "../lib/email";

const router: IRouter = Router();

const invoiceEmailLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Invoice email rate limit exceeded. Please wait a few minutes." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

router.post(
  "/booking/invoices/email",
  invoiceEmailLimit,
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as Partial<CarlotaInvoiceEmailData> & {
        recipientEmail?: string;
        ccAdmin?: boolean;
      };
      const {
        recipientEmail,
        invoiceId,
        clientName,
        engagement,
        issuedDate,
        dueDate,
        amount,
        currency,
        items,
        notes,
        ccAdmin,
      } = body;

      if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
        sendBadRequest(res, "A valid recipientEmail is required.");
        return;
      }
      if (!invoiceId || !clientName || !engagement || typeof amount !== "number") {
        sendBadRequest(res, "invoiceId, clientName, engagement, and amount are required.");
        return;
      }

      const invoiceData: CarlotaInvoiceEmailData = {
        invoiceId,
        clientName,
        engagement,
        issuedDate:
          issuedDate ||
          new Date().toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" }),
        dueDate: dueDate || "Net 15",
        amount,
        currency: currency || "GBP",
        items: Array.isArray(items) ? items : undefined,
        notes,
      };

      const html = buildCarlotaInvoiceEmail(invoiceData);
      const symbol =
        invoiceData.currency === "GBP" ? "£" : invoiceData.currency === "EUR" ? "€" : "$";
      const subject = `Invoice ${invoiceId} from Carlota Jo Advisory — ${symbol}${amount.toLocaleString()}`;

      const sends: Array<Promise<{ success: boolean; error?: string; messageId?: string }>> = [
        sendEmail({ to: recipientEmail, subject, html, replyTo: CARLOTA_ADMIN_EMAIL }),
      ];
      if (ccAdmin) {
        sends.push(
          sendEmail({
            to: CARLOTA_ADMIN_EMAIL,
            subject: `[copy] ${subject}`,
            html,
            replyTo: recipientEmail,
          }),
        );
      }

      const [primary, adminCopy] = await Promise.all(sends);

      if (!primary.success) {
        logger.warn(
          { error: primary.error, invoiceId, recipientEmail },
          "[email] Carlota Jo invoice send failed",
        );
        res.status(502).json({
          success: false,
          error: primary.error || "Email delivery failed",
          message:
            "We couldn't deliver the invoice email. Please verify the recipient address and try again.",
        });
        return;
      }

      res.json({
        success: true,
        messageId: primary.messageId,
        sentTo: recipientEmail,
        sentAt: new Date().toISOString(),
        adminCopySent: adminCopy?.success ?? false,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to email invoice");
    }
  },
);

export default router;
