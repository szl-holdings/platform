import { Router, type IRouter, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";

const router: IRouter = Router();

type AuditFile = "github_full.json" | "thesis_atlas.json" | "gap_report.json" | "backlog.json";

const AUDIT_CANDIDATES: string[] = [
  path.join(__dirname, "data", "audit"),
  path.join(__dirname, "..", "data", "audit"),
  path.join(__dirname, "..", "..", "data", "audit"),
  path.join(process.cwd(), "dist", "data", "audit"),
  path.join(process.cwd(), "src", "data", "audit"),
  path.join(process.cwd(), "data", "audit"),
  path.join(process.cwd(), "artifacts", "api-server", "dist", "data", "audit"),
  path.join(process.cwd(), "artifacts", "api-server", "src", "data", "audit"),
];

let resolvedAuditDir: string | null = null;
function findAuditDir(file: AuditFile): string {
  if (resolvedAuditDir) return resolvedAuditDir;
  for (const dir of AUDIT_CANDIDATES) {
    try {
      if (fs.existsSync(path.join(dir, file))) {
        resolvedAuditDir = dir;
        return dir;
      }
    } catch {
      // ignore and continue probing
    }
  }
  throw new Error(
    `audit data directory not found; probed: ${AUDIT_CANDIDATES.join(", ")}`,
  );
}

const cache: Partial<Record<AuditFile, unknown>> = {};

function loadAudit(file: AuditFile): unknown {
  if (cache[file] !== undefined) return cache[file];
  const dir = findAuditDir(file);
  const full = path.join(dir, file);
  const raw = fs.readFileSync(full, "utf8");
  const parsed = JSON.parse(raw);
  cache[file] = parsed;
  return parsed;
}

function send(res: Response, file: AuditFile, project: (data: any) => unknown) {
  try {
    const data = loadAudit(file) as any;
    res.json(project(data));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(503).json({ error: message, file });
  }
}

router.get("/github", (_req: Request, res: Response) => {
  send(res, "github_full.json", (d) => d);
});

router.get("/github/summary", (_req: Request, res: Response) => {
  send(res, "github_full.json", (d) => ({
    summary: d.summary ?? null,
    crossRepoFindings: d.crossRepoFindings ?? null,
  }));
});

router.get("/github/repos", (_req: Request, res: Response) => {
  send(res, "github_full.json", (d) => d.repos ?? []);
});

router.get("/github/repos/:name", (req: Request, res: Response) => {
  try {
    const data = loadAudit("github_full.json") as any;
    const repos: any[] = Array.isArray(data.repos) ? data.repos : [];
    const repo = repos.find((r) => r && r.name === req.params.name);
    if (!repo) {
      res.status(404).json({ error: "repo not found", name: req.params.name });
      return;
    }
    res.json(repo);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(503).json({ error: message, file: "github_full.json" });
  }
});

router.get("/thesis", (_req: Request, res: Response) => {
  send(res, "thesis_atlas.json", (d) => d);
});

router.get("/thesis/lineage", (_req: Request, res: Response) => {
  send(res, "thesis_atlas.json", (d) => d.lineage ?? []);
});

router.get("/thesis/index", (_req: Request, res: Response) => {
  send(res, "thesis_atlas.json", (d) => ({
    axioms: d.axioms ?? [],
    derivations: d.derivations ?? [],
    theorems: d.theorems ?? [],
    constants: d.constants ?? [],
    lambdaAxes: d.lambdaAxes ?? [],
    forecastGauges: d.forecastGauges ?? [],
  }));
});

router.get("/thesis/doi", (_req: Request, res: Response) => {
  send(res, "thesis_atlas.json", (d) => ({
    doiLedger: d.doiLedger ?? [],
    publications: d.publications ?? null,
  }));
});

router.get("/gap-report", (_req: Request, res: Response) => {
  send(res, "gap_report.json", (d) => d);
});

router.get("/backlog", (_req: Request, res: Response) => {
  send(res, "backlog.json", (d) => d);
});

router.get("/backlog/top-ten", (_req: Request, res: Response) => {
  send(res, "backlog.json", (d) => {
    const topTen: string[] = Array.isArray(d.topTen) ? d.topTen : [];
    const items: any[] = Array.isArray(d.items) ? d.items : [];
    const byId = new Map<string, any>(items.map((it) => [it.id, it]));
    const ordered = topTen.map((id) => byId.get(id)).filter(Boolean);
    return { topTen, items: ordered };
  });
});

export default router;
