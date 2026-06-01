ALTER TABLE "carlota_invoices" ADD COLUMN IF NOT EXISTS "sent_to" text;

CREATE TABLE IF NOT EXISTS "carlota_invoice_email_log" (
  "id" serial PRIMARY KEY NOT NULL,
  "invoice_id" text NOT NULL,
  "recipient" text NOT NULL,
  "sent_at" timestamp DEFAULT now() NOT NULL,
  "status" text NOT NULL,
  "error" text,
  "message_id" text
);
