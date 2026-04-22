/**
 * Launch Publish Scheduler unit test.
 *
 * Exercises runLaunchPublishScheduler() with a fully mocked database and
 * mocked publishing adapters to prove that:
 *   1. Articles with status=approved + mediumStatus=ready + publishTargetDate
 *      <= now get published to Medium.
 *   2. Calendar items whose scheduledDate has passed dispatch to the right
 *      channel (article -> Medium, newsletter -> Substack, carousel ->
 *      LinkedIn, x-post -> X) and the calendar row gets flipped to
 *      "published" with the destination URL recorded.
 *   3. Failures do not flip the source row to published, and a per-item
 *      backoff prevents an immediate re-attempt on the next sweep.
 *   4. Rows already at their terminal status are skipped.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

interface RowState {
  articles: Map<number, Record<string, unknown>>;
  newsletters: Map<number, Record<string, unknown>>;
  carousels: Map<number, Record<string, unknown>>;
  xposts: Map<number, Record<string, unknown>>;
  calendar: Map<number, Record<string, unknown>>;
  automationRuns: Array<Record<string, unknown>>;
}

const state: RowState = {
  articles: new Map(),
  newsletters: new Map(),
  carousels: new Map(),
  xposts: new Map(),
  calendar: new Map(),
  automationRuns: [],
};

function resetState() {
  state.articles.clear();
  state.newsletters.clear();
  state.carousels.clear();
  state.xposts.clear();
  state.calendar.clear();
  state.automationRuns = [];
}

// Table sentinels — the route code does `eq(table.id, n)` etc. We just need
// stable object identity to detect which table is being queried.
const TABLES = {
  articles: { __name: 'articles' },
  newsletters: { __name: 'newsletters' },
  carousels: { __name: 'carousels' },
  xposts: { __name: 'xposts' },
  calendar: { __name: 'calendar' },
  automationRuns: { __name: 'automationRuns' },
};

function tableNameFor(t: unknown): keyof RowState | null {
  if (t === TABLES.articles) return 'articles';
  if (t === TABLES.newsletters) return 'newsletters';
  if (t === TABLES.carousels) return 'carousels';
  if (t === TABLES.xposts) return 'xposts';
  if (t === TABLES.calendar) return 'calendar';
  if (t === TABLES.automationRuns) return 'automationRuns';
  return null;
}

interface WhereSpec {
  byId?: number;
  scan?: keyof RowState;
}

const lastWhere: { current: WhereSpec | null } = { current: null };

function makeSelectChain() {
  const chain = {
    from(table: unknown) {
      const name = tableNameFor(table);
      lastWhere.current = name ? { scan: name } : null;
      return chain;
    },
    where() {
      // We piggy-back on the most recent eqId() spec set by `eq` mock; if
      // none was set this is a scan.
      if (eqIdSpec.id != null) {
        lastWhere.current = { ...lastWhere.current, byId: eqIdSpec.id };
        eqIdSpec.id = null;
      }
      return resolveSelect();
    },
    orderBy() {
      return resolveSelect();
    },
    limit() {
      return resolveSelect();
    },
    then(resolve: (v: unknown[]) => void, reject?: (e: unknown) => void) {
      return resolveSelect().then(resolve, reject);
    },
  };
  return chain;
}

const eqIdSpec: { id: number | null } = { id: null };

async function resolveSelect(): Promise<unknown[]> {
  const w = lastWhere.current;
  if (!w?.scan) return [];
  const table = state[w.scan];
  if (table instanceof Map) {
    if (w.byId != null) {
      const row = table.get(w.byId);
      return row ? [row] : [];
    }
    // Scan: filter by the basic scheduler eligibility rules per table.
    const now = nowOverride.value;
    const all = Array.from(table.values());
    switch (w.scan) {
      case 'articles':
        return all.filter(
          (a) =>
            a.status === 'approved' &&
            a.mediumStatus === 'ready' &&
            !a.externalUrlMedium &&
            a.publishTargetDate != null &&
            (a.publishTargetDate as Date) <= now,
        );
      case 'xposts':
        return all.filter(
          (p) =>
            ['approved-for-auto-send', 'queued', 'scheduled', 'approved'].includes(
              p.status as string,
            ) &&
            !p.sentAt &&
            (p.scheduledFor as Date) <= now,
        );
      case 'calendar':
        return all.filter(
          (c) => c.status === 'ready' && c.contentId != null && (c.scheduledDate as Date) <= now,
        );
      default:
        return all;
    }
  }
  return [];
}

const nowOverride: { value: Date } = { value: new Date('2026-04-20T12:00:00Z') };

function makeUpdateChain(table: unknown) {
  const name = tableNameFor(table);
  let pendingSet: Record<string, unknown> = {};
  let pendingId: number | null = null;
  return {
    set(values: Record<string, unknown>) {
      pendingSet = values;
      return this;
    },
    where() {
      if (eqIdSpec.id != null) {
        pendingId = eqIdSpec.id;
        eqIdSpec.id = null;
      }
      return this;
    },
    then(resolve: (v: unknown) => void, reject?: (e: unknown) => void) {
      return runUpdate().then(resolve, reject);
    },
    returning() {
      return runUpdate().then((r) => (r ? [r] : []));
    },
  };

  async function runUpdate() {
    if (!name || !(state[name] instanceof Map) || pendingId == null) return null;
    const tbl = state[name] as Map<number, Record<string, unknown>>;
    const row = tbl.get(pendingId);
    if (!row) return null;
    Object.assign(row, pendingSet);
    return row;
  }
}

function makeInsertChain(table: unknown) {
  const name = tableNameFor(table);
  let pendingValues: Record<string, unknown> | null = null;
  return {
    values(v: Record<string, unknown>) {
      pendingValues = v;
      return this;
    },
    then(resolve: (v: unknown) => void, reject?: (e: unknown) => void) {
      return runInsert().then(resolve, reject);
    },
    returning() {
      return runInsert().then((r) => (r ? [r] : []));
    },
  };

  async function runInsert() {
    if (!name || !pendingValues) return null;
    if (name === 'automationRuns') {
      state.automationRuns.push(pendingValues);
      return pendingValues;
    }
    return pendingValues;
  }
}

vi.mock('@szl-holdings/db', () => ({
  db: {
    select: () => makeSelectChain(),
    update: (table: unknown) => makeUpdateChain(table),
    insert: (table: unknown) => makeInsertChain(table),
  },
  dosArticlesTable: TABLES.articles,
  dosNewslettersTable: TABLES.newsletters,
  dosCarouselProjectsTable: TABLES.carousels,
  dosXPostsTable: TABLES.xposts,
  dosContentCalendarItemsTable: TABLES.calendar,
  dosAutomationRunsTable: TABLES.automationRuns,
}));

vi.mock('drizzle-orm', () => ({
  eq: (_col: unknown, val: unknown) => {
    if (typeof val === 'number') eqIdSpec.id = val;
    return {};
  },
  and: () => ({}),
  or: () => ({}),
  isNull: () => ({}),
  lte: () => ({}),
  sql: () => ({}),
}));

vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const adapterCounters = {
  medium: { ok: 0, fail: 0 },
  substack: { ok: 0, fail: 0 },
  linkedin: { ok: 0, fail: 0 },
  x: { ok: 0, fail: 0 },
};
const adapterFailures: { medium: boolean; substack: boolean; linkedin: boolean; x: boolean } = {
  medium: false,
  substack: false,
  linkedin: false,
  x: false,
};

vi.mock('@szl-holdings/services', () => ({
  MediumAdapter: class {
    async publishArticle() {
      if (adapterFailures.medium) {
        adapterCounters.medium.fail++;
        return { published: false, error: 'medium-down', mock: false };
      }
      adapterCounters.medium.ok++;
      return { published: true, externalUrl: 'https://medium.com/p/abc', mock: false };
    }
  },
  SubstackAdapter: class {
    async publishNewsletter() {
      if (adapterFailures.substack) {
        adapterCounters.substack.fail++;
        return { published: false, error: 'substack-down', mock: false };
      }
      adapterCounters.substack.ok++;
      return { published: true, externalUrl: 'https://szl.substack.com/p/xyz', mock: false };
    }
  },
  LinkedInAdapter: class {
    async sharePost() {
      if (adapterFailures.linkedin) {
        adapterCounters.linkedin.fail++;
        return { posted: false, error: 'linkedin-down', mock: false };
      }
      adapterCounters.linkedin.ok++;
      return { posted: true, externalUrl: 'https://linkedin.com/feed/123', mock: false };
    }
  },
  XTwitterAdapter: class {
    async postTweet() {
      if (adapterFailures.x) {
        adapterCounters.x.fail++;
        return { posted: false, error: 'x-down', mock: false };
      }
      adapterCounters.x.ok++;
      return {
        posted: true,
        externalPostId: 'xid',
        externalPostUrl: 'https://x.com/szl/status/1',
        mock: false,
      };
    }
    async postThread() {
      if (adapterFailures.x) {
        adapterCounters.x.fail++;
        return [{ posted: false, error: 'x-down', mock: false }];
      }
      adapterCounters.x.ok++;
      return [
        {
          posted: true,
          externalPostId: 'xid',
          externalPostUrl: 'https://x.com/szl/status/1',
          mock: false,
        },
      ];
    }
  },
}));

describe('runLaunchPublishScheduler', () => {
  beforeEach(async () => {
    resetState();
    adapterCounters.medium = { ok: 0, fail: 0 };
    adapterCounters.substack = { ok: 0, fail: 0 };
    adapterCounters.linkedin = { ok: 0, fail: 0 };
    adapterCounters.x = { ok: 0, fail: 0 };
    adapterFailures.medium =
      adapterFailures.substack =
      adapterFailures.linkedin =
      adapterFailures.x =
        false;
    nowOverride.value = new Date('2026-04-20T12:00:00Z');
    const mod = await import('../jobs/launch-publish-scheduler');
    mod._resetLaunchPublishBackoff();
  });

  it('publishes a due article to Medium when its publishTargetDate has passed', async () => {
    state.articles.set(101, {
      id: 101,
      title: 'Operator-lens piece',
      bodyMarkdown: '# Hello world',
      tags: [],
      status: 'approved',
      mediumStatus: 'ready',
      substackStatus: 'none',
      publishTargetDate: new Date('2026-04-20T11:55:00Z'),
      externalUrlMedium: null,
    });

    const { runLaunchPublishScheduler } = await import('../jobs/launch-publish-scheduler');
    const result = await runLaunchPublishScheduler({ now: nowOverride.value });

    expect(result.published).toBe(1);
    expect(result.failed).toBe(0);
    expect(adapterCounters.medium.ok).toBe(1);
    const row = state.articles.get(101)!;
    expect(row.status).toBe('published');
    expect(row.mediumStatus).toBe('published');
    expect(row.externalUrlMedium).toBe('https://medium.com/p/abc');
    expect(state.automationRuns.length).toBe(1);
    expect(state.automationRuns[0]?.itemsCreated as number).toBe(1);
  });

  it('dispatches calendar items to the right channel and flips the calendar row to published', async () => {
    state.newsletters.set(7, {
      id: 7,
      title: 'Weekly briefing',
      mainStoryMarkdown: '## body',
      substackStatus: 'ready',
      substackUrl: null,
      status: 'approved',
    });
    state.calendar.set(900, {
      id: 900,
      title: 'Newsletter slot',
      contentType: 'newsletter',
      contentId: 7,
      status: 'ready',
      scheduledDate: new Date('2026-04-20T10:00:00Z'),
    });

    const { runLaunchPublishScheduler } = await import('../jobs/launch-publish-scheduler');
    const result = await runLaunchPublishScheduler({ now: nowOverride.value });

    expect(result.published).toBe(1);
    expect(adapterCounters.substack.ok).toBe(1);
    expect(state.newsletters.get(7)?.substackUrl).toBe('https://szl.substack.com/p/xyz');
    expect(state.calendar.get(900)?.status).toBe('published');
    expect(state.calendar.get(900)?.destinationUrl).toBe('https://szl.substack.com/p/xyz');
  });

  it('records failures, leaves the source row in its original status, and backs off the next sweep', async () => {
    adapterFailures.medium = true;
    state.articles.set(202, {
      id: 202,
      title: 'Will fail',
      bodyMarkdown: 'body',
      tags: [],
      status: 'approved',
      mediumStatus: 'ready',
      publishTargetDate: new Date('2026-04-20T11:00:00Z'),
      externalUrlMedium: null,
    });

    const { runLaunchPublishScheduler } = await import('../jobs/launch-publish-scheduler');
    const r1 = await runLaunchPublishScheduler({ now: nowOverride.value });
    expect(r1.failed).toBe(1);
    expect(r1.published).toBe(0);
    expect(state.articles.get(202)?.status).toBe('approved'); // unchanged
    expect(state.articles.get(202)?.mediumStatus).toBe('ready'); // unchanged
    expect(adapterCounters.medium.fail).toBe(1);

    // Second sweep 10 seconds later: backoff should suppress a second
    // publish attempt entirely.
    nowOverride.value = new Date(nowOverride.value.getTime() + 10_000);
    const r2 = await runLaunchPublishScheduler({ now: nowOverride.value });
    expect(r2.backedOff).toBe(1);
    expect(adapterCounters.medium.fail).toBe(1); // still 1, not 2
  });

  it('skips rows that have already been published', async () => {
    state.articles.set(303, {
      id: 303,
      title: 'Done',
      bodyMarkdown: 'body',
      tags: [],
      status: 'approved',
      mediumStatus: 'ready',
      publishTargetDate: new Date('2026-04-20T10:00:00Z'),
      externalUrlMedium: 'https://medium.com/p/already',
    });
    const { runLaunchPublishScheduler } = await import('../jobs/launch-publish-scheduler');
    const result = await runLaunchPublishScheduler({ now: nowOverride.value });
    expect(result.scanned).toBe(0);
    expect(adapterCounters.medium.ok).toBe(0);
  });

  it('does NOT publish a calendar slot whose status is planned or in-progress', async () => {
    state.articles.set(401, {
      id: 401,
      title: 'Approved article without explicit publishTargetDate',
      bodyMarkdown: 'body',
      tags: [],
      status: 'approved',
      mediumStatus: 'ready',
      publishTargetDate: null, // never auto-eligible without a schedule
      externalUrlMedium: null,
    });
    state.calendar.set(950, {
      id: 950,
      title: 'Planned slot',
      contentType: 'article',
      contentId: 401,
      status: 'planned',
      scheduledDate: new Date('2026-04-20T08:00:00Z'),
    });
    state.calendar.set(951, {
      id: 951,
      title: 'In progress slot',
      contentType: 'article',
      contentId: 401,
      status: 'in-progress',
      scheduledDate: new Date('2026-04-20T08:00:00Z'),
    });

    const { runLaunchPublishScheduler } = await import('../jobs/launch-publish-scheduler');
    const result = await runLaunchPublishScheduler({ now: nowOverride.value });

    expect(state.calendar.get(950)?.status).toBe('planned');
    expect(state.calendar.get(951)?.status).toBe('in-progress');
    expect(adapterCounters.medium.ok).toBe(0);
    expect(result.scanned).toBe(0);
  });

  it('does NOT auto-publish an approved article that has no scheduled publishTargetDate', async () => {
    state.articles.set(700, {
      id: 700,
      title: 'Approved but unscheduled',
      bodyMarkdown: 'body',
      tags: [],
      status: 'approved',
      mediumStatus: 'ready',
      publishTargetDate: null,
      externalUrlMedium: null,
    });
    const { runLaunchPublishScheduler } = await import('../jobs/launch-publish-scheduler');
    const result = await runLaunchPublishScheduler({ now: nowOverride.value });
    expect(result.scanned).toBe(0);
    expect(adapterCounters.medium.ok).toBe(0);
    expect(state.articles.get(700)?.status).toBe('approved');
  });

  it('does NOT auto-publish an article that is still in-review (only approved)', async () => {
    state.articles.set(610, {
      id: 610,
      title: 'In review article',
      bodyMarkdown: 'body',
      tags: [],
      status: 'in-review',
      mediumStatus: 'ready',
      publishTargetDate: new Date('2026-04-20T11:00:00Z'),
      externalUrlMedium: null,
    });
    state.calendar.set(970, {
      id: 970,
      title: 'Slot for in-review article',
      contentType: 'article',
      contentId: 610,
      status: 'ready',
      scheduledDate: new Date('2026-04-20T11:00:00Z'),
    });
    const { runLaunchPublishScheduler } = await import('../jobs/launch-publish-scheduler');
    const result = await runLaunchPublishScheduler({ now: nowOverride.value });
    expect(adapterCounters.medium.ok).toBe(0);
    expect(state.articles.get(610)?.status).toBe('in-review');
    // The calendar slot must NOT flip to published.
    expect(state.calendar.get(970)?.status).toBe('ready');
    expect(result.published).toBe(0);
  });

  it('does NOT auto-publish a draft article even when a ready calendar slot points at it', async () => {
    state.articles.set(501, {
      id: 501,
      title: 'Draft article',
      bodyMarkdown: 'body',
      tags: [],
      status: 'draft', // <-- not approved
      mediumStatus: 'draft', // <-- not ready
      publishTargetDate: null,
      externalUrlMedium: null,
    });
    state.calendar.set(960, {
      id: 960,
      title: 'Ready slot pointing at draft',
      contentType: 'article',
      contentId: 501,
      status: 'ready',
      scheduledDate: new Date('2026-04-20T08:00:00Z'),
    });

    const { runLaunchPublishScheduler } = await import('../jobs/launch-publish-scheduler');
    const result = await runLaunchPublishScheduler({ now: nowOverride.value });

    expect(adapterCounters.medium.ok).toBe(0); // never sent to Medium
    expect(state.articles.get(501)?.status).toBe('draft'); // unchanged
    expect(state.calendar.get(960)?.status).toBe('ready'); // unchanged
    expect(result.published).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it('does NOT auto-publish a newsletter that is only flagged ready (no calendar slot)', async () => {
    state.newsletters.set(11, {
      id: 11,
      title: 'Direct-scan newsletter',
      mainStoryMarkdown: '## body',
      status: 'approved',
      substackStatus: 'ready',
      substackUrl: null,
    });
    const { runLaunchPublishScheduler } = await import('../jobs/launch-publish-scheduler');
    const result = await runLaunchPublishScheduler({ now: nowOverride.value });
    expect(result.scanned).toBe(0);
    expect(adapterCounters.substack.ok).toBe(0);
    expect(state.newsletters.get(11)?.substackUrl).toBeNull();
  });

  it('dispatches a calendar carousel item to LinkedIn and a calendar x-post to X', async () => {
    state.carousels.set(50, {
      id: 50,
      title: 'Carousel',
      linkedinShortCaption: 'hi',
      status: 'ready',
      ctaUrl: 'https://szl/',
    });
    state.xposts.set(60, {
      id: 60,
      body: 'tweet body',
      postType: 'single',
      status: 'approved',
      scheduledFor: new Date('2026-04-20T11:30:00Z'),
      retryCount: 0,
    });
    state.calendar.set(901, {
      id: 901,
      title: 'Carousel slot',
      contentType: 'carousel',
      contentId: 50,
      status: 'ready',
      scheduledDate: new Date('2026-04-20T11:00:00Z'),
    });
    state.calendar.set(902, {
      id: 902,
      title: 'X-post slot',
      contentType: 'x-post',
      contentId: 60,
      status: 'ready',
      scheduledDate: new Date('2026-04-20T11:30:00Z'),
    });

    const { runLaunchPublishScheduler } = await import('../jobs/launch-publish-scheduler');
    const result = await runLaunchPublishScheduler({ now: nowOverride.value });

    expect(result.published).toBeGreaterThanOrEqual(2);
    expect(adapterCounters.linkedin.ok).toBe(1);
    expect(adapterCounters.x.ok).toBe(1);
    expect(state.carousels.get(50)?.status).toBe('published');
    expect(state.xposts.get(60)?.status).toBe('sent');
    expect(state.calendar.get(901)?.status).toBe('published');
    expect(state.calendar.get(902)?.status).toBe('published');
  });
});
