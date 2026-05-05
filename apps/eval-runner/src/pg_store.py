"""
PostgreSQL-backed run store for the Governed Evaluation Harness.

Persists signed eval run reports to the eval_harness_runs table (defined in
lib/db/src/schema/ai_evals.ts).  Activated when DATABASE_URL is set; the
main.py falls back to the in-memory RunStore when DATABASE_URL is absent.

Writes use INSERT ... ON CONFLICT DO UPDATE so re-submissions are idempotent.
Reads return the full JSONB report blob, making the store compatible with the
existing RunStore interface.
"""

from __future__ import annotations

import json
import os
import time
from typing import Any

import psycopg2
import psycopg2.extras
import structlog

log = structlog.get_logger(__name__)

# ── Constants ──────────────────────────────────────────────────────────────────

_LIST_LIMIT_MAX = 200

# ── Connection ─────────────────────────────────────────────────────────────────


def _get_conn() -> "psycopg2.connection":
    url = os.environ["DATABASE_URL"]
    return psycopg2.connect(url, cursor_factory=psycopg2.extras.RealDictCursor)


def _ensure_table(conn: "psycopg2.connection") -> None:
    """Create the eval_harness_runs table if it does not already exist.

    This is a fallback for environments where the Drizzle migration has not
    yet been applied.  The TypeScript migration (lib/db) is the canonical
    source of truth for the schema; this DDL must stay in sync with it.
    """
    ddl = """
    CREATE TABLE IF NOT EXISTS eval_harness_runs (
        run_id              VARCHAR(128) PRIMARY KEY,
        suite_id            VARCHAR(100) NOT NULL,
        suite_name          VARCHAR(200) NOT NULL DEFAULT '',
        suite_content_hash  VARCHAR(64)  NOT NULL DEFAULT '',
        model_id            VARCHAR(200) NOT NULL,
        provider            VARCHAR(50)  NOT NULL,
        triggered_by        VARCHAR(100) NOT NULL DEFAULT 'api',
        baseline_run_id     VARCHAR(128),
        seed                INTEGER,
        status              VARCHAR(30)  NOT NULL DEFAULT 'pending',
        error               TEXT,
        total_cases         INTEGER      NOT NULL DEFAULT 0,
        passed_cases        INTEGER      NOT NULL DEFAULT 0,
        failed_cases        INTEGER      NOT NULL DEFAULT 0,
        pass_rate           REAL         NOT NULL DEFAULT 0,
        aggregate_score     REAL         NOT NULL DEFAULT 0,
        categories          JSONB        NOT NULL DEFAULT '{}'::jsonb,
        case_results        JSONB        NOT NULL DEFAULT '[]'::jsonb,
        content_hash        VARCHAR(64)  NOT NULL DEFAULT '',
        signature           VARCHAR(64)  NOT NULL DEFAULT '',
        started_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        completed_at        TIMESTAMPTZ,
        duration_ms         INTEGER      NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS eval_harness_runs_suite_id_idx  ON eval_harness_runs (suite_id);
    CREATE INDEX IF NOT EXISTS eval_harness_runs_model_id_idx  ON eval_harness_runs (model_id);
    CREATE INDEX IF NOT EXISTS eval_harness_runs_status_idx    ON eval_harness_runs (status);
    CREATE INDEX IF NOT EXISTS eval_harness_runs_started_at_idx ON eval_harness_runs (started_at);
    CREATE INDEX IF NOT EXISTS eval_harness_runs_suite_model_idx ON eval_harness_runs (suite_id, model_id);
    """
    with conn.cursor() as cur:
        cur.execute(ddl)
    conn.commit()


# ── Store class ────────────────────────────────────────────────────────────────


class PgRunStore:
    """Durable PostgreSQL-backed store for eval harness run reports."""

    def __init__(self) -> None:
        try:
            conn = _get_conn()
            _ensure_table(conn)
            conn.close()
            log.info("pg_run_store_initialised")
        except Exception as exc:
            log.error("pg_run_store_init_failed", error=str(exc))
            raise

    def store(self, run_id: str, report: dict[str, Any]) -> None:
        """Upsert a run report (pending or completed)."""
        try:
            conn = _get_conn()
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO eval_harness_runs (
                        run_id, suite_id, suite_name, suite_content_hash,
                        model_id, provider, triggered_by, baseline_run_id, seed,
                        status, error,
                        total_cases, passed_cases, failed_cases,
                        pass_rate, aggregate_score,
                        categories, case_results,
                        content_hash, signature,
                        started_at, completed_at, duration_ms
                    ) VALUES (
                        %(run_id)s, %(suite_id)s, %(suite_name)s, %(suite_content_hash)s,
                        %(model_id)s, %(provider)s, %(triggered_by)s, %(baseline_run_id)s, %(seed)s,
                        %(status)s, %(error)s,
                        %(total_cases)s, %(passed_cases)s, %(failed_cases)s,
                        %(pass_rate)s, %(aggregate_score)s,
                        %(categories)s, %(case_results)s,
                        %(content_hash)s, %(signature)s,
                        to_timestamp(%(started_at)s / 1000.0),
                        to_timestamp(%(completed_at)s / 1000.0),
                        %(duration_ms)s
                    )
                    ON CONFLICT (run_id) DO UPDATE SET
                        status          = EXCLUDED.status,
                        error           = EXCLUDED.error,
                        total_cases     = EXCLUDED.total_cases,
                        passed_cases    = EXCLUDED.passed_cases,
                        failed_cases    = EXCLUDED.failed_cases,
                        pass_rate       = EXCLUDED.pass_rate,
                        aggregate_score = EXCLUDED.aggregate_score,
                        categories      = EXCLUDED.categories,
                        case_results    = EXCLUDED.case_results,
                        content_hash    = EXCLUDED.content_hash,
                        signature       = EXCLUDED.signature,
                        completed_at    = EXCLUDED.completed_at,
                        duration_ms     = EXCLUDED.duration_ms
                    """,
                    {
                        "run_id": run_id,
                        "suite_id": report.get("suite_id", ""),
                        "suite_name": report.get("suite_name", ""),
                        "suite_content_hash": report.get("suite_content_hash", ""),
                        "model_id": report.get("model_id", ""),
                        "provider": report.get("provider", ""),
                        "triggered_by": report.get("triggered_by", "api"),
                        "baseline_run_id": report.get("baseline_run_id"),
                        "seed": report.get("seed"),
                        "status": report.get("status", "pending"),
                        "error": report.get("error"),
                        "total_cases": report.get("total_cases", 0),
                        "passed_cases": report.get("passed_cases", 0),
                        "failed_cases": report.get("failed_cases", 0),
                        "pass_rate": float(report.get("pass_rate", 0)),
                        "aggregate_score": float(report.get("aggregate_score", 0)),
                        "categories": json.dumps(report.get("categories", {})),
                        "case_results": json.dumps(report.get("case_results", [])),
                        "content_hash": report.get("content_hash", ""),
                        "signature": report.get("signature", ""),
                        "started_at": report.get("started_at", int(time.time() * 1000)),
                        "completed_at": report.get("completed_at") or int(time.time() * 1000),
                        "duration_ms": report.get("duration_ms", 0),
                    },
                )
            conn.commit()
            conn.close()
            log.info("pg_run_store_upserted", run_id=run_id, status=report.get("status"))
        except Exception as exc:
            log.error("pg_run_store_write_failed", run_id=run_id, error=str(exc))
            raise

    def get(self, run_id: str) -> dict[str, Any] | None:
        """Fetch a single run by ID."""
        try:
            conn = _get_conn()
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT * FROM eval_harness_runs WHERE run_id = %s", (run_id,)
                )
                row = cur.fetchone()
            conn.close()
            if row is None:
                return None
            return _row_to_report(dict(row))
        except Exception as exc:
            log.error("pg_run_store_get_failed", run_id=run_id, error=str(exc))
            return None

    def list(self, limit: int = 50) -> list[dict[str, Any]]:
        """List recent runs ordered by start time descending."""
        limit = min(limit, _LIST_LIMIT_MAX)
        try:
            conn = _get_conn()
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT run_id, suite_id, model_id, provider, status,
                           pass_rate, aggregate_score, total_cases, passed_cases,
                           triggered_by, started_at, completed_at, content_hash
                    FROM eval_harness_runs
                    ORDER BY started_at DESC
                    LIMIT %s
                    """,
                    (limit,),
                )
                rows = cur.fetchall()
            conn.close()
            return [_row_to_summary(dict(r)) for r in rows]
        except Exception as exc:
            log.error("pg_run_store_list_failed", error=str(exc))
            return []


def _row_to_report(row: dict[str, Any]) -> dict[str, Any]:
    """Convert a Postgres row to the runner report dict."""
    return {
        "run_id": row["run_id"],
        "suite_id": row["suite_id"],
        "suite_name": row["suite_name"],
        "suite_content_hash": row["suite_content_hash"],
        "model_id": row["model_id"],
        "provider": row["provider"],
        "triggered_by": row["triggered_by"],
        "baseline_run_id": row["baseline_run_id"],
        "seed": row["seed"],
        "status": row["status"],
        "error": row["error"],
        "total_cases": row["total_cases"],
        "passed_cases": row["passed_cases"],
        "failed_cases": row["failed_cases"],
        "pass_rate": float(row["pass_rate"] or 0),
        "aggregate_score": float(row["aggregate_score"] or 0),
        "categories": row["categories"] or {},
        "case_results": row["case_results"] or [],
        "content_hash": row["content_hash"],
        "signature": row["signature"],
        "started_at": int(row["started_at"].timestamp() * 1000) if row["started_at"] else 0,
        "completed_at": int(row["completed_at"].timestamp() * 1000) if row["completed_at"] else 0,
        "duration_ms": row["duration_ms"],
    }


def _row_to_summary(row: dict[str, Any]) -> dict[str, Any]:
    """Convert a Postgres row to the summary dict used by the list endpoint."""
    return {
        "run_id": row["run_id"],
        "suite_id": row["suite_id"],
        "model_id": row["model_id"],
        "provider": row["provider"],
        "status": row["status"],
        "pass_rate": float(row["pass_rate"] or 0),
        "aggregate_score": float(row["aggregate_score"] or 0),
        "total_cases": row["total_cases"],
        "passed_cases": row["passed_cases"],
        "triggered_by": row["triggered_by"],
        "started_at": int(row["started_at"].timestamp() * 1000) if row["started_at"] else 0,
        "completed_at": int(row["completed_at"].timestamp() * 1000) if row["completed_at"] else 0,
        "content_hash": row["content_hash"],
    }
