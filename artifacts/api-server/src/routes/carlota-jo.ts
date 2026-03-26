import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

router.post("/booking/inquiries", async (req: Request, res: Response) => {
  try {
    const { name, email, company, phone, service, message } = req.body as {
      name?: string;
      email?: string;
      company?: string;
      phone?: string;
      service?: string;
      message?: string;
    };

    if (!name || !email || !message) {
      res.status(400).json({ error: "Name, email, and message are required" });
      return;
    }

    const inquiryId = "INQ-" + Date.now().toString(36).toUpperCase();

    res.json({
      success: true,
      inquiryId,
      message: "Inquiry received. Our team will respond within one business day.",
      data: { name, email, company, phone, service, message },
    });
  } catch {
    res.status(500).json({ error: "Failed to process inquiry" });
  }
});

router.post("/booking/reservations", async (req: Request, res: Response) => {
  try {
    const { service, tier, date, time, name, email, company, phone, notes } = req.body as {
      service?: string;
      tier?: string;
      date?: string;
      time?: string;
      name?: string;
      email?: string;
      company?: string;
      phone?: string;
      notes?: string;
    };

    if (!service || !tier || !date || !time || !name || !email) {
      res.status(400).json({ error: "Service, tier, date, time, name, and email are required" });
      return;
    }

    const confirmationId = "CJ-" + Date.now().toString(36).toUpperCase();

    res.json({
      success: true,
      confirmationId,
      message: "Consultation booked successfully.",
      booking: { service, tier, date, time, name, email, company, phone, notes },
    });
  } catch {
    res.status(500).json({ error: "Failed to create reservation" });
  }
});

router.get("/booking/availability", async (_req: Request, res: Response) => {
  const days: string[] = [];
  const today = new Date();
  const d = new Date(today);
  d.setDate(d.getDate() + 3);
  while (days.length < 14) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      days.push(d.toISOString().split("T")[0]);
    }
    d.setDate(d.getDate() + 1);
  }

  res.json({
    availableDates: days,
    timeSlots: ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"],
    timezone: "America/New_York",
  });
});

router.post("/booking/invoices", async (req: Request, res: Response) => {
  try {
    const { confirmationId, tier, service, email } = req.body as {
      confirmationId?: string;
      tier?: string;
      service?: string;
      email?: string;
    };

    if (!confirmationId || !tier || !email) {
      res.status(400).json({ error: "confirmationId, tier, and email are required" });
      return;
    }

    const tierPricing: Record<string, number> = {
      "strategy-session": 4500,
      "portfolio-review": 45000,
      "advisory-retainer": 18000,
    };

    const amount = tierPricing[tier] || 0;
    const invoiceId = "INV-" + Date.now().toString(36).toUpperCase();

    res.json({
      success: true,
      invoice: {
        invoiceId,
        confirmationId,
        tier,
        service,
        email,
        amount,
        currency: "USD",
        status: "pending",
        issuedAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

router.get("/booking/invoices/:invoiceId", async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;

    res.json({
      success: true,
      invoice: {
        invoiceId,
        confirmationId: "CJ-DEMO",
        tier: "strategy-session",
        service: "strategic-advisory",
        email: "demo@carlotajo.com",
        amount: 4500,
        currency: "USD",
        status: "pending",
        issuedAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to retrieve invoice" });
  }
});

router.post("/stripe/checkout", async (req: Request, res: Response) => {
  try {
    const { tierId, tierName, service, email, successUrl, cancelUrl } = req.body as {
      tierId?: string;
      tierName?: string;
      service?: string;
      email?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!tierId || !successUrl || !cancelUrl) {
      res.status(400).json({ error: "tierId, successUrl, and cancelUrl are required" });
      return;
    }

    res.status(503).json({
      error: "Payment processing is not currently configured.",
      message: "Stripe integration is not active. Your booking has been recorded and our team will follow up with payment details.",
      booking: { tierId, tierName, service, email, successUrl, cancelUrl },
    });
  } catch {
    res.status(500).json({ error: "Failed to initiate checkout" });
  }
});

export default router;
