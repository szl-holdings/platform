import { Router, type IRouter, type Request, type Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { sendSuccess, sendCreated, sendBadRequest, handleRouteError } from "../lib/api-response";
import { processMultimodalDocument, listMultimodalDocuments, getMultimodalDocument, type InputModality, type MultimodalDocumentInput } from "../lib/mastra/multimodal-document-engine";
import { ingestDocument as legacyIngestDocument, listDocuments as legacyListDocuments, getDocument as legacyGetDocument } from "../lib/mastra/document-intelligence";
import type { DocumentDomain, DocumentIngestRequest } from "../lib/mastra/document-intelligence";
import multer from "multer";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

function detectModalityFromMime(mimeType: string, filename?: string): InputModality {
  if (mimeType.startsWith("audio/")) return "audio_base64";
  if (mimeType === "application/pdf" || filename?.endsWith(".pdf")) return "pdf_text";
  if (mimeType.startsWith("image/")) {
    if (filename?.toLowerCase().includes("handwritten") || filename?.toLowerCase().includes("scan")) return "handwritten_image";
    return "image_base64";
  }
  if (mimeType === "text/html") return "html";
  if (mimeType === "text/markdown" || filename?.endsWith(".md")) return "markdown";
  return "text";
}

router.post("/multimodal-documents/process", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { modalities, domain, tags, triggeredBy, crossModalLinking } = req.body as MultimodalDocumentInput;

    if (!modalities || !Array.isArray(modalities) || modalities.length === 0) {
      sendBadRequest(res, "modalities array is required");
      return;
    }

    const validTypes: InputModality[] = ["text", "pdf_text", "image_base64", "audio_base64", "handwritten_image", "html", "markdown", "scanned_document"];
    for (const mod of modalities) {
      if (!validTypes.includes(mod.type)) {
        sendBadRequest(res, `Invalid modality type: ${mod.type}. Valid types: ${validTypes.join(", ")}`);
        return;
      }
      if (!mod.content) {
        sendBadRequest(res, "Each modality must have content");
        return;
      }
    }

    const result = await processMultimodalDocument({
      modalities,
      domain: domain as DocumentDomain,
      tags,
      triggeredBy: triggeredBy ?? req.user?.id?.toString(),
      crossModalLinking,
    });

    sendCreated(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to process multimodal document");
  }
});

router.post("/multimodal-documents/upload", authMiddleware(), upload.array("files"), async (req: Request, res: Response) => {
  try {
    const files = (req as Request & { files?: Express.Multer.File[] }).files ?? [];
    const { domain, tags, triggeredBy, crossModalLinking } = req.body as {
      domain?: string;
      tags?: string;
      triggeredBy?: string;
      crossModalLinking?: string;
    };

    if (files.length === 0) {
      sendBadRequest(res, "At least one file is required");
      return;
    }

    const modalities: MultimodalDocumentInput["modalities"] = files.map((file) => {
      const modalityType = detectModalityFromMime(file.mimetype, file.originalname);
      const content = modalityType === "audio_base64" || modalityType === "image_base64" || modalityType === "handwritten_image" || modalityType === "scanned_document"
        ? file.buffer.toString("base64")
        : file.buffer.toString("utf8");

      return {
        type: modalityType,
        content,
        filename: file.originalname,
        label: file.originalname,
      };
    });

    const rawTags = Array.isArray(tags) ? tags[0] : tags;
    const parsedTags = rawTags ? rawTags.split(",").map((t: string) => t.trim()) : [];

    const result = await processMultimodalDocument({
      modalities,
      domain: domain as DocumentDomain,
      tags: parsedTags,
      triggeredBy: triggeredBy ?? req.user?.id?.toString(),
      crossModalLinking: crossModalLinking !== "false",
    });

    sendCreated(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to process uploaded documents");
  }
});

router.get("/multimodal-documents", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { domain, limit: lStr = "20", offset: oStr = "0" } = req.query as Record<string, string>;
    const limit = Math.min(parseInt(lStr, 10) || 20, 100);
    const offset = parseInt(oStr, 10) || 0;

    const result = await listMultimodalDocuments({ domain, limit, offset });
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to list documents");
  }
});

router.get("/multimodal-documents/:documentId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const doc = await getMultimodalDocument(req.params.documentId as string);
    if (!doc) {
      res.status(404).json({ success: false, error: "Document not found" });
      return;
    }
    sendSuccess(res, doc);
  } catch (err) {
    handleRouteError(res, err, "Failed to get document");
  }
});

router.post("/multimodal-documents/ingest", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const body = req.body as DocumentIngestRequest;
    if (!body.content || !body.sourceType) {
      sendBadRequest(res, "content and sourceType are required");
      return;
    }

    const result = await legacyIngestDocument({
      ...body,
      triggeredBy: body.triggeredBy ?? req.user?.id?.toString(),
    });

    sendCreated(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to ingest document");
  }
});

router.get("/multimodal-documents/legacy/list", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { domain, limit: lStr = "20", offset: oStr = "0" } = req.query as Record<string, string>;
    const limit = Math.min(parseInt(lStr, 10) || 20, 100);
    const offset = parseInt(oStr, 10) || 0;
    const result = await legacyListDocuments({ domain, limit, offset });
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to list legacy documents");
  }
});

router.get("/multimodal-documents/legacy/:documentId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const doc = await legacyGetDocument(req.params.documentId as string);
    if (!doc) {
      res.status(404).json({ success: false, error: "Document not found" });
      return;
    }
    sendSuccess(res, doc);
  } catch (err) {
    handleRouteError(res, err, "Failed to get legacy document");
  }
});

export default router;
