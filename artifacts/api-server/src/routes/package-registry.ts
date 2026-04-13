import { Router, type Request, type Response } from "express";
import { sendSuccess, sendCreated, sendBadRequest, sendNotFound, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

const PACKAGES = [
  {
    id: "maritime-risk-agent", name: "maritime-risk-agent", scope: "@alloy",
    version: "3.2.0", type: "agent-bundle", domain: "maritime", access: "public",
    downloads: 2847, stars: 94, verified: true, slaCompliant: true,
    publisher: "alloy-core", publishedAt: "2025-11-14",
    description: "Complete maritime risk intelligence agent bundle.",
    tags: ["maritime", "AIS", "sanctions", "risk"],
    dependencies: [
      { name: "@alloy/claude-maritime-config", version: "^2.0.0", type: "model" },
      { name: "@alloy/ais-analysis-tools", version: "^1.4.0", type: "tool" },
    ],
    lockfileHash: "sha256:a8f3c2d...",
  },
  {
    id: "legal-docminer-bundle", name: "legal-docminer-bundle", scope: "@alloy",
    version: "2.5.1", type: "agent-bundle", domain: "legal", access: "public",
    downloads: 1234, stars: 67, verified: true, slaCompliant: true,
    publisher: "alloy-core", publishedAt: "2025-10-28",
    description: "Legal document mining bundle.",
    tags: ["legal", "contracts", "NLP", "extraction"],
    dependencies: [
      { name: "@alloy/gpt4o-mini-legal-config", version: "^1.0.0", type: "model" },
    ],
    lockfileHash: "sha256:b9e4f1a...",
  },
  {
    id: "ais-analysis-tools", name: "ais-analysis-tools", scope: "@alloy",
    version: "1.4.2", type: "tool-binding", domain: "maritime", access: "public",
    downloads: 5621, stars: 203, verified: true, slaCompliant: true,
    publisher: "alloy-core", publishedAt: "2025-08-20",
    description: "Standalone AIS vessel tracking tool bindings.",
    tags: ["AIS", "vessels", "maritime", "tracking"],
    dependencies: [],
    lockfileHash: "sha256:e3f7a0d...",
  },
];

const MARKETPLACE_LISTINGS = [
  {
    id: "sentinel-public", name: "Sentinel Security Agent", creator: "Alloy Core",
    type: "agent", domain: "Security", version: "4.1.0",
    pricing: "per-run", price: 0.042, featured: true, verified: true,
    aibomAvailable: true, securityScanPassed: true, rating: 4.9, reviews: 142,
    deployments: 38, successRate: 99.1, avgLatency: 890,
    tags: ["threat-intel", "OFAC", "maker-checker"], whiteLabelAvailable: true, revenueShare: 70,
    collection: "Defense Ops",
  },
  {
    id: "helmsman-public", name: "Helmsman Maritime AI", creator: "Alloy Core",
    type: "agent", domain: "Maritime", version: "3.2.4",
    pricing: "per-run", price: 0.071, featured: true, verified: true,
    aibomAvailable: true, securityScanPassed: true, rating: 4.8, reviews: 87,
    deployments: 24, successRate: 97.3, avgLatency: 1240,
    tags: ["AIS", "vessels", "sanctions", "maritime"], whiteLabelAvailable: true, revenueShare: 70,
    collection: "Maritime Intelligence",
  },
];

router.get("/packages", (_req: Request, res: Response) => {
  const { domain, type, access, q, sort } = _req.query;
  let result = [...PACKAGES];
  if (domain) result = result.filter(p => p.domain === domain);
  if (type) result = result.filter(p => p.type === type);
  if (access) result = result.filter(p => p.access === access);
  if (q) {
    const query = (q as string).toLowerCase();
    result = result.filter(p =>
      p.name.includes(query) || p.description.includes(query) ||
      p.tags.some(t => t.includes(query))
    );
  }
  if (sort === "stars") result.sort((a, b) => b.stars - a.stars);
  else result.sort((a, b) => b.downloads - a.downloads);

  sendSuccess(res, { packages: result, total: result.length });
});

router.get("/packages/:scope/:name", (req: Request, res: Response) => {
  const { scope, name } = req.params;
  const pkg = PACKAGES.find(p => p.scope === `@${scope}` && p.name === name);
  if (!pkg) return sendNotFound(res, "Package not found");
  sendSuccess(res, { package: pkg });
});

router.post("/packages/install", authMiddleware({ required: false }), async (req: Request, res: Response) => {
  try {
    const { packageId, environmentId, version } = req.body as { packageId?: string; environmentId?: string; version?: string };
    if (!packageId) return sendBadRequest(res, "packageId is required");

    const pkg = PACKAGES.find(p => p.id === packageId);
    if (!pkg) return sendNotFound(res, "Package not found");

    const resolved = {
      packageId,
      resolvedVersion: version ?? pkg.version,
      dependencies: pkg.dependencies.map(d => ({
        name: d.name,
        resolvedVersion: d.version.replace("^", ""),
        type: d.type,
      })),
      lockfileHash: pkg.lockfileHash ?? `sha256:${Math.random().toString(36).slice(2)}`,
      installedAt: new Date().toISOString(),
      environmentId: environmentId ?? "default",
    };

    sendCreated(res, { installation: resolved });
  } catch (err) {
    handleRouteError(res, err, "Failed to install package");
  }
});

router.post("/packages/publish", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { name, scope, version, type, domain, access, description, tags, dependencies } = req.body as {
      name?: string; scope?: string; version?: string; type?: string;
      domain?: string; access?: string; description?: string;
      tags?: string[]; dependencies?: unknown[];
    };

    if (!name || !version || !type || !domain) {
      return sendBadRequest(res, "name, version, type, and domain are required");
    }

    const pkg = {
      id: `${name}-${Date.now()}`,
      name,
      scope: scope ?? "@alloy",
      version,
      type,
      domain,
      access: access ?? "public",
      description: description ?? "",
      tags: tags ?? [],
      dependencies: dependencies ?? [],
      downloads: 0,
      stars: 0,
      verified: false,
      slaCompliant: false,
      publisher: "current-user",
      publishedAt: new Date().toISOString().split("T")[0]!,
      lockfileHash: `sha256:${Math.random().toString(36).slice(2)}`,
      securityScanQueued: true,
    };

    sendCreated(res, { package: pkg, message: "Package published. Security scan queued." });
  } catch (err) {
    handleRouteError(res, err, "Failed to publish package");
  }
});

router.get("/marketplace/listings", (_req: Request, res: Response) => {
  const { collection, type, pricing, q, sort } = _req.query;
  let result = [...MARKETPLACE_LISTINGS];
  if (collection) result = result.filter(l => l.collection === collection);
  if (type) result = result.filter(l => l.type === type);
  if (pricing) result = result.filter(l => l.pricing === pricing);
  if (q) {
    const query = (q as string).toLowerCase();
    result = result.filter(l => l.name.toLowerCase().includes(query) || l.tags.some(t => t.includes(query)));
  }
  if (sort === "deployments") result.sort((a, b) => b.deployments - a.deployments);
  else result.sort((a, b) => b.rating - a.rating);
  sendSuccess(res, { listings: result, total: result.length });
});

router.get("/marketplace/listings/:id", (req: Request, res: Response) => {
  const listing = MARKETPLACE_LISTINGS.find(l => l.id === req.params.id);
  if (!listing) return sendNotFound(res, "Listing not found");
  sendSuccess(res, { listing });
});

router.post("/marketplace/listings", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { name, type, domain, pricing, price, description, tags, whiteLabelAvailable } = req.body as {
      name?: string; type?: string; domain?: string; pricing?: string;
      price?: number; description?: string; tags?: string[]; whiteLabelAvailable?: boolean;
    };
    if (!name || !type || !domain || !pricing) {
      return sendBadRequest(res, "name, type, domain, and pricing are required");
    }
    const listing = {
      id: `listing-${Date.now()}`,
      name, type, domain, pricing,
      price: price ?? undefined,
      description: description ?? "",
      tags: tags ?? [],
      whiteLabelAvailable: whiteLabelAvailable ?? false,
      creator: "current-user",
      version: "1.0.0",
      featured: false, verified: false,
      aibomAvailable: false, securityScanPassed: false,
      rating: 0, reviews: 0, deployments: 0,
      successRate: 0, avgLatency: 0, revenueShare: 70,
      collection: domain,
      status: "pending-review",
    };
    sendCreated(res, { listing, message: "Listing submitted for review. Security scan queued." });
  } catch (err) {
    handleRouteError(res, err, "Failed to publish listing");
  }
});

router.post("/marketplace/deploy", authMiddleware({ required: false }), async (req: Request, res: Response) => {
  try {
    const { listingId, environmentId } = req.body as { listingId?: string; environmentId?: string };
    if (!listingId) return sendBadRequest(res, "listingId is required");

    const listing = MARKETPLACE_LISTINGS.find(l => l.id === listingId);
    if (!listing) return sendNotFound(res, "Listing not found");

    sendCreated(res, {
      deployment: {
        listingId,
        listingName: listing.name,
        environmentId: environmentId ?? "default",
        deployedAt: new Date().toISOString(),
        status: "deploying",
        dependenciesResolved: true,
      },
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to deploy listing");
  }
});

router.get("/marketplace/collections", (_req: Request, res: Response) => {
  const collections = [
    { id: "maritime-intelligence", name: "Maritime Intelligence", count: 3, domain: "Maritime" },
    { id: "legal-ai", name: "Legal AI", count: 2, domain: "Legal" },
    { id: "defense-ops", name: "Defense Ops", count: 3, domain: "Security" },
    { id: "real-estate-analytics", name: "Real Estate Analytics", count: 2, domain: "Real Estate" },
    { id: "analytics-suite", name: "Analytics Suite", count: 2, domain: "Analytics" },
  ];
  sendSuccess(res, { collections });
});

export default router;
