#!/usr/bin/env python3
"""ledgers.py — canonical ledger data + Zero-Bandaid enforcement.

Every fact here traces to one of:
  * the four specialist reports (agent_reports/*.md) — ground truth,
  * the ten council rounds in branched_contexts/.../conversation.jsonl.

Anything a report marked UNKNOWN stays None -> renders as the literal
string UNKNOWN in emitted YAML. Nothing here was invented to fill a gap.
"""

from __future__ import annotations

from dataclasses import dataclass, field

TRUTH_STATES = ["VERIFIED", "MEASURED", "UNKNOWN"]


@dataclass
class Claim:
    id: str
    statement: str
    state: str = "UNKNOWN"
    source_command: str | None = None
    evidence_uri: str | None = None
    verified_at: str | None = None
    public_allowed: bool = True
    notes: list[str] = field(default_factory=list)

    def __post_init__(self):
        if self.state not in TRUTH_STATES:
            raise ValueError(f"{self.id}: state {self.state!r} not in {TRUTH_STATES}")
        # Zero-Bandaid Law in code, not prose: a public claim without
        # evidence auto-demotes. Cannot be forgotten by a future contributor.
        if self.public_allowed and not self.evidence_uri:
            self.state = "UNKNOWN"
            self.verified_at = None
            self.notes.append(
                "auto-demoted: public claim without evidence_uri (Zero-Bandaid Law)"
            )

    def as_dict(self) -> dict:
        return {
            "id": self.id,
            "statement": self.statement,
            "state": self.state,
            "source_command": self.source_command,
            "evidence_uri": self.evidence_uri,
            "verified_at": self.verified_at,
            "public_allowed": self.public_allowed,
            "notes": list(self.notes),
        }


# ---------------------------------------------------------------------------
# CLAIMS LEDGER (estate truth). Order = canonical. Grep keys are used by
# tools/release_gate.py to parse rows back out of CLAIMS_LEDGER.yaml.
# ---------------------------------------------------------------------------

CLAIMS: list[Claim] = [
    Claim(
        "C-001",
        "GitHub org is szl-holdings with 93 public repos (59 active, 34 archived); szlholdings (no hyphen) is HTTP 404",
        "VERIFIED", "curl -s -o /dev/null -w %{http_code} https://github.com/szl-holdings",
        "agent_reports/be1_platform.md#1.1", "2026-08-30"),
    Claim(
        "C-002",
        "HF org handle is SZLHOLDINGS (uppercase): 43 models, 28 datasets, 6 Spaces + 1 org-card Space, Team plan, 2 members; author filter is case-sensitive and lowercase returns zero assets",
        "VERIFIED", "curl https://huggingface.co/api/organizations/szlholdings/overview",
        "agent_reports/be2_models_kernels.md#A.1", "2026-08-30"),
    Claim(
        "C-003",
        "a11oy.com is a third-party WordPress furniture store, NOT SZL; real product origin is a-11-oy.com; proof origin is a11oy.net",
        "VERIFIED", "live unauthenticated HTTP probes of all three origins",
        "agent_reports/fe1_surfaces_design.md#A.1", "2026-08-30"),
    Claim(
        "C-004",
        "szl.dev is NXDOMAIN while szl.dev/GovernedAction/v1 is the locked public receipt namespace URI",
        "VERIFIED", "DNS probe 2026-08-30",
        "agent_reports/fe1_surfaces_design.md#A.1", "2026-08-30"),
    Claim(
        "C-005",
        "Codex auto-review verified config surface: approvals_reviewer=\"auto_review\" plus [auto_review] policy markdown block; legacy alias guardian_subagent deprecated",
        "VERIFIED", "learn.chatgpt.com/docs/sandboxing/auto-review; alignment.openai.com/auto-review/",
        "agent_reports/be1_platform.md#2.8", "2026-08-30"),
    Claim(
        "C-006",
        "in-toto-attestation on PyPI is version 0.9.3 (maintainers adityasaky, lukpueh); the maintained path for ITE-6 envelopes; do not hand-roll DSSE",
        "VERIFIED", "curl https://pypi.org/pypi/in-toto-attestation/json",
        "agent_reports/be1_platform.md#2.2", "2026-08-30"),
    Claim(
        "C-007",
        "Rekor v2 is GA (tile-based, yearly shards) and removes the Signed Entry Timestamp; trusted time requires a separate RFC 3161 TSA; Rekor v1 is maintenance mode; szl-lake currently references v1 anchors",
        "VERIFIED", "blog.sigstore.dev/rekor-v2-ga; docs.nvidia.com/aicr/contributor-guide/rekor-v-2-signing",
        "agent_reports/be1_platform.md#2.1", "2026-08-30"),
    Claim(
        "C-008",
        "Cedar is the policy engine pick: cedar-policy v4.5.1 (2025-08-14), CNCF Sandbox Sept 2025, Lean-verified analysis, default-deny forbid-wins; PyPI cedar-policy is only a 0.0.1 stub, integrate via Rust crate/CLI",
        "VERIFIED", "github.com/cedar-policy/cedar; github.com/cncf/sandbox/issues/371",
        "agent_reports/be1_platform.md#2.4", "2026-08-30"),
    Claim(
        "C-009",
        "Flight Recorder durability = SQLite WAL + Litestream; local ACK only after fcntl.flock + fsync; PENDING_SYNC is a visible state; never synthesize a success event",
        "VERIFIED", "litestream.io/how-it-works",
        "agent_reports/be1_platform.md#2.6", "2026-08-30"),
    Claim(
        "C-010",
        "Offline in-browser verifier stack: DSSE envelope, PAE over DECODED payload bytes (never base64 length), WebCrypto Ed25519 primary (FF129+/Safari17+/Chrome137+) with @noble/ed25519 3.2.0 fallback; WASM skipped in v1",
        "VERIFIED", "pkijs.com/sigstore; github.com/in-toto/attestation envelope spec; browser release notes",
        "agent_reports/fe2_demo_experience.md#A.3", "2026-08-30"),
    Claim(
        "C-011",
        "KANCHAY design tokens extracted from shipped CSS: bg #080c14/#0a1019/#0e1626/#1c2942; ink #eef4fb/#aebccf/#65788f; mint #3af4c8 action+VERIFIED only; blue #5b8dee links; gold #d7b96b advisory-only never CTA fill; red #e8746e failure",
        "MEASURED", "CSS extraction from fe1_site_{a11oy_com,a11oy_net,a_11_oy_com}.html",
        "agent_reports/fe1_surfaces_design.md#A.8", "2026-08-30"),
    Claim(
        "C-012",
        "26-vs-5 Space contradiction resolved in public copy: /spaces now shows 6 KEEP (MEASURED) + 38 folded by name; 7th public surface is the org card Space SZLHOLDINGS/README (tier ORG_CARD)",
        "VERIFIED", "a-11-oy.com/spaces + huggingface.co/api/spaces/SZLHOLDINGS/README",
        "agent_reports/fe1_surfaces_design.md#A.4", "2026-08-30"),
    Claim(
        "C-013",
        "killinchu-osint-corpus at 41,122 downloads/30d is the estate's top traction artifact; license is mixed-source-terms (ODbL 1.0 + CC-BY + publisher-reserved) with training_eligible:false; CONSTITUTIONALLY BANNED from any training pipeline",
        "VERIFIED", "huggingface.co/datasets/SZLHOLDINGS/killinchu-osint-corpus",
        "agent_reports/be2_models_kernels.md#A.5 B-1", "2026-08-30"),
    Claim(
        "C-014",
        "HF Spaces constraints: static Spaces free forever no compute; Docker/Gradio on free cpu-basic now require PRO/Team plan; default 50GB Space disk is ephemeral not persistent; Space-to-model backlinks require literal model IDs in README front-matter or .py/.ini/.html files",
        "VERIFIED", "huggingface.co/docs/hub/en/spaces-sdks-static; spaces-overview; spaces-organization-cards",
        "agent_reports/fe2_demo_experience.md#B.1", "2026-08-30"),
    Claim(
        "C-015",
        "Two red flagship CI gates dated 2026-08-30: a11oy 'HF Space module-drift guard' failing; killinchu 'API Health' failing; platform 15/15 green, szl-lake 15/15 green, szl-receipt 15/15 green",
        "VERIFIED", "GitHub Actions API, 15 most recent runs per repo",
        "agent_reports/be1_platform.md#1.4", "2026-08-30"),
    Claim(
        "C-016",
        "Hand-rolled DSSE/ECDSA-P256 present in szl-receipt and governed-receipt-spec; drifts from the locked decision to use in-toto-attestation 0.9.3; migration is the single highest-leverage technical fix",
        "VERIFIED", "repo READMEs read 2026-08-30",
        "agent_reports/be1_platform.md#1.5", "2026-08-30"),
    Claim(
        "C-017",
        "a11oy estate metrics: 43 HF models with 5,652 downloads/30d total; 28 datasets with 53,817 downloads/30d; 100% license coverage across 77 assets; chaski (1,943 dl) publishes gate:fail on its own eval; SZL-Khipu-1.5B restored at 1,102 dl/30d",
        "MEASURED", "HF API per-repo pulls 2026-08-30 (hf_full_details.json)",
        "agent_reports/be2_models_kernels.md#A.2", "2026-08-30"),
    Claim(
        "C-018",
        "a-11-oy.com homepage probes honest: /healthz discloses signer.status=ABSENT signing_available=false; /api/a11oy/v1/ledger is SAMPLE state operational:false; 8 locked Lean formulas F1,F4,F7,F11,F12,F18,F19,F22 against 749 declarations and 163 sorries (doctrine v11 LOCKED, kernel c7c0ba17)",
        "VERIFIED", "live JSON endpoints 2026-08-30",
        "agent_reports/fe1_surfaces_design.md#A.5", "2026-08-30"),
    Claim(
        "C-019",
        "szl-quant-sft-v1 (2,693 rows) derives from CoinGecko daily closes with per-row receipt lineage; upstream redistribution/commercial terms need counsel review before training commercial models",
        "MEASURED", "dataset card review",
        "agent_reports/be2_models_kernels.md#A.5 B-2", "2026-08-30"),
    Claim(
        "C-020",
        "EU AI Act: Annex III high-risk obligations deferred to 2027-12-02 under Reg (EU) 2026/1744; GPAI fining powers active since 2026-08-02; Article 12 = automatic event recording over system lifetime with 6-month retention floor (Art 19/26(6)); never say 'EU AI Act compliant', say 'Article 12 logging conformance profile'",
        "VERIFIED", "artificialintelligenceact.eu/article/12; Reg. (EU) 2026/1744 (council round 5)",
        "agent_reports/be2_models_kernels.md#B.5", "2026-08-30"),
    Claim(
        "C-021",
        "March 2026 LiteLLM supply-chain compromise: backdoored litellm 1.82.7/1.82.8 via poisoned trivy-action tags (TeamPCP); org reusable workflow pins aquasecurity/trivy-action by commit SHA ed142fd0 (v0.36.0) + step-security/harden-runner; any tag-pinned variant is exposed",
        "VERIFIED", "blog.pypi.org 2026-04-02 incident report; snyk.io; .github/workflows/reusable-trivy.yml",
        "agent_reports/be1_platform.md#2.7", "2026-08-30"),
    Claim(
        "C-022",
        "Model program bases verified license-clean: Qwen2.5-1.5B-Instruct, Qwen2.5-0.5B-Instruct, Qwen3.5-0.8B, Qwen3.8-27B all Apache-2.0 non-gated; DeepSeek-V4-Flash MIT; Qwen3-Embedding-0.6B Apache-2.0; torchtune is unmaintained and excluded; house stack Unsloth + TRL + Liger + Axolotl FSDP2",
        "VERIFIED", "live HF API license checks 2026-08-30; github.com/meta-pytorch/torchtune",
        "agent_reports/be2_models_kernels.md#B.1/B.2", "2026-08-30"),
    Claim(
        "C-023",
        "Series A bar (Carta Q1 2026, council round 7): ARR to qualify ~$3.5M; median post-money $75-85M; median raise $13-15M; GM 70%+, NRR >=110% targets; solo founders graduate at 12.9% vs 23.7% (two) and 29.3% (three), but conditional valuations are indistinguishable ($54.9M vs $53.6M)",
        "MEASURED", "council round 7 cited Carta + seed-stage datasets",
        "branched_contexts conversation.jsonl turn 12", "2026-08-13"),
    Claim(
        "C-024",
        "2026 interactive-demo benchmarks: 18% of B2B SaaS sites have interactive demos (+40% YoY); top demos 5-13 steps, 72% start with a modal, 66% ungated, ~5 CTAs in 1-2 steps, 25-30 words per dialog",
        "MEASURED", "Navattic State of the Interactive Product Demo; Guideflow",
        "agent_reports/fe2_demo_experience.md#A.1", "2026-08-30"),
]


# ---------------------------------------------------------------------------
# COMMERCIAL LEDGER — 24 rows. Every value is None -> UNKNOWN by design:
# no model may invent ARR, a co-founder's name, or a design partner.
# Every row blocks the raise. release_gate.py fails on all 24 on first run,
# and that is correct: the exit codes are the Week 1 checklist.
# ---------------------------------------------------------------------------

COMMERCIAL_ROWS: list[tuple[str, str]] = [
    ("CL-01", "ARR (annual recurring revenue, contracted)"),
    ("CL-02", "MRR (monthly recurring revenue)"),
    ("CL-03", "Recognized revenue trailing 12 months"),
    ("CL-04", "Paying customer count"),
    ("CL-05", "Named design partners with signed agreements"),
    ("CL-06", "Design partner to paid conversion rate"),
    ("CL-07", "Gross margin percentage"),
    ("CL-08", "Net revenue retention percentage"),
    ("CL-09", "CAC payback period in months"),
    ("CL-10", "Cash on hand"),
    ("CL-11", "Monthly net burn"),
    ("CL-12", "Runway in months"),
    ("CL-13", "Burn multiple"),
    ("CL-14", "Published price for the Control SKU"),
    ("CL-15", "Published price for the Assurance SKU"),
    ("CL-16", "ICP buyer persona with named title and budget line"),
    ("CL-17", "Co-founder or named owner beyond Stephen Lutar"),
    ("CL-18", "Cap table cleanliness (Delaware C-Corp, single class, no side letters)"),
    ("CL-19", "Contributor IP assignment coverage"),
    ("CL-20", "Model BOM and dataset license register completed and counsel-reviewed"),
    ("CL-21", "SOC 2 status (none / Type I / Type II) with auditor named"),
    ("CL-22", "ISO 42001 Statement of Applicability published"),
    ("CL-23", "Bricklayer IP risk register (IP-001) reviewed by counsel"),
    ("CL-24", "Two paying six-month design partners with public testimonial rights"),
]


def commercial_ledger_rows() -> list[dict]:
    rows = []
    for rid, label in COMMERCIAL_ROWS:
        rows.append({
            "id": rid,
            "metric": label,
            "value": None,            # renders as literal UNKNOWN
            "state": None,            # renders as literal UNKNOWN
            "evidence_uri": None,     # renders as literal UNKNOWN
            "verified_at": None,      # renders as literal UNKNOWN
            "blocks_raise": True,
        })
    return rows
