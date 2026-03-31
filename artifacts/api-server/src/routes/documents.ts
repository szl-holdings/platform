import { Router, type Request, type Response } from "express";
import { generateDocument } from "../lib/pdf-generator.js";
import { logger } from "../lib/logger.js";

const router = Router();

const VALID_TEMPLATES = [
  "stephen-resume",
  "szl-investor-letter",
  "szl-compliance-summary",
  "szl-portfolio-report",
  "terra-property-report",
  "aegis-assessment-report",
  "firestorm-incident-summary",
  "carlota-engagement-summary",
] as const;

type ValidTemplate = (typeof VALID_TEMPLATES)[number];

function isValidTemplate(t: unknown): t is ValidTemplate {
  return typeof t === "string" && (VALID_TEMPLATES as readonly string[]).includes(t);
}

router.post("/documents/generate", async (req: Request, res: Response) => {
  const { template, data = {} } = req.body as { template: unknown; data?: Record<string, unknown> };

  if (!isValidTemplate(template)) {
    res.status(400).json({
      error: "Bad Request",
      message: `Invalid template. Valid options: ${VALID_TEMPLATES.join(", ")}`,
      statusCode: 400,
    });
    return;
  }

  try {
    const pdfBuffer = await generateDocument(template, data as Record<string, unknown>);

    const fileNames: Record<ValidTemplate, string> = {
      "stephen-resume": "stephen-lutar-resume.pdf",
      "szl-investor-letter": "szl-investor-letter.pdf",
      "szl-compliance-summary": "szl-compliance-summary.pdf",
      "szl-portfolio-report": "szl-portfolio-report.pdf",
      "terra-property-report": "terra-property-report.pdf",
      "aegis-assessment-report": "aegis-assessment-report.pdf",
      "firestorm-incident-summary": "aegis-incident-report.pdf",
      "carlota-engagement-summary": "carlota-engagement-summary.pdf",
    };

    const fileName = fileNames[template];

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": pdfBuffer.length,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });

    res.send(pdfBuffer);
  } catch (err) {
    logger.error({ err, template }, "PDF generation failed");
    res.status(500).json({
      error: "Internal Server Error",
      message: "PDF generation failed. Please try again.",
      statusCode: 500,
    });
  }
});

router.get("/documents/templates", (_req: Request, res: Response) => {
  res.json({
    templates: VALID_TEMPLATES.map((t) => ({
      id: t,
      name: t
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    })),
  });
});

export default router;
