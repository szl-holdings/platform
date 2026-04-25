-- 0110: Backfill last_digest_sent_at from digest_emails_sent history
-- Existing users have last_digest_sent_at = NULL after migration 0105.
-- Without this backfill, every user would be eligible for an immediate
-- digest on the first job run — even those who already received one today.
-- This one-time UPDATE joins through the users table to match
-- notification_preferences rows with their most recent digest_emails_sent
-- record by email address.

UPDATE notification_preferences np
SET    last_digest_sent_at = sub.max_sent_at
FROM (
  SELECT u.id AS user_id, MAX(des.sent_at) AS max_sent_at
  FROM   users u
  JOIN   digest_emails_sent des ON des.recipient = u.email
  GROUP  BY u.id
) sub
WHERE  np.user_id = sub.user_id
  AND  np.last_digest_sent_at IS NULL;
