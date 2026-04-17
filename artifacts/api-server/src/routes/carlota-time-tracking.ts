import { Router, type IRouter } from "express";
import {
  db,
  carlotaTimeEntriesTable,
  carlotaInvoicesTable,
} from "@szl-holdings/db";
import { desc, eq } from "drizzle-orm";
import {
  sendSuccess,
  sendBadRequest,
  sendNotFound,
  handleRouteError,
} from "../lib/api-response";

/* -----------------------------------------------------------------------
 * Carlota Jo — Time tracking & invoice persistence (public, cross-device)
 *
 * These endpoints back the /time-tracking page in the Carlota Jo artifact.
 * They are intentionally unauthenticated (the marketing demo is public) and
 * are mounted at the TOP of the /api router in src/routes/index.ts — BEFORE
 * any route group that applies blanket auth/tenant-scope middleware to an
 * unprefixed sub-router. That ordering is what keeps them reachable without
 * being intercepted by another router's top-level guard.
 *
 * The globalAuthEnforcer allowlist (see src/middlewares/global-auth-enforcer.ts
 * PUBLIC_PREFIXES) exposes these paths so the deny-by-default /api/* policy
 * lets them through.
 * -----------------------------------------------------------------------*/

type TimeEntryRow = typeof carlotaTimeEntriesTable.$inferSelect;
type InvoiceRow = typeof carlotaInvoicesTable.$inferSelect;

function serializeEntry(row: TimeEntryRow) {
  return {
    id: row.id,
    date: row.date,
    engagement: row.engagement,
    phase: row.phase,
    deliverable: row.deliverable,
    hours: Number(row.hours),
    rateType: row.rateType,
    rate: row.rate,
    description: row.description,
    billable: row.billable,
    approved: row.approved,
    invoiceId: row.invoiceId ?? undefined,
  };
}

function serializeInvoice(row: InvoiceRow) {
  return {
    id: row.id,
    client: row.client,
    engagement: row.engagement,
    amount: Number(row.amount),
    status: row.status,
    dueDate: row.dueDate,
    issuedDate: row.issuedDate,
    items: row.items,
    entryIds: row.entryIds ?? [],
    sentAt: row.sentAt ? row.sentAt.toISOString() : undefined,
  };
}

const router: IRouter = Router();

router.get("/booking/time-entries", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(carlotaTimeEntriesTable)
      .orderBy(desc(carlotaTimeEntriesTable.createdAt));
    sendSuccess(res, rows.map(serializeEntry));
  } catch (err) {
    handleRouteError(res, err, "Failed to list time entries");
  }
});

router.post("/booking/time-entries", async (req, res) => {
  try {
    const b = req.body as Partial<TimeEntryRow> & { hours?: number | string };
    if (
      !b.id ||
      !b.date ||
      !b.engagement ||
      !b.phase ||
      !b.deliverable ||
      b.hours === undefined ||
      !b.rateType
    ) {
      sendBadRequest(
        res,
        "id, date, engagement, phase, deliverable, hours, rateType are required",
      );
      return;
    }
    const [row] = await db
      .insert(carlotaTimeEntriesTable)
      .values({
        id: String(b.id),
        date: String(b.date),
        engagement: String(b.engagement),
        phase: String(b.phase),
        deliverable: String(b.deliverable),
        hours: String(b.hours),
        rateType: b.rateType as TimeEntryRow["rateType"],
        rate:
          typeof b.rate === "number"
            ? b.rate
            : parseInt(String(b.rate ?? 0), 10) || 0,
        description: typeof b.description === "string" ? b.description : "",
        billable: b.billable !== false,
        approved: b.approved === true,
        invoiceId: b.invoiceId ?? null,
      })
      .returning();
    sendSuccess(res, serializeEntry(row), 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create time entry");
  }
});

router.patch("/booking/time-entries/:id", async (req, res) => {
  try {
    const id = String(req.params.id);
    const b = req.body as Partial<TimeEntryRow> & { hours?: number | string };
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (b.date !== undefined) update.date = b.date;
    if (b.engagement !== undefined) update.engagement = b.engagement;
    if (b.phase !== undefined) update.phase = b.phase;
    if (b.deliverable !== undefined) update.deliverable = b.deliverable;
    if (b.hours !== undefined) update.hours = String(b.hours);
    if (b.rateType !== undefined) update.rateType = b.rateType;
    if (b.rate !== undefined)
      update.rate =
        typeof b.rate === "number" ? b.rate : parseInt(String(b.rate), 10) || 0;
    if (b.description !== undefined) update.description = b.description;
    if (b.billable !== undefined) update.billable = b.billable;
    if (b.approved !== undefined) update.approved = b.approved;
    if (b.invoiceId !== undefined) update.invoiceId = b.invoiceId;
    const [row] = await db
      .update(carlotaTimeEntriesTable)
      .set(update)
      .where(eq(carlotaTimeEntriesTable.id, id))
      .returning();
    if (!row) {
      sendNotFound(res, "Time entry");
      return;
    }
    sendSuccess(res, serializeEntry(row));
  } catch (err) {
    handleRouteError(res, err, "Failed to update time entry");
  }
});

router.delete("/booking/time-entries/:id", async (req, res) => {
  try {
    const [row] = await db
      .delete(carlotaTimeEntriesTable)
      .where(eq(carlotaTimeEntriesTable.id, String(req.params.id)))
      .returning();
    if (!row) {
      sendNotFound(res, "Time entry");
      return;
    }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete time entry");
  }
});

router.get("/booking/time-invoices", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(carlotaInvoicesTable)
      .orderBy(desc(carlotaInvoicesTable.createdAt));
    sendSuccess(res, rows.map(serializeInvoice));
  } catch (err) {
    handleRouteError(res, err, "Failed to list invoices");
  }
});

router.post("/booking/time-invoices", async (req, res) => {
  try {
    const b = req.body as Partial<InvoiceRow> & { amount?: number | string };
    if (
      !b.id ||
      !b.client ||
      !b.engagement ||
      b.amount === undefined ||
      !b.dueDate ||
      !b.issuedDate
    ) {
      sendBadRequest(
        res,
        "id, client, engagement, amount, dueDate, issuedDate are required",
      );
      return;
    }
    const [row] = await db
      .insert(carlotaInvoicesTable)
      .values({
        id: String(b.id),
        client: String(b.client),
        engagement: String(b.engagement),
        amount: String(b.amount),
        status: (b.status as InvoiceRow["status"]) ?? "draft",
        dueDate: String(b.dueDate),
        issuedDate: String(b.issuedDate),
        items:
          typeof b.items === "number"
            ? b.items
            : parseInt(String(b.items ?? 0), 10) || 0,
        entryIds: Array.isArray(b.entryIds) ? b.entryIds : [],
      })
      .returning();
    sendSuccess(res, serializeInvoice(row), 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create invoice");
  }
});

router.patch("/booking/time-invoices/:id", async (req, res) => {
  try {
    const id = String(req.params.id);
    const b = req.body as Partial<InvoiceRow> & {
      amount?: number | string;
      sentAt?: string | null;
    };
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (b.client !== undefined) update.client = b.client;
    if (b.engagement !== undefined) update.engagement = b.engagement;
    if (b.amount !== undefined) update.amount = String(b.amount);
    if (b.status !== undefined) update.status = b.status;
    if (b.dueDate !== undefined) update.dueDate = b.dueDate;
    if (b.issuedDate !== undefined) update.issuedDate = b.issuedDate;
    if (b.items !== undefined) update.items = b.items;
    if (b.entryIds !== undefined) update.entryIds = b.entryIds;
    if (b.sentAt !== undefined)
      update.sentAt = b.sentAt ? new Date(b.sentAt) : null;
    const [row] = await db
      .update(carlotaInvoicesTable)
      .set(update)
      .where(eq(carlotaInvoicesTable.id, id))
      .returning();
    if (!row) {
      sendNotFound(res, "Invoice");
      return;
    }
    sendSuccess(res, serializeInvoice(row));
  } catch (err) {
    handleRouteError(res, err, "Failed to update invoice");
  }
});

router.delete("/booking/time-invoices/:id", async (req, res) => {
  try {
    const [row] = await db
      .delete(carlotaInvoicesTable)
      .where(eq(carlotaInvoicesTable.id, String(req.params.id)))
      .returning();
    if (!row) {
      sendNotFound(res, "Invoice");
      return;
    }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete invoice");
  }
});

// Generate draft invoices from approved billable entries that aren't yet invoiced.
router.post("/booking/time-invoices/generate", async (req, res) => {
  try {
    const body = (req.body ?? {}) as {
      engagementToClient?: Record<string, string>;
      issuedDate?: string;
      dueDate?: string;
    };
    const engagementToClient = body.engagementToClient ?? {};
    const issuedDate =
      body.issuedDate ??
      new Date().toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    const dueDate =
      body.dueDate ??
      (() => {
        const d = new Date();
        d.setDate(d.getDate() + 15);
        return d.toLocaleDateString("en-GB", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      })();

    const entries = await db.select().from(carlotaTimeEntriesTable);
    const eligible = entries.filter(
      (e) =>
        e.billable && e.approved && !e.invoiceId && e.engagement !== "Internal",
    );
    if (eligible.length === 0) {
      sendSuccess(res, { invoices: [], updatedEntries: [] });
      return;
    }

    // Determine next invoice sequence from existing IDs of pattern INV-YYYY-NNN
    const existing = await db
      .select({ id: carlotaInvoicesTable.id })
      .from(carlotaInvoicesTable);
    let maxSeq = 0;
    for (const r of existing) {
      const m = /^INV-\d{4}-(\d+)$/.exec(r.id);
      if (m) {
        const n = parseInt(m[1], 10);
        if (!Number.isNaN(n) && n > maxSeq) maxSeq = n;
      }
    }
    let seq = maxSeq + 1;
    const year = new Date().getFullYear();

    const groups = new Map<string, TimeEntryRow[]>();
    for (const e of eligible) {
      const arr = groups.get(e.engagement) ?? [];
      arr.push(e);
      groups.set(e.engagement, arr);
    }

    const createdInvoices: InvoiceRow[] = [];
    const updatedEntries: TimeEntryRow[] = [];

    for (const [engagement, items] of groups) {
      const id = `INV-${year}-${String(seq).padStart(3, "0")}`;
      seq += 1;
      const amount = items.reduce((s, e) => {
        if (!e.billable) return s;
        if (e.rateType === "fixed") return s + e.rate;
        return s + Number(e.hours) * e.rate;
      }, 0);
      const [inv] = await db
        .insert(carlotaInvoicesTable)
        .values({
          id,
          client: engagementToClient[engagement] ?? engagement,
          engagement,
          amount: amount.toFixed(2),
          status: "draft",
          dueDate,
          issuedDate,
          items: items.length,
          entryIds: items.map((e) => e.id),
        })
        .returning();
      createdInvoices.push(inv);

      for (const e of items) {
        const [updated] = await db
          .update(carlotaTimeEntriesTable)
          .set({ invoiceId: id, updatedAt: new Date() })
          .where(eq(carlotaTimeEntriesTable.id, e.id))
          .returning();
        if (updated) updatedEntries.push(updated);
      }
    }

    sendSuccess(res, {
      invoices: createdInvoices.map(serializeInvoice),
      updatedEntries: updatedEntries.map(serializeEntry),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to generate invoices");
  }
});

export default router;
