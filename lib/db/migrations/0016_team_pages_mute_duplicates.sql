-- Task #2468: Let on-call mute repeat pages from the same person within minutes.
--
-- POST /teams/:team/page now collapses duplicate pages (same actor, same
-- recipient, same urgency, within ~5 minutes) instead of creating a fresh
-- in-app notification each time. The audit row is still appended so the
-- recent-pages history stays complete; we just flag it as muted and link
-- back to the original page that absorbed it.

ALTER TABLE "team_pages"
  ADD COLUMN IF NOT EXISTS "muted_as_duplicate" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "team_pages"
  ADD COLUMN IF NOT EXISTS "duplicate_of_page_id" INTEGER;
