import { contactSubmissionsTable, db, pool } from '@szl-holdings/db';
import { desc, ilike, or, sql } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { logger } from '../lib/logger';
import { validateQuery } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

router.use('/universal-search', authMiddleware());

interface SearchResult {
  id: string;
  type: 'navigation' | 'alert' | 'contact' | 'report' | 'page' | 'entity' | 'setting';
  domain: string;
  title: string;
  subtitle: string;
  icon: string;
  href?: string;
  meta?: Record<string, string>;
  score: number;
}

const NAVIGATION_ITEMS: Omit<SearchResult, 'score'>[] = [
  { id: 'nav-dashboard', type: 'navigation', domain: 'Platform', title: 'Dashboard', subtitle: 'Main dashboard overview', icon: '◆', href: '/' },
  { id: 'nav-alloy', type: 'navigation', domain: 'Platform', title: 'Alloy Orchestration', subtitle: 'Workflow engine and action spine', icon: '⬡', href: '/alloy' },
  { id: 'nav-alloy-workflows', type: 'navigation', domain: 'Alloy', title: 'Workflow Library', subtitle: 'Browse and manage active workflows', icon: '⚡', href: '/alloy/workflows' },
  { id: 'nav-alloy-approvals', type: 'navigation', domain: 'Alloy', title: 'Approval Center', subtitle: 'Pending approval gates and reviews', icon: '✓', href: '/alloy/approvals' },
  { id: 'nav-alloy-audit', type: 'navigation', domain: 'Alloy', title: 'Audit Trail', subtitle: 'Full system audit log', icon: '📋', href: '/alloy/audit' },
  { id: 'nav-command', type: 'navigation', domain: 'Command', title: 'Unified Command', subtitle: 'Strategy, operations & infrastructure', icon: '◆', href: '/command/' },
  { id: 'nav-alerts', type: 'navigation', domain: 'Command', title: 'Alert Inbox', subtitle: 'Active alerts and incident management', icon: '🔔', href: '/command/alerts' },
  { id: 'nav-ops-alerts', type: 'navigation', domain: 'Operations', title: 'Alert Management', subtitle: 'Alert rules, evaluation, and history', icon: '⚙', href: '/command/operations/alerts' },
  { id: 'nav-vessels', type: 'navigation', domain: 'Vessels', title: 'Sextant', subtitle: 'Maritime intelligence & fleet tracking', icon: '⚓', href: '/vessels/' },
  { id: 'nav-terra', type: 'navigation', domain: 'Terra', title: 'Domaine', subtitle: 'Real estate intelligence', icon: '🏢', href: '/terra/' },
  { id: 'nav-counsel', type: 'navigation', domain: 'Counsel', title: 'Counsel', subtitle: 'Legal matter command', icon: '⚖', href: '/counsel/' },
  { id: 'nav-pulse', type: 'navigation', domain: 'Pulse', title: 'Lumina', subtitle: 'AI executive briefing', icon: '💡', href: '/pulse/' },
  { id: 'nav-carlota-jo', type: 'navigation', domain: 'Carlota Jo', title: 'Carlota Jo', subtitle: 'Client & residence support', icon: '◈', href: '/carlota-jo/' },
  { id: 'nav-praxis', type: 'navigation', domain: 'PRAXIS', title: 'PRAXIS Explorer', subtitle: 'Intelligence fusion & multi-hop search', icon: '🔮', href: '/nexus/timeline' },
  { id: 'nav-admin', type: 'navigation', domain: 'Admin', title: 'Admin Panel', subtitle: 'CMS, infrastructure, and operations', icon: '🔧', href: '/admin' },
  { id: 'nav-admin-cc', type: 'navigation', domain: 'Admin', title: 'Admin Command Center', subtitle: 'Support queue, leads, and analytics', icon: '📊', href: '/admin/command-center' },
  { id: 'nav-settings', type: 'navigation', domain: 'Settings', title: 'Platform Settings', subtitle: 'Manage account, security, and preferences', icon: '⚙', href: '/admin/platform-settings' },
  { id: 'nav-reports', type: 'navigation', domain: 'Reports', title: 'Reports Hub', subtitle: 'Generate and view reports', icon: '📄', href: '/reports' },
  { id: 'nav-nuro-forge', type: 'navigation', domain: 'AI', title: 'Nuro Forge', subtitle: 'AI model management and benchmarks', icon: '🧠', href: '/nuro-forge' },
  { id: 'nav-forge', type: 'navigation', domain: 'AI', title: 'Agent Portal', subtitle: 'Agent registry, telemetry, and drift', icon: '🤖', href: '/forge' },
  { id: 'nav-digital-twin', type: 'navigation', domain: 'Operations', title: 'Digital Twin Simulator', subtitle: 'Multi-domain entity simulation', icon: '🔄', href: '/digital-twin' },
  { id: 'nav-research', type: 'navigation', domain: 'Research', title: 'Research Mode', subtitle: 'Deep-dive intelligence and artifact generation', icon: '🔬', href: '/alloy/research' },
];

function scoreMatch(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  const idx = t.indexOf(q);
  if (idx !== -1) return 80 - idx * 0.5;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  if (qi === q.length) return 40;
  return 0;
}

function searchNavigation(query: string): SearchResult[] {
  return NAVIGATION_ITEMS
    .map((item) => {
      const titleScore = scoreMatch(query, item.title);
      const subtitleScore = scoreMatch(query, item.subtitle) * 0.7;
      const domainScore = scoreMatch(query, item.domain) * 0.6;
      const score = Math.max(titleScore, subtitleScore, domainScore);
      return { ...item, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

async function searchContacts(query: string): Promise<SearchResult[]> {
  try {
    const pattern = `%${query}%`;
    const rows = await db
      .select({
        id: contactSubmissionsTable.id,
        name: contactSubmissionsTable.name,
        email: contactSubmissionsTable.email,
        company: contactSubmissionsTable.company,
        subject: contactSubmissionsTable.subject,
        status: contactSubmissionsTable.status,
        createdAt: contactSubmissionsTable.createdAt,
      })
      .from(contactSubmissionsTable)
      .where(
        or(
          ilike(contactSubmissionsTable.name, pattern),
          ilike(contactSubmissionsTable.email, pattern),
          ilike(contactSubmissionsTable.company, pattern),
          ilike(contactSubmissionsTable.subject, pattern),
        ),
      )
      .orderBy(desc(contactSubmissionsTable.createdAt))
      .limit(6);

    return rows.map((row) => ({
      id: `contact-${row.id}`,
      type: 'contact' as const,
      domain: 'Support',
      title: row.name || row.email || 'Unknown',
      subtitle: row.subject || row.company || row.email || '',
      icon: '✉',
      href: '/admin/command-center',
      meta: {
        status: row.status ?? 'new',
        email: row.email ?? '',
      },
      score: 70,
    }));
  } catch (err) {
    logger.warn({ err }, '[universal-search] Contact search failed');
    return [];
  }
}

async function searchAlerts(query: string): Promise<SearchResult[]> {
  try {
    const pattern = `%${query}%`;
    const { rows } = await pool.query<{
      id: string;
      name: string;
      description: string;
      severity: string;
      is_active: boolean;
    }>(
      `SELECT id, name, description, severity, is_active
       FROM platform_alert_rules
       WHERE name ILIKE $1 OR description ILIKE $1
       ORDER BY is_active DESC, last_fired_at DESC NULLS LAST
       LIMIT 6`,
      [pattern],
    );

    return rows.map((row) => ({
      id: `alert-rule-${row.id}`,
      type: 'alert' as const,
      domain: 'Alerts',
      title: row.name,
      subtitle: row.description || `Severity: ${row.severity}`,
      icon: row.is_active ? '🔔' : '🔕',
      href: '/command/operations/alerts',
      meta: {
        severity: row.severity,
        active: String(row.is_active),
      },
      score: 65,
    }));
  } catch (err) {
    logger.warn({ err }, '[universal-search] Alert search failed');
    return [];
  }
}

async function searchPages(query: string): Promise<SearchResult[]> {
  try {
    const pattern = `%${query}%`;
    const { rows } = await pool.query<{
      id: number;
      title: string;
      slug: string;
      status: string;
    }>(
      `SELECT id, title, slug, status
       FROM cms_pages
       WHERE title ILIKE $1 OR slug ILIKE $1
       ORDER BY updated_at DESC NULLS LAST
       LIMIT 5`,
      [pattern],
    );

    return rows.map((row) => ({
      id: `page-${row.id}`,
      type: 'page' as const,
      domain: 'CMS',
      title: row.title,
      subtitle: `/${row.slug}`,
      icon: '📝',
      href: `/${row.slug}`,
      meta: { status: row.status },
      score: 55,
    }));
  } catch (err) {
    logger.warn({ err }, '[universal-search] Page search failed');
    return [];
  }
}

const searchSchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

router.get('/universal-search', validateQuery(searchSchema), async (req, res) => {
  try {
    const q = String(req.query.q).trim();
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const [navResults, contactResults, alertResults, pageResults] = await Promise.all([
      Promise.resolve(searchNavigation(q)),
      searchContacts(q),
      searchAlerts(q),
      searchPages(q),
    ]);

    const allResults = [...navResults, ...contactResults, ...alertResults, ...pageResults]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const grouped: Record<string, SearchResult[]> = {};
    for (const result of allResults) {
      const key = result.type;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(result);
    }

    res.json({
      query: q,
      total: allResults.length,
      results: allResults,
      grouped,
    });
  } catch (err) {
    logger.error({ err }, '[universal-search] Search failed');
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
