DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dos_sessions') THEN
    ALTER TABLE "dos_sessions" ADD COLUMN IF NOT EXISTS "app" text;
  END IF;
END $$;
