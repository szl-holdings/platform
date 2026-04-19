/**
 * Launch Publish Scheduler
 *
 * Scans Distribution OS tables for content whose publish time has arrived
 * but whose status is still in a pre-publish state (ready / approved /
 * queued / scheduled), and triggers the corresponding publish path.
 *
 * Tables scanned:
 *   - dos_articles               -> Medium      (publishTargetDate / mediumStatus)
 *   - dos_newsletters            -> Substack    (via dos_content_calendar_items)
 *   - dos_carousel_projects      -> LinkedIn    (via dos_content_calendar_items)
 *   - dos_x_posts                -> X/Twitter   (scheduledFor)
 *   - dos_content_calendar_items -> dispatcher when contentId is set
 *
 * Failures are caught per-item, the error is recorded, and a per-item
 * exponential backoff is honoured so the next sweep doesn't immediately
 * re-fire a failing publish. The whole sweep is also itself idempotent —
 * once a row reaches `published` / `sent` it is skipped.
 *
 * The sweep is invoked by the durable scheduler (cron every 5 minutes) via the
 * LAUNCH_PUBLISH_SCAN named job in scheduled-jobs.ts.
 */

import { and, eq, isNull, lte, or, sql } from "drizzle-orm";
import {
  db,
  dosArticlesTable,
  dosAutomationRunsTable,
  dosCarouselProjectsTable,
  dosContentCalendarItemsTable,
  dosNewslettersTable,
  dosXPostsTable,
} from "@szl-holdings/db";
import { logger } from "../lib/logger";

export interface PublishHelperResult {
  ok: boolean;
  externalUrl?: string | null;
  mock?: boolean;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

// ─── Per-item publish helpers ────────────────────────────────────────────────
// These are exported so the route handlers in publishing.ts can share the
// same implementation.

export async function publishArticleToMedium(
  articleId: number,
  publishStatus: "public" | "draft" | "unlisted" = "public",
  opts: { enforceReady?: boolean } = {},
): Promise<PublishHelperResult> {
  const [article] = await db.select().from(dosArticlesTable).where(eq(dosArticlesTable.id, articleId));
  if (!article) return { ok: false, error: "Article not found" };
  if (article.externalUrlMedium) {
    return { ok: true, externalUrl: article.externalUrlMedium, skipped: true, reason: "already-published" };
  }
  // Source-readiness guard: never auto-publish a draft / unapproved article,
  // even if a calendar slot says it's "ready". Manual operator route can
  // bypass by leaving enforceReady=false (default).
  if (opts.enforceReady) {
    const status = article.status as string;
    // Only "approved" articles auto-publish. "in-review" / "draft" /
    // "needs-edits" must remain operator-driven.
    if (status !== "approved") {
      return { ok: false, skipped: true, reason: `article-not-approved (status=${status})` };
    }
    if (article.mediumStatus !== "ready") {
      return { ok: false, skipped: true, reason: `medium-not-ready (mediumStatus=${article.mediumStatus})` };
    }
  }
  const content = article.bodyMarkdown || article.bodyHtml || "";
  if (!content) return { ok: false, error: "Article has no body content" };

  const { MediumAdapter } = await import("@szl-holdings/services");
  const adapter = new MediumAdapter();
  const result = await adapter.publishArticle({
    title: article.title,
    content,
    contentFormat: article.bodyMarkdown ? "markdown" : "html",
    tags: (article.tags as string[]) || [],
    publishStatus,
  });
  if (!result.published) return { ok: false, error: result.error, mock: result.mock };

  await db.update(dosArticlesTable).set({
    status: "published",
    mediumStatus: "published",
    externalUrlMedium: result.externalUrl || null,
    publishedMediumAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(dosArticlesTable.id, article.id));
  return { ok: true, externalUrl: result.externalUrl ?? null, mock: result.mock };
}

export async function publishNewsletterToSubstack(
  newsletterId: number,
  opts: { enforceReady?: boolean } = {},
): Promise<PublishHelperResult> {
  const [nl] = await db.select().from(dosNewslettersTable).where(eq(dosNewslettersTable.id, newsletterId));
  if (!nl) return { ok: false, error: "Newsletter not found" };
  if (nl.substackUrl) {
    return { ok: true, externalUrl: nl.substackUrl, skipped: true, reason: "already-published" };
  }
  if (opts.enforceReady) {
    const status = nl.status as string;
    // Only "approved" newsletters auto-publish.
    if (status !== "approved") {
      return { ok: false, skipped: true, reason: `newsletter-not-approved (status=${status})` };
    }
    if (nl.substackStatus !== "ready") {
      return { ok: false, skipped: true, reason: `substack-not-ready (substackStatus=${nl.substackStatus})` };
    }
  }
  const body = nl.mainStoryMarkdown || nl.mainStoryHtml || "";
  if (!body) return { ok: false, error: "Newsletter has no body content" };

  const { SubstackAdapter } = await import("@szl-holdings/services");
  const adapter = new SubstackAdapter();
  const result = await adapter.publishNewsletter({
    title: nl.title,
    subtitle: nl.subtitle || undefined,
    body,
    bodyFormat: nl.mainStoryMarkdown ? "markdown" : "html",
  });
  if (!result.published) return { ok: false, error: result.error, mock: result.mock };

  await db.update(dosNewslettersTable).set({
    status: "published",
    substackStatus: "published",
    substackUrl: result.externalUrl || null,
    publishedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(dosNewslettersTable.id, nl.id));
  return { ok: true, externalUrl: result.externalUrl ?? null, mock: result.mock };
}

export async function publishCarouselToLinkedIn(
  carouselId: number,
  opts: { enforceReady?: boolean } = {},
): Promise<PublishHelperResult> {
  const [carousel] = await db.select().from(dosCarouselProjectsTable).where(eq(dosCarouselProjectsTable.id, carouselId));
  if (!carousel) return { ok: false, error: "Carousel not found" };
  if (carousel.status === "published") {
    return { ok: true, skipped: true, reason: "already-published" };
  }
  if (opts.enforceReady) {
    const status = carousel.status as string;
    if (status !== "ready" && status !== "exported") {
      return { ok: false, skipped: true, reason: `carousel-not-ready (status=${status})` };
    }
  }

  const { LinkedInAdapter } = await import("@szl-holdings/services");
  const adapter = new LinkedInAdapter();
  const caption = carousel.linkedinShortCaption || carousel.linkedinLongCaption || `${carousel.title} — by SZL Holdings`;
  const result = await adapter.sharePost({
    text: caption,
    articleUrl: carousel.ctaUrl || undefined,
    articleTitle: carousel.title,
  });
  if (!result.posted) return { ok: false, error: result.error, mock: result.mock };

  await db.update(dosCarouselProjectsTable).set({
    status: "published",
    updatedAt: new Date(),
  }).where(eq(dosCarouselProjectsTable.id, carousel.id));
  return { ok: true, externalUrl: result.externalUrl ?? null, mock: result.mock };
}

export async function publishXPost(
  xPostId: number,
  opts: { enforceReady?: boolean } = {},
): Promise<PublishHelperResult> {
  const [post] = await db.select().from(dosXPostsTable).where(eq(dosXPostsTable.id, xPostId));
  if (!post) return { ok: false, error: "X post not found" };
  if (post.status === "sent") {
    return { ok: true, externalUrl: post.externalPostUrl, skipped: true, reason: "already-sent" };
  }
  if (opts.enforceReady) {
    const status = post.status as string;
    const allowed = ["approved-for-auto-send", "queued", "scheduled", "approved"];
    if (!allowed.includes(status)) {
      return { ok: false, skipped: true, reason: `x-post-not-ready (status=${status})` };
    }
  }

  const { XTwitterAdapter } = await import("@szl-holdings/services");
  const adapter = new XTwitterAdapter();

  if (post.postType === "thread" && post.threadJson) {
    const tweets = post.threadJson as unknown as string[];
    const results = await adapter.postThread(tweets);
    const first = results[0];
    if (!first?.posted) {
      // Bump the retry counter and record the error message but keep the
      // post in its current pre-publish status (approved / queued /
      // scheduled) so the next scheduler sweep can retry it under the
      // backoff window. We only flip to "failed" once the in-memory
      // backoff hits MAX_PERMANENT_FAIL_ATTEMPTS (handled by the
      // scheduler dispatcher).
      await db.update(dosXPostsTable).set({
        errorMessage: first?.error || "Unknown error",
        retryCount: (post.retryCount || 0) + 1,
        updatedAt: new Date(),
      }).where(eq(dosXPostsTable.id, post.id));
      return { ok: false, error: first?.error };
    }
    await db.update(dosXPostsTable).set({
      status: "sent",
      sentAt: new Date(),
      externalPostId: first.externalPostId || null,
      externalPostUrl: first.externalPostUrl || null,
      errorMessage: null,
      updatedAt: new Date(),
    }).where(eq(dosXPostsTable.id, post.id));
    return { ok: true, externalUrl: first.externalPostUrl ?? null, mock: first.mock };
  }

  const result = await adapter.postTweet(post.body);
  if (!result.posted) {
    // See thread-failure path above: bump the retry counter but keep the
    // post in its pre-publish status so the scheduler backoff retries it.
    await db.update(dosXPostsTable).set({
      errorMessage: result.error || "Unknown error",
      retryCount: (post.retryCount || 0) + 1,
      updatedAt: new Date(),
    }).where(eq(dosXPostsTable.id, post.id));
    return { ok: false, error: result.error };
  }
  await db.update(dosXPostsTable).set({
    status: "sent",
    sentAt: new Date(),
    externalPostId: result.externalPostId || null,
    externalPostUrl: result.externalPostUrl || null,
    errorMessage: null,
    updatedAt: new Date(),
  }).where(eq(dosXPostsTable.id, post.id));
  return { ok: true, externalUrl: result.externalPostUrl ?? null, mock: result.mock };
}

// ─── Scheduler core ──────────────────────────────────────────────────────────

interface BackoffEntry {
  attempts: number;
  nextEligibleAt: number;
  lastError?: string;
}

// In-memory backoff so a flapping publish doesn't get hammered every tick.
// Cleared on api-server restart, which is fine — on next tick the row's
// publish status hasn't changed so it will be retried (just without
// remembered backoff). Keyed by `${kind}:${id}`.
const backoffMap = new Map<string, BackoffEntry>();
const BACKOFF_BASE_MS = 60_000; // 1 minute base, doubles each retry
const BACKOFF_CAP_MS = 60 * 60 * 1000; // 1 hour cap
const MAX_PERMANENT_FAIL_ATTEMPTS = 5;

function getBackoffKey(kind: string, id: number): string {
  return `${kind}:${id}`;
}

function isBackedOff(kind: string, id: number, now: number): boolean {
  const entry = backoffMap.get(getBackoffKey(kind, id));
  if (!entry) return false;
  return entry.nextEligibleAt > now;
}

function recordFailure(kind: string, id: number, err: string, now: number): BackoffEntry {
  const key = getBackoffKey(kind, id);
  const existing = backoffMap.get(key);
  const attempts = (existing?.attempts ?? 0) + 1;
  const delay = Math.min(BACKOFF_BASE_MS * Math.pow(2, attempts - 1), BACKOFF_CAP_MS);
  const entry: BackoffEntry = { attempts, nextEligibleAt: now + delay, lastError: err };
  backoffMap.set(key, entry);
  return entry;
}

function recordSuccess(kind: string, id: number): void {
  backoffMap.delete(getBackoffKey(kind, id));
}

export interface PublishCandidate {
  kind: "article-medium" | "newsletter-substack" | "carousel-linkedin" | "x-post";
  id: number;
  source: "article-publish-target" | "newsletter-calendar" | "carousel-calendar" | "x-scheduled-for" | "calendar-item";
  calendarItemId?: number;
  destinationUrl?: string | null;
}

export interface SchedulerResult {
  scanned: number;
  published: number;
  failed: number;
  skipped: number;
  backedOff: number;
  failures: Array<{ kind: string; id: number; error: string; attempts: number }>;
  successes: Array<{ kind: string; id: number; externalUrl?: string | null }>;
  durationMs: number;
}

/**
 * Find publish candidates across the four content types and the calendar.
 */
export async function findDuePublishCandidates(now: Date = new Date()): Promise<PublishCandidate[]> {
  const candidates: PublishCandidate[] = [];

  // 1. Articles whose Medium publish target has arrived. We REQUIRE an
  //    explicit publishTargetDate <= now — articles with no scheduled date
  //    are not auto-published, even if status=approved+ready, because the
  //    operator hasn't yet picked a launch time. Such articles can be
  //    scheduled either by setting publishTargetDate directly or by
  //    pinning them to a calendar slot.
  const dueArticles = await db.select({
    id: dosArticlesTable.id,
  }).from(dosArticlesTable).where(
    and(
      eq(dosArticlesTable.status, "approved"),
      eq(dosArticlesTable.mediumStatus, "ready"),
      isNull(dosArticlesTable.externalUrlMedium),
      lte(dosArticlesTable.publishTargetDate, now),
    ),
  );
  for (const a of dueArticles) {
    candidates.push({ kind: "article-medium", id: a.id, source: "article-publish-target" });
  }

  // Newsletters have no native scheduled-for column. We do NOT directly
  // scan them — auto-publishing on status alone would fire as soon as
  // editorial marks ready, which is not the requested behaviour. The
  // operator schedules a newsletter by adding it to the content calendar
  // with a scheduledDate, and the calendar scan below picks it up.

  // 2. X posts whose scheduledFor has arrived.
  const dueXPosts = await db.select({ id: dosXPostsTable.id }).from(dosXPostsTable).where(
    and(
      or(
        eq(dosXPostsTable.status, "approved-for-auto-send"),
        eq(dosXPostsTable.status, "queued"),
        eq(dosXPostsTable.status, "scheduled"),
        eq(dosXPostsTable.status, "approved"),
      ),
      isNull(dosXPostsTable.sentAt),
      lte(dosXPostsTable.scheduledFor, now),
    ),
  );
  for (const x of dueXPosts) {
    candidates.push({ kind: "x-post", id: x.id, source: "x-scheduled-for" });
  }

  // 3. Calendar items whose scheduledDate has arrived. These dispatch by
  //    contentType -> the matching channel publish.
  // Only "ready" calendar slots are eligible for auto-publish. "planned"
  // and "in-progress" slots represent work that the editorial team has not
  // signed off on yet — auto-publishing them would violate the "ready /
  // approved / queued" gating requirement.
  const dueCalendar = await db.select().from(dosContentCalendarItemsTable).where(
    and(
      eq(dosContentCalendarItemsTable.status, "ready"),
      lte(dosContentCalendarItemsTable.scheduledDate, now),
      sql`${dosContentCalendarItemsTable.contentId} IS NOT NULL`,
    ),
  );
  for (const item of dueCalendar) {
    if (item.contentId == null) continue;
    switch (item.contentType) {
      case "article":
        candidates.push({ kind: "article-medium", id: item.contentId, source: "calendar-item", calendarItemId: item.id });
        break;
      case "newsletter":
        candidates.push({ kind: "newsletter-substack", id: item.contentId, source: "calendar-item", calendarItemId: item.id });
        break;
      case "carousel":
        candidates.push({ kind: "carousel-linkedin", id: item.contentId, source: "calendar-item", calendarItemId: item.id });
        break;
      case "x-post":
        candidates.push({ kind: "x-post", id: item.contentId, source: "calendar-item", calendarItemId: item.id });
        break;
      default:
        // unknown / "other" / "campaign" — ignore in this sweep
        break;
    }
  }

  // De-duplicate (kind, id) so a calendar item that overlaps an
  // article's own schedule doesn't double-fire. Prefer the calendar entry
  // because it carries the calendarItemId we want to mark as published.
  const dedup = new Map<string, PublishCandidate>();
  for (const c of candidates) {
    const key = `${c.kind}:${c.id}`;
    const existing = dedup.get(key);
    if (!existing || (c.calendarItemId && !existing.calendarItemId)) {
      dedup.set(key, c);
    }
  }
  return Array.from(dedup.values());
}

async function publishOne(candidate: PublishCandidate): Promise<PublishHelperResult> {
  // Scheduler-driven publishes always enforce per-row readiness so a
  // calendar slot pointing at a draft / unapproved source can never
  // auto-publish.
  switch (candidate.kind) {
    case "article-medium":
      return publishArticleToMedium(candidate.id, "public", { enforceReady: true });
    case "newsletter-substack":
      return publishNewsletterToSubstack(candidate.id, { enforceReady: true });
    case "carousel-linkedin":
      return publishCarouselToLinkedIn(candidate.id, { enforceReady: true });
    case "x-post":
      return publishXPost(candidate.id, { enforceReady: true });
  }
}

/**
 * Run a single sweep of the launch publish scheduler.
 * Safe to call from a cron job, the API admin tools, or tests.
 */
export async function runLaunchPublishScheduler(opts: { now?: Date } = {}): Promise<SchedulerResult> {
  const start = Date.now();
  const now = opts.now ?? new Date();

  const result: SchedulerResult = {
    scanned: 0,
    published: 0,
    failed: 0,
    skipped: 0,
    backedOff: 0,
    failures: [],
    successes: [],
    durationMs: 0,
  };

  let candidates: PublishCandidate[];
  try {
    candidates = await findDuePublishCandidates(now);
  } catch (err) {
    logger.error({ err }, "[launch-publish-scheduler] failed to scan for due items");
    result.durationMs = Date.now() - start;
    return result;
  }

  result.scanned = candidates.length;
  if (candidates.length === 0) {
    result.durationMs = Date.now() - start;
    return result;
  }

  logger.info({ candidateCount: candidates.length }, "[launch-publish-scheduler] sweep starting");

  for (const candidate of candidates) {
    const nowMs = Date.now();
    if (isBackedOff(candidate.kind, candidate.id, nowMs)) {
      result.backedOff++;
      continue;
    }

    let outcome: PublishHelperResult;
    try {
      outcome = await publishOne(candidate);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const entry = recordFailure(candidate.kind, candidate.id, msg, nowMs);
      result.failed++;
      result.failures.push({ kind: candidate.kind, id: candidate.id, error: msg, attempts: entry.attempts });
      logger.warn({ candidate, err, attempts: entry.attempts }, "[launch-publish-scheduler] publish threw");
      continue;
    }

    if (outcome.skipped) {
      result.skipped++;
      recordSuccess(candidate.kind, candidate.id);
    } else if (outcome.ok) {
      result.published++;
      result.successes.push({ kind: candidate.kind, id: candidate.id, externalUrl: outcome.externalUrl });
      recordSuccess(candidate.kind, candidate.id);
    } else {
      const entry = recordFailure(candidate.kind, candidate.id, outcome.error || "unknown error", nowMs);
      result.failed++;
      result.failures.push({ kind: candidate.kind, id: candidate.id, error: outcome.error || "unknown error", attempts: entry.attempts });
      logger.warn({ candidate, error: outcome.error, attempts: entry.attempts }, "[launch-publish-scheduler] publish failed");
    }

    // If the candidate came from a calendar item, mark it published or
    // surface the failure on the calendar row itself so the dashboard
    // shows the right state.
    if (candidate.calendarItemId != null) {
      try {
        if (outcome.ok) {
          // Only flip the calendar slot to published when the channel
          // actually accepted the post. A skipped-because-not-ready outcome
          // (ok=false + skipped=true) leaves the slot in "ready" so the
          // operator can address the underlying source row.
          await db.update(dosContentCalendarItemsTable).set({
            status: "published",
            destinationUrl: outcome.externalUrl ?? undefined,
            updatedAt: new Date(),
          }).where(eq(dosContentCalendarItemsTable.id, candidate.calendarItemId));
        } else if (!outcome.skipped) {
          const entry = backoffMap.get(getBackoffKey(candidate.kind, candidate.id));
          // Only flip to cancelled after the permanent-fail threshold so a
          // transient outage doesn't mark a real launch as cancelled.
          if (entry && entry.attempts >= MAX_PERMANENT_FAIL_ATTEMPTS) {
            await db.update(dosContentCalendarItemsTable).set({
              status: "cancelled",
              notes: `[scheduler] auto-cancelled after ${entry.attempts} failed attempts: ${outcome.error || "unknown"}`,
              updatedAt: new Date(),
            }).where(eq(dosContentCalendarItemsTable.id, candidate.calendarItemId));
          }
        }
      } catch (err) {
        logger.warn({ err, calendarItemId: candidate.calendarItemId }, "[launch-publish-scheduler] failed to update calendar item");
      }
    }

    // After repeated failures, also flip the source row to its terminal
    // failed status so the operator dashboard shows the dead item and the
    // next scan stops picking it up. (Eligibility filters already exclude
    // terminal statuses.)
    if (!outcome.ok && !outcome.skipped) {
      const entry = backoffMap.get(getBackoffKey(candidate.kind, candidate.id));
      if (entry && entry.attempts >= MAX_PERMANENT_FAIL_ATTEMPTS) {
        try {
          if (candidate.kind === "x-post") {
            await db.update(dosXPostsTable).set({
              status: "failed",
              errorMessage: outcome.error || "exceeded max retry attempts",
              updatedAt: new Date(),
            }).where(eq(dosXPostsTable.id, candidate.id));
          } else if (candidate.kind === "article-medium") {
            // Schema enum for medium_status is ["none","draft","ready","published"];
            // revert to "draft" so the row leaves the auto-publish eligibility
            // window and the operator must re-prepare it.
            await db.update(dosArticlesTable).set({
              mediumStatus: "draft",
              updatedAt: new Date(),
            }).where(eq(dosArticlesTable.id, candidate.id));
          } else if (candidate.kind === "newsletter-substack") {
            await db.update(dosNewslettersTable).set({
              substackStatus: "draft",
              updatedAt: new Date(),
            }).where(eq(dosNewslettersTable.id, candidate.id));
          } else if (candidate.kind === "carousel-linkedin") {
            await db.update(dosCarouselProjectsTable).set({
              status: "draft",
              updatedAt: new Date(),
            }).where(eq(dosCarouselProjectsTable.id, candidate.id));
          }
        } catch (err) {
          logger.warn({ err, candidate }, "[launch-publish-scheduler] failed to flip terminal status");
        }
      }
    }
  }

  result.durationMs = Date.now() - start;

  // Surface the run on the operator dashboard.
  try {
    await db.insert(dosAutomationRunsTable).values({
      jobName: "Launch Publish Scheduler",
      jobType: "x-queue",
      status: result.failed > 0 ? "failed" : "completed",
      startedAt: new Date(start),
      completedAt: new Date(),
      summary: `scanned=${result.scanned} published=${result.published} failed=${result.failed} skipped=${result.skipped} backedOff=${result.backedOff}`,
      output: result as unknown as Record<string, unknown>,
      itemsCreated: result.published,
      itemsFailed: result.failed,
      errorLog: result.failures.length
        ? result.failures.map((f) => `${f.kind}#${f.id} (attempt ${f.attempts}): ${f.error}`).join("\n")
        : null,
    });
  } catch (err) {
    logger.warn({ err }, "[launch-publish-scheduler] failed to record automation run");
  }

  logger.info(
    { ...result, failures: undefined, successes: undefined },
    "[launch-publish-scheduler] sweep complete",
  );

  return result;
}

// Test-only helper.
export function _resetLaunchPublishBackoff(): void {
  backoffMap.clear();
}
