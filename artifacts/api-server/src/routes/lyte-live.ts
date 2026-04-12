import { Router, type IRouter } from "express";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { db } from "@szl-holdings/db";
import { sql } from "drizzle-orm";
import os from "os";
import { HEAP_LIMIT_MB, HEAP_WARN_THRESHOLD_MB, HEAP_CRITICAL_THRESHOLD_MB } from "../lib/heap-limits";
import { GitHubAdapter, type GitHubCommit, type GitHubPullRequest, type GitHubIssue } from "@szl-holdings/services";

const router: IRouter = Router();

const lyteCache = new Map<string, { data: unknown; expiry: number; fetchedAt: number; source: string }>();

function getLyteCached<T>(key: string, ttlMs: number, fetcher: () => Promise<{ data: T; source: string }>): Promise<{ data: T; source: string; cacheAgeSeconds: number; isStale: boolean }> {
  const c = lyteCache.get(key);
  const now = Date.now();
  if (c && c.expiry > now) return Promise.resolve({ data: c.data as T, source: c.source, cacheAgeSeconds: Math.floor((now - c.fetchedAt) / 1000), isStale: false });
  return fetcher().then(({ data, source }) => {
    lyteCache.set(key, { data, expiry: now + ttlMs, fetchedAt: now, source });
    return { data, source, cacheAgeSeconds: 0, isStale: false };
  }).catch(() => {
    const s = lyteCache.get(key);
    if (s) return { data: s.data as T, source: "stale", cacheAgeSeconds: Math.floor((now - s.fetchedAt) / 1000), isStale: true };
    throw new Error("Data unavailable");
  });
}

const requestMetrics = {
  totalRequests: 0,
  requestsByRoute: new Map<string, number>(),
  errorCount: 0,
  latencies: [] as number[],
  startTime: Date.now(),
};

export function recordRequest(route: string, latencyMs: number, isError: boolean) {
  requestMetrics.totalRequests++;
  requestMetrics.requestsByRoute.set(route, (requestMetrics.requestsByRoute.get(route) ?? 0) + 1);
  if (isError) requestMetrics.errorCount++;
  requestMetrics.latencies.push(latencyMs);
  if (requestMetrics.latencies.length > 1000) requestMetrics.latencies.shift();
}

const lyteGitHub = new GitHubAdapter();

async function getDbTableSizes(): Promise<{ tableName: string; rowCount: number; sizeKb: number }[]> {
  try {
    const result = await db.execute(sql`
      SELECT
        schemaname,
        tablename,
        n_live_tup as row_count,
        pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename)) / 1024 as size_kb
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
      LIMIT 20
    `);
    return (result.rows as any[]).map(r => ({
      tableName: r.tablename,
      rowCount: parseInt(r.row_count) || 0,
      sizeKb: parseFloat(r.size_kb) || 0,
    }));
  } catch {
    return [];
  }
}

async function getDbConnections(): Promise<{ active: number; idle: number; total: number }> {
  try {
    const result = await db.execute(sql`
      SELECT state, count(*) as cnt
      FROM pg_stat_activity
      WHERE datname = current_database()
      GROUP BY state
    `);
    const rows = result.rows as any[];
    const active = rows.find(r => r.state === "active")?.cnt ?? 0;
    const idle = rows.find(r => r.state === "idle")?.cnt ?? 0;
    const total = rows.reduce((s, r) => s + parseInt(r.cnt), 0);
    return { active: parseInt(active), idle: parseInt(idle), total };
  } catch {
    return { active: 0, idle: 0, total: 0 };
  }
}

router.get("/lyte/live/signals", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const uptimeSecs = process.uptime();
    const memUsage = process.memoryUsage();
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    const avgLatency = requestMetrics.latencies.length > 0
      ? requestMetrics.latencies.reduce((s, v) => s + v, 0) / requestMetrics.latencies.length
      : 0;

    const upSince = new Date(Date.now() - uptimeSecs * 1000).toISOString();

    const signals = [
      {
        id: "api-uptime",
        name: "API Server Uptime",
        value: `${Math.floor(uptimeSecs / 3600)}h ${Math.floor((uptimeSecs % 3600) / 60)}m`,
        rawValue: uptimeSecs,
        unit: "seconds",
        status: uptimeSecs > 60 ? "healthy" : "starting",
        category: "infrastructure",
        source: "process",
        upSince,
      },
      {
        id: "api-requests",
        name: "Total API Requests",
        value: requestMetrics.totalRequests.toLocaleString(),
        rawValue: requestMetrics.totalRequests,
        unit: "requests",
        status: "live",
        category: "traffic",
        source: "internal-metrics",
      },
      {
        id: "api-error-rate",
        name: "Error Rate",
        value: requestMetrics.totalRequests > 0
          ? `${((requestMetrics.errorCount / requestMetrics.totalRequests) * 100).toFixed(2)}%`
          : "0.00%",
        rawValue: requestMetrics.totalRequests > 0 ? (requestMetrics.errorCount / requestMetrics.totalRequests) * 100 : 0,
        unit: "%",
        status: (requestMetrics.totalRequests > 0 && requestMetrics.errorCount / requestMetrics.totalRequests > 0.05) ? "degraded" : "healthy",
        category: "quality",
        source: "internal-metrics",
      },
      {
        id: "api-avg-latency",
        name: "Avg Response Latency",
        value: `${avgLatency.toFixed(0)}ms`,
        rawValue: avgLatency,
        unit: "ms",
        status: avgLatency > 2000 ? "degraded" : avgLatency > 500 ? "elevated" : "healthy",
        category: "performance",
        source: "internal-metrics",
      },
      {
        id: "mem-heap-used",
        name: "Heap Memory Used",
        value: `${(memUsage.heapUsed / 1024 / 1024).toFixed(1)} MB`,
        rawValue: memUsage.heapUsed,
        unit: "bytes",
        status: (memUsage.heapUsed / 1024 / 1024) > HEAP_CRITICAL_THRESHOLD_MB ? "critical" : (memUsage.heapUsed / 1024 / 1024) > HEAP_WARN_THRESHOLD_MB ? "elevated" : "healthy",
        category: "infrastructure",
        source: "process",
        detail: {
          heapUsedMb: +(memUsage.heapUsed / 1024 / 1024).toFixed(1),
          heapTotalMb: +(memUsage.heapTotal / 1024 / 1024).toFixed(1),
          externalMb: +(memUsage.external / 1024 / 1024).toFixed(1),
          rssMb: +(memUsage.rss / 1024 / 1024).toFixed(1),
        },
      },
      {
        id: "system-cpu",
        name: "System CPU Cores",
        value: `${cpus.length} cores`,
        rawValue: cpus.length,
        unit: "cores",
        status: loadAvg[0] / cpus.length > 0.9 ? "elevated" : "healthy",
        category: "infrastructure",
        source: "os",
        detail: {
          model: cpus[0]?.model ?? "Unknown",
          loadAvg1m: loadAvg[0].toFixed(2),
          loadAvg5m: loadAvg[1].toFixed(2),
          loadAvg15m: loadAvg[2].toFixed(2),
        },
      },
      {
        id: "system-memory",
        name: "System Memory",
        value: `${((totalMem - freeMem) / 1024 / 1024 / 1024).toFixed(1)} / ${(totalMem / 1024 / 1024 / 1024).toFixed(1)} GB`,
        rawValue: totalMem - freeMem,
        unit: "bytes",
        status: (totalMem - freeMem) / totalMem > 0.9 ? "critical" : (totalMem - freeMem) / totalMem > 0.75 ? "elevated" : "healthy",
        category: "infrastructure",
        source: "os",
      },
      {
        id: "node-version",
        name: "Node.js Version",
        value: process.version,
        rawValue: process.version,
        unit: "version",
        status: "live",
        category: "runtime",
        source: "process",
      },
    ];

    sendSuccess(res, {
      source: "API Server Self-Observability (process + os module)",
      signals,
      count: signals.length,
      liveData: true,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch live signals"); }
});

router.get("/lyte/live/database-telemetry", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const result = await getLyteCached<any>("lyte-db-telemetry", 30000, async () => {
      const [tableSizes, connections] = await Promise.all([
        getDbTableSizes(),
        getDbConnections(),
      ]);

      const dbStart = Date.now();
      await db.execute(sql`SELECT 1`);
      const dbLatencyMs = Date.now() - dbStart;

      return {
        data: {
          dbLatencyMs,
          status: dbLatencyMs < 100 ? "healthy" : dbLatencyMs < 500 ? "elevated" : "degraded",
          connections,
          tableSizes,
          totalTables: tableSizes.length,
          totalRows: tableSizes.reduce((s, t) => s + t.rowCount, 0),
          totalSizeKb: tableSizes.reduce((s, t) => s + t.sizeKb, 0),
        },
        source: "live-postgresql",
      };
    });

    sendSuccess(res, {
      source: "PostgreSQL Database Telemetry (pg_stat_user_tables)",
      ...result.data,
      dataSource: result.source,
      liveData: true,
      cacheAgeSeconds: result.cacheAgeSeconds,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch database telemetry"); }
});

router.get("/lyte/live/github-activity", authMiddleware({ required: false }), async (req, res) => {
  try {
    const owner = (req.query.owner as string) ?? "SZL-Holdings";
    const repo = (req.query.repo as string) ?? "";

    const result = await getLyteCached<any>(`lyte-github-${owner}-${repo}`, 5 * 60 * 1000, async () => {
      try {
        if (!repo) {
          const repos = await lyteGitHub.listRepos({ owner, perPage: 10 });
          return {
            data: {
              owner,
              repositories: repos.map(r => ({
                name: r.name,
                fullName: r.fullName,
                description: r.description,
                language: r.language,
                stars: r.stars,
                updatedAt: r.updatedAt,
              })),
              totalRepos: repos.length,
            },
            source: "live-github",
          };
        }

        const [commits, prs, issues] = await Promise.allSettled([
          lyteGitHub.listCommits({ owner, repo, perPage: 10 }),
          lyteGitHub.listPullRequests({ owner, repo, state: "all", perPage: 10 }),
          lyteGitHub.listIssues({ owner, repo, state: "all", perPage: 10 }),
        ]);

        const cm = commits.status === "fulfilled" ? commits.value : [];
        const pr = prs.status === "fulfilled" ? prs.value : [];
        const is = issues.status === "fulfilled" ? issues.value : [];

        return {
          data: {
            owner,
            repo,
            recentCommits: cm.slice(0, 10).map((c: GitHubCommit) => ({
              sha: c.shortSha,
              message: c.message,
              author: c.author,
              date: c.date,
              url: c.url,
            })),
            pullRequests: {
              total: pr.length,
              open: pr.filter((p: GitHubPullRequest) => p.state === "open").length,
              merged: pr.filter((p: GitHubPullRequest) => p.merged).length,
              recent: pr.slice(0, 5).map((p: GitHubPullRequest) => ({
                number: p.number,
                title: p.title.slice(0, 80),
                state: p.state,
                author: p.author,
                createdAt: p.createdAt,
                mergedAt: p.mergedAt,
              })),
            },
            issues: {
              total: is.length,
              open: is.filter((i: GitHubIssue) => i.state === "open").length,
            },
          },
          source: "live-github",
        };
      } catch {
        return {
          data: {
            owner,
            repo: repo || "(all)",
            message: "GitHub data unavailable — public repos only or rate limit exceeded",
            repositories: [],
            recentCommits: [],
            pullRequests: { total: 0, open: 0, merged: 0, recent: [] },
            issues: { total: 0, open: 0 },
          },
          source: "unavailable",
        };
      }
    });

    sendSuccess(res, {
      source: "GitHub API (via GitHubAdapter)",
      url: repo ? `https://github.com/${owner}/${repo}` : `https://github.com/${owner}`,
      ...result.data,
      dataSource: result.source,
      liveData: result.source === "live-github",
      cacheAgeSeconds: result.cacheAgeSeconds,
      isStale: result.isStale,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch GitHub activity"); }
});

router.get("/lyte/live/incidents", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const uptimeSecs = process.uptime();
    const memUsage = process.memoryUsage();
    const heapPct = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    const incidents = [];

    if (heapPct > 85) {
      incidents.push({
        id: `heap-${Date.now()}`,
        severity: "high",
        type: "memory-pressure",
        title: "Heap memory pressure detected",
        description: `Heap usage at ${heapPct.toFixed(1)}%`,
        detectedAt: new Date().toISOString(),
        status: "active",
        source: "self-monitoring",
      });
    }

    if (uptimeSecs < 300) {
      incidents.push({
        id: `restart-${Date.now()}`,
        severity: "low",
        type: "recent-restart",
        title: "Recent process restart detected",
        description: `Process started ${Math.floor(uptimeSecs)}s ago`,
        detectedAt: new Date(Date.now() - uptimeSecs * 1000).toISOString(),
        status: "resolved",
        source: "self-monitoring",
      });
    }

    sendSuccess(res, {
      source: "Lyte Self-Monitoring — Process Introspection",
      incidents,
      count: incidents.length,
      allClear: incidents.filter(i => i.status === "active").length === 0,
      liveData: true,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch live incidents"); }
});

router.get("/lyte/live/operations-summary", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const uptimeSecs = process.uptime();
    const memUsage = process.memoryUsage();
    const loadAvg = os.loadavg();
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    const avgLatency = requestMetrics.latencies.length > 0
      ? requestMetrics.latencies.reduce((s, v) => s + v, 0) / requestMetrics.latencies.length
      : null;

    const errorRate = requestMetrics.totalRequests > 0
      ? (requestMetrics.errorCount / requestMetrics.totalRequests) * 100
      : 0;

    const overallStatus = errorRate > 10 ? "degraded" : memUsage.heapUsed / memUsage.heapTotal > 0.9 ? "degraded" : "operational";

    const dbResult = await getLyteCached<any>("lyte-ops-db-check", 15000, async () => {
      const start = Date.now();
      try {
        await db.execute(sql`SELECT 1`);
        return { data: { ok: true, latencyMs: Date.now() - start }, source: "live" };
      } catch {
        return { data: { ok: false, latencyMs: Date.now() - start }, source: "live" };
      }
    });

    sendSuccess(res, {
      source: "Lyte Command Center — Real-time Ecosystem Telemetry",
      status: overallStatus,
      liveData: true,
      process: {
        uptimeSeconds: Math.floor(uptimeSecs),
        uptimeFormatted: `${Math.floor(uptimeSecs / 3600)}h ${Math.floor((uptimeSecs % 3600) / 60)}m ${Math.floor(uptimeSecs % 60)}s`,
        nodeVersion: process.version,
        pid: process.pid,
        platform: process.platform,
      },
      traffic: {
        totalRequests: requestMetrics.totalRequests,
        errorCount: requestMetrics.errorCount,
        errorRatePct: +errorRate.toFixed(2),
        avgLatencyMs: avgLatency ? +avgLatency.toFixed(1) : null,
        activeRoutes: requestMetrics.requestsByRoute.size,
        topRoutes: [...requestMetrics.requestsByRoute.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([route, count]) => ({ route, count })),
      },
      memory: {
        heapUsedMb: +(memUsage.heapUsed / 1024 / 1024).toFixed(1),
        heapTotalMb: +(memUsage.heapTotal / 1024 / 1024).toFixed(1),
        heapUtilizationPct: +((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1),
        rssMb: +(memUsage.rss / 1024 / 1024).toFixed(1),
        systemTotalGb: +(totalMem / 1024 / 1024 / 1024).toFixed(2),
        systemFreeGb: +(freeMem / 1024 / 1024 / 1024).toFixed(2),
        systemUsedPct: +((1 - freeMem / totalMem) * 100).toFixed(1),
      },
      cpu: {
        cores: cpus.length,
        model: cpus[0]?.model ?? "Unknown",
        loadAvg1m: loadAvg[0].toFixed(2),
        loadAvg5m: loadAvg[1].toFixed(2),
        loadAvg15m: loadAvg[2].toFixed(2),
        utilizationPct: +((loadAvg[0] / cpus.length) * 100).toFixed(1),
      },
      database: {
        status: dbResult.data.ok ? "healthy" : "unavailable",
        latencyMs: dbResult.data.latencyMs,
        cacheAgeSeconds: dbResult.cacheAgeSeconds,
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch Lyte operations summary"); }
});

export default router;
