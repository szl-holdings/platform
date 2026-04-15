-- Allow push token registration without a user session (anonymous device tokens
-- for apps that do not require authentication, e.g. public portfolio apps).
ALTER TABLE "push_tokens" ALTER COLUMN "user_id" DROP NOT NULL;
