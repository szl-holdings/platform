/**
 * /api/payload/* — read-only handoff payload surface backed by the canonical
 * @szl-holdings/payload package (packages/payload/raw/). Allowlisted in
 * global-auth-enforcer because every byte is intentionally public.
 */

import { Router, type IRouter } from "express";
import {
  COMPONENTS,
  DOCTRINE,
  MASTER,
  ORG_SUMMARY,
  PANEL_FACTS,
  REPOS,
} from "@szl-holdings/payload/server";

const router: IRouter = Router();

router.get("/", (_req, res) => {
  res.json({
    schemaVersion: MASTER.schema_version,
    generatedAt: MASTER.generated_at,
    doctrine: DOCTRINE,
    orgSummary: ORG_SUMMARY,
    repoCount: Object.keys(REPOS).length,
    components: Object.keys(COMPONENTS),
    fileIntegrityCount: Object.keys(MASTER.file_integrity ?? {}).length,
    panelFacts: PANEL_FACTS,
  });
});

router.get("/thesis", (_req, res) => res.json(COMPONENTS.thesis));
router.get("/runtime", (_req, res) => res.json(COMPONENTS.runtime));
router.get("/agi_v5", (_req, res) => res.json(COMPONENTS.agi_v5));
router.get("/ops", (_req, res) => res.json(COMPONENTS.ops));
router.get("/github", (_req, res) => res.json(COMPONENTS.github));
router.get("/integrity", (_req, res) =>
  res.json({
    count: Object.keys(MASTER.file_integrity ?? {}).length,
    entries: MASTER.file_integrity,
  }),
);

export default router;
