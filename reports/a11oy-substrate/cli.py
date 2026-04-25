#!/usr/bin/env python3
"""A11oy Substrate Engine CLI — generates vertical artifact JSON files.

Usage:
    python3 reports/a11oy-substrate/cli.py --all
    python3 reports/a11oy-substrate/cli.py --vertical pulse
    python3 reports/a11oy-substrate/cli.py --vertical vessels --vertical terra
"""

import argparse
import hashlib
import json
import os
import stat
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PAYLOAD_PATH = SCRIPT_DIR / "payload.replit.json"
OUTPUT_DIR = SCRIPT_DIR / "artifacts"
ALLOWED_OUTPUT_PREFIX = str(SCRIPT_DIR / "artifacts")

VERTICAL_SPECS = {
    "pulse": {
        "title": "Pulse",
        "purpose": "Founder Operating Channel",
        "twin_type": "founder_twin",
        "owner": "founder@szl",
        "model": "gpt-5.5-2026-04-23",
        "signals": [
            {"id": "sig_pulse_release_freeze", "kind": "release_freeze", "source": "github",
             "summary": "main branch frozen pending Phase 7 sign-off", "weight": 0.8},
            {"id": "sig_pulse_blocked_owner", "kind": "owner_blocked", "source": "linear",
             "summary": "T-3147 awaiting design review > 36h", "weight": 0.65},
            {"id": "sig_pulse_open_incident", "kind": "incident", "source": "sentry",
             "summary": "elevated 5xx on /api/onboarding (low severity)", "weight": 0.4},
        ],
        "recommendation": {
            "id": "rec_pulse_release_freeze_review",
            "title": "Resolve the release-freeze decision before EOD",
            "next_action": "Hold a 15-minute Phase 7 sign-off review with eng + design owners.",
            "rollback_path": "If sign-off slips, extend the freeze by 24h and re-run Pulse tomorrow.",
            "input_class": "pulse_signals_v1",
            "output_class": "pulse_daily_brief_v1",
            "confidence": 0.62,
        },
        "forecast": {
            "horizon": "today",
            "method": "weighted-baseline-v0",
            "signal_pressure": 1.85,
            "confidence": 0.62,
            "summary": "Founder attention is needed on the release-freeze decision before EOD.",
        },
        "brief": {
            "headline": "Resolve the release-freeze decision before EOD",
            "forecast_summary": "Founder attention is needed on the release-freeze decision before EOD.",
            "top_decision": "Hold a 15-minute Phase 7 sign-off review with eng + design owners.",
            "blocked_owner": "T-3147 awaiting design review > 36h",
            "risk": "elevated 5xx on /api/onboarding (low severity)",
            "evidence_count": 3,
        },
    },
    "finance_fincept": {
        "title": "Finance / Fincept",
        "purpose": "Capital Weather",
        "twin_type": "capital_twin",
        "owner": "cfo@szl",
        "model": "gpt-5.5-2026-04-23",
        "signals": [
            {"id": "sig_fin_runway_watch", "kind": "runway_alert", "source": "quickbooks",
             "summary": "Cash runway drops below 14 months at current burn", "weight": 0.75},
            {"id": "sig_fin_arr_growth", "kind": "revenue_signal", "source": "stripe",
             "summary": "Net-new ARR growth +12% MoM; churn flat at 2.1%", "weight": 0.6},
            {"id": "sig_fin_competitor_pricing", "kind": "market_signal", "source": "market_feed",
             "summary": "Competitor cut enterprise tier pricing 15% this week", "weight": 0.7},
        ],
        "recommendation": {
            "id": "rec_fin_pricing_response",
            "title": "Evaluate pricing response to competitor cut",
            "next_action": "Run a 30-day experiment: offer 10% discount on annual enterprise plans to new pipeline.",
            "rollback_path": "If conversion lift < 5%, revert pricing and invest in feature differentiation.",
            "input_class": "capital_signals_v1",
            "output_class": "capital_weather_v1",
            "confidence": 0.58,
        },
        "forecast": {
            "horizon": "this_quarter",
            "method": "capital-baseline-v0",
            "confidence": 0.58,
            "runway_months": 13.8,
            "burn_trend": "stable",
        },
        "brief": {
            "headline": "Evaluate pricing response to competitor cut",
            "runway_months": 13.8,
            "arr_growth": "+12% MoM",
            "risk": "Competitor cut enterprise pricing 15%",
            "evidence_count": 3,
        },
    },
    "lyte_kora": {
        "title": "Lyte / KORA",
        "purpose": "Decision Debt Ledger",
        "twin_type": "decision_twin",
        "owner": "ops@szl",
        "model": "gpt-5.5-2026-04-23",
        "signals": [
            {"id": "sig_lyte_approval_bottleneck", "kind": "bottleneck", "source": "linear",
             "summary": "5-person approval chain with 2 OOO blocking vendor contract", "weight": 0.85},
            {"id": "sig_lyte_evidence_gap", "kind": "evidence_gap", "source": "governance_db",
             "summary": "Infrastructure migration decision lacks benchmark-backed alternatives", "weight": 0.7},
            {"id": "sig_lyte_decision_age", "kind": "decision_age", "source": "slack",
             "summary": "3 decisions pending > 7 days without owner escalation", "weight": 0.6},
        ],
        "recommendation": {
            "id": "rec_lyte_collapse_approval_chain",
            "title": "Collapse 5-person approval chain to named approvers",
            "next_action": "Identify the 2 OOO approvers, delegate to alternates, and re-submit for approval.",
            "rollback_path": "If delegation fails, escalate to COO for emergency sign-off within 24h.",
            "input_class": "decision_signals_v1",
            "output_class": "decision_debt_report_v1",
            "confidence": 0.60,
        },
        "forecast": {
            "horizon": "this_week",
            "method": "decision-debt-baseline-v0",
            "confidence": 0.60,
            "decision_debt_days": 18,
            "bottleneck_severity": "high",
        },
        "brief": {
            "headline": "Collapse 5-person approval chain to named approvers",
            "decision_debt_days": 18,
            "bottleneck": "5-person approval chain with 2 OOO",
            "evidence_gap": "Infrastructure migration decision lacks benchmarks",
            "evidence_count": 3,
        },
    },
    "terra": {
        "title": "Terra",
        "purpose": "Acquisition Time Machine",
        "twin_type": "property_twin",
        "owner": "acquisitions@szl",
        "model": "gpt-5.5-2026-04-23",
        "signals": [
            {"id": "sig_terra_diligence_gap", "kind": "diligence_gap", "source": "property_db",
             "summary": "Environmental Phase-II report outstanding for parcel TX-4412", "weight": 0.9},
            {"id": "sig_terra_flood_risk", "kind": "environmental_risk", "source": "fema",
             "summary": "FEMA Zone AE designation on southeast boundary; flood insurance required", "weight": 0.75},
            {"id": "sig_terra_capex_drift", "kind": "cost_overrun", "source": "appraisal_feed",
             "summary": "Capex estimate drifted +22% from original bid on renovation scope", "weight": 0.65},
        ],
        "recommendation": {
            "id": "rec_terra_close_diligence_gap",
            "title": "Close diligence gap on parcel TX-4412 before LOI expires",
            "next_action": "Expedite Phase-II environmental report; hold escrow release until clear.",
            "rollback_path": "If Phase-II reveals contamination, renegotiate price or walk.",
            "input_class": "property_signals_v1",
            "output_class": "acquisition_risk_v1",
            "confidence": 0.55,
        },
        "forecast": {
            "horizon": "pre_close",
            "method": "acquisition-risk-baseline-v0",
            "confidence": 0.55,
            "diligence_completeness": 0.72,
            "capex_drift_pct": 22,
        },
        "brief": {
            "headline": "Close diligence gap on parcel TX-4412 before LOI expires",
            "diligence_completeness": "72%",
            "risk": "FEMA Zone AE + Phase-II outstanding",
            "capex_drift": "+22%",
            "evidence_count": 3,
        },
    },
    "vessels": {
        "title": "Vessels",
        "purpose": "Voyage Risk Exchange",
        "twin_type": "fleet_twin",
        "owner": "vessels-ops@szl",
        "model": "gpt-5.5-2026-04-23",
        "signals": [
            {"id": "sig_vessels_eta_drift", "kind": "delay_risk", "source": "ais",
             "summary": "ETA drift +18h on charter VL-7714 since last port call", "weight": 0.8},
            {"id": "sig_vessels_route_advisory", "kind": "route_risk", "source": "weather",
             "summary": "Beaufort 8 advisory active on planned routing window", "weight": 0.7},
            {"id": "sig_vessels_compliance_check", "kind": "compliance_gap", "source": "compliance",
             "summary": "Sanctions screening not refreshed in last 14 days for counterparty", "weight": 0.85},
        ],
        "recommendation": {
            "id": "rec_vessels_refresh_sanctions_screen",
            "title": "Refresh sanctions screening for counterparty before bunkering",
            "next_action": "Re-run sanctions screen and document refresh in voyage flight recorder.",
            "rollback_path": "If counterparty fails refreshed screen, hold bunkering and escalate to compliance.",
            "input_class": "vessels_voyage_signals_v1",
            "output_class": "voyage_risk_recommendation_v1",
            "confidence": 0.60,
        },
        "forecast": {
            "horizon": "next_voyage",
            "method": "voyage-risk-baseline-v0",
            "confidence": 0.60,
            "delay_risk": "elevated",
            "route_risk": "moderate",
            "claims_risk_placeholder": "watch",
        },
        "brief": {
            "headline": "Refresh sanctions screening for counterparty before bunkering",
            "delay_risk": "elevated",
            "route_risk": "moderate",
            "claims_risk_placeholder": "watch",
            "next_action": "Re-run sanctions screen and document refresh in voyage flight recorder.",
            "evidence_count": 3,
        },
    },
    "prism_counsel": {
        "title": "PRISM Counsel",
        "purpose": "Matter Flight Recorder",
        "twin_type": "matter_twin",
        "owner": "gc@szl",
        "model": "gpt-5.5-2026-04-23",
        "signals": [
            {"id": "sig_counsel_deadline_risk", "kind": "deadline_risk", "source": "docket",
             "summary": "Response brief due in 72h; first draft at 40% completion", "weight": 0.9},
            {"id": "sig_counsel_contract_gap", "kind": "obligation_gap", "source": "contracts",
             "summary": "Vendor MSA redline missing indemnification clause (Section 8.2)", "weight": 0.8},
            {"id": "sig_counsel_regulatory_watch", "kind": "regulatory_change", "source": "regulatory",
             "summary": "Proposed SEC rule change may affect quarterly disclosure timing", "weight": 0.5},
        ],
        "recommendation": {
            "id": "rec_counsel_lock_response_brief",
            "title": "Lock response brief draft and escalate review",
            "next_action": "Assign senior associate to complete draft by EOD+1; schedule partner review.",
            "rollback_path": "If draft is not reviewable by EOD+1, request 7-day extension from court.",
            "input_class": "matter_signals_v1",
            "output_class": "matter_risk_v1",
            "confidence": 0.65,
        },
        "forecast": {
            "horizon": "72h",
            "method": "matter-risk-baseline-v0",
            "confidence": 0.65,
            "deadline_pressure": "critical",
            "obligation_coverage": 0.78,
        },
        "brief": {
            "headline": "Lock response brief draft and escalate review",
            "deadline_pressure": "critical",
            "obligation_coverage": "78%",
            "regulatory_watch": "SEC disclosure rule change pending",
            "evidence_count": 3,
        },
    },
    "marketing_growth": {
        "title": "Marketing / Growth",
        "purpose": "Proof-To-Pipeline Engine",
        "twin_type": "pipeline_twin",
        "owner": "growth@szl",
        "model": "gpt-5.5-2026-04-23",
        "signals": [
            {"id": "sig_growth_proof_point", "kind": "proof_point", "source": "hubspot",
             "summary": "Vessels customer cut review time 41%; usable as case study", "weight": 0.8},
            {"id": "sig_growth_channel_gap", "kind": "channel_performance", "source": "analytics",
             "summary": "Organic (founder LinkedIn) drives 3x demo bookings vs paid", "weight": 0.65},
            {"id": "sig_growth_pipeline_velocity", "kind": "pipeline_signal", "source": "hubspot",
             "summary": "Pipeline velocity slowed 18% MoM; top-of-funnel needs refresh", "weight": 0.7},
        ],
        "recommendation": {
            "id": "rec_growth_proof_to_pipeline",
            "title": "Convert Vessels proof point into pipeline fuel",
            "next_action": "Draft case study from Vessels 41% metric; schedule founder LinkedIn post for Monday.",
            "rollback_path": "If case study approval stalls, use anonymized version with permission.",
            "input_class": "pipeline_signals_v1",
            "output_class": "pipeline_brief_v1",
            "confidence": 0.55,
        },
        "forecast": {
            "horizon": "this_month",
            "method": "pipeline-baseline-v0",
            "confidence": 0.55,
            "pipeline_velocity_trend": "declining",
            "best_channel": "organic_linkedin",
        },
        "brief": {
            "headline": "Convert Vessels proof point into pipeline fuel",
            "pipeline_velocity": "-18% MoM",
            "best_channel": "organic (founder LinkedIn)",
            "proof_point": "Vessels customer cut review time 41%",
            "evidence_count": 3,
        },
    },
}


def redact_absolute_paths(obj, base_dir: str):
    if isinstance(obj, str):
        return obj.replace(base_dir, "<redacted>")
    if isinstance(obj, dict):
        return {k: redact_absolute_paths(v, base_dir) for k, v in obj.items()}
    if isinstance(obj, list):
        return [redact_absolute_paths(v, base_dir) for v in obj]
    return obj


def build_evidence(signals: list, vertical_id: str) -> list:
    evidence = []
    for sig in signals:
        evidence.append({
            "id": f"ev_{vertical_id}_{sig['id']}",
            "from_signal": sig["id"],
            "claim": sig["summary"],
            "source": sig["source"],
        })
    return evidence


def build_artifact(vertical_id: str) -> dict:
    spec = VERTICAL_SPECS[vertical_id]
    now = datetime.now(timezone.utc).isoformat()
    evidence = build_evidence(spec["signals"], vertical_id)

    rec = {
        **spec["recommendation"],
        "vertical": vertical_id,
        "owner": spec["owner"],
        "model": spec["model"],
        "requires_human_approval": True,
        "evidence_ids": [e["id"] for e in evidence],
    }

    return {
        "vertical": vertical_id,
        "generated_at": now,
        "brief": spec["brief"],
        "signals": spec["signals"],
        "evidence": evidence,
        "forecast": spec["forecast"],
        "recommendation": rec,
    }


def atomic_write(path: Path, data: bytes, mode: int = 0o600):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp")
    try:
        os.write(fd, data)
        os.fchmod(fd, mode)
        os.close(fd)
        os.rename(tmp, str(path))
    except Exception:
        os.close(fd)
        os.unlink(tmp)
        raise


def enforce_output_boundary(path: Path):
    resolved = path.resolve()
    allowed = Path(ALLOWED_OUTPUT_PREFIX).resolve()
    if not resolved.is_relative_to(allowed):
        raise SecurityError(f"Output path {resolved} escapes allowed boundary {allowed}")


class SecurityError(Exception):
    pass


def generate_vertical(vertical_id: str) -> Path:
    artifact = build_artifact(vertical_id)
    out_path = OUTPUT_DIR / f"{vertical_id}.json"
    enforce_output_boundary(out_path)

    content = json.dumps(artifact, indent=2, sort_keys=False).encode("utf-8")
    atomic_write(out_path, content, mode=0o600)
    return out_path


def generate_manifest(generated_files: dict) -> Path:
    now = datetime.now(timezone.utc).isoformat()
    workspace_root = str(Path(__file__).resolve().parent.parent.parent)

    verticals = []
    for vid, fpath in sorted(generated_files.items()):
        spec = VERTICAL_SPECS[vid]
        content = fpath.read_bytes()
        verticals.append({
            "id": vid,
            "title": spec["title"],
            "purpose": spec["purpose"],
            "artifact_path": str(fpath.relative_to(Path.cwd())) if fpath.is_relative_to(Path.cwd()) else str(fpath),
            "confidence": spec["recommendation"]["confidence"],
            "recommendation_id": spec["recommendation"]["id"],
            "requires_human_approval": True,
            "sha256": hashlib.sha256(content).hexdigest(),
        })

    manifest = {
        "generated_at": now,
        "engine": "a11oy-substrate",
        "schema_version": "1.0.0",
        "artifact_count": len(verticals),
        "verticals": verticals,
    }

    manifest = redact_absolute_paths(manifest, workspace_root)

    out_path = OUTPUT_DIR / "manifest.json"
    enforce_output_boundary(out_path)
    content = json.dumps(manifest, indent=2, sort_keys=False).encode("utf-8")
    atomic_write(out_path, content, mode=0o600)
    return out_path


def main():
    parser = argparse.ArgumentParser(description="A11oy Substrate Engine — vertical artifact generator")
    parser.add_argument("--all", action="store_true", help="Generate all 7 vertical artifacts")
    parser.add_argument("--vertical", action="append", dest="verticals",
                        help="Generate specific vertical(s) by ID")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be generated without writing")
    args = parser.parse_args()

    if not args.all and not args.verticals:
        parser.error("Specify --all or --vertical <id>")

    target_ids = list(VERTICAL_SPECS.keys()) if args.all else args.verticals
    unknown = [v for v in target_ids if v not in VERTICAL_SPECS]
    if unknown:
        parser.error(f"Unknown vertical(s): {', '.join(unknown)}. "
                     f"Valid: {', '.join(VERTICAL_SPECS.keys())}")

    if args.dry_run:
        print(f"Would generate {len(target_ids)} artifact(s):")
        for vid in target_ids:
            print(f"  - {vid} -> {OUTPUT_DIR / f'{vid}.json'}")
        print(f"  + manifest.json -> {OUTPUT_DIR / 'manifest.json'}")
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    generated = {}
    for vid in target_ids:
        path = generate_vertical(vid)
        generated[vid] = path
        print(f"  [OK] {vid} -> {path}")

    manifest_path = generate_manifest(generated)
    print(f"  [OK] manifest -> {manifest_path}")
    print(f"\n  {len(generated)} artifact(s) + manifest generated in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
