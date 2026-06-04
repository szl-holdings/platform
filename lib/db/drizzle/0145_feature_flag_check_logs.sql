CREATE TABLE IF NOT EXISTS flag_check_logs (
  id          SERIAL PRIMARY KEY,
  flag_key    TEXT    NOT NULL,
  user_id     INTEGER,
  org_id      INTEGER,
  result      BOOLEAN NOT NULL,
  source      TEXT    NOT NULL,
  caller_tag  TEXT,
  checked_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS flag_check_logs_key_idx        ON flag_check_logs (flag_key);
CREATE INDEX IF NOT EXISTS flag_check_logs_org_id_idx     ON flag_check_logs (org_id);
CREATE INDEX IF NOT EXISTS flag_check_logs_checked_at_idx ON flag_check_logs (checked_at DESC);
