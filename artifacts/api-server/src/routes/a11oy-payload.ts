import { Router, type IRouter } from "express";
import {
  A11OY_ARTIFACT_PAYLOAD,
  DOCTRINE_V6,
  DOI_LEDGER,
  FILE_INTEGRITY_COUNT,
  LAMBDA_AXES,
  ORG_SUMMARY,
  PAYLOAD_COMPONENTS,
  PAYLOAD_GENERATED_AT,
  PAYLOAD_SCHEMA_VERSION,
  PUSH_QUEUE_BLOCKED,
  PUSH_QUEUE_READY,
  REPOS,
} from "@szl-holdings/payload-doctrine";

const router: IRouter = Router();

router.get("/doctrine", (_req, res) => {
  res.json(DOCTRINE_V6);
});

router.get("/doi", (_req, res) => {
  res.json({ totalCount: DOI_LEDGER.length, entries: DOI_LEDGER });
});

router.get("/repos", (_req, res) => {
  res.json({ repos: REPOS, orgSummary: ORG_SUMMARY });
});

router.get("/push-queue", (_req, res) => {
  res.json({ ready: PUSH_QUEUE_READY, blocked: PUSH_QUEUE_BLOCKED });
});

router.get("/axes", (_req, res) => {
  res.json(LAMBDA_AXES);
});

router.get("/artifacts/a11oy", (_req, res) => {
  res.json(A11OY_ARTIFACT_PAYLOAD);
});

router.get("/manifest", (_req, res) => {
  res.json({
    schemaVersion: PAYLOAD_SCHEMA_VERSION,
    generatedAt: PAYLOAD_GENERATED_AT,
    components: PAYLOAD_COMPONENTS,
    fileIntegritySummary: { count: FILE_INTEGRITY_COUNT },
  });
});

export default router;
