#!/usr/bin/env python3
"""
A11OY AMI FORMULA PAYLOAD v1.0
One-file Python payload for A11oy.

Formula:
AMI_v2 = (Λ^0.22 · K^0.16 · W^0.16 · T^0.14 · M^0.14 · E^0.10 · P^0.08) · e^(-0.7N - 0.5D) · G

Purpose:
- Treat A11oy as a meshing intelligence layer, not replacement software.
- Score whether A11oy can observe, assist, or act safely inside an existing company stack.
- Convert repo/tool/integration/test evidence into a gate: BLOCK, WATCH, ASSIST, OPERATE, AUTONOMOUS.

Run:
python a11oy_ami_formula_payload.py --root . --task "connect to existing QA workflow" --output ami_report.json
"""
from __future__ import annotations
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Dict, List, Mapping, Optional, Sequence
import argparse, hashlib, json, math, os, re, subprocess, time

PAYLOAD = "A11OY_AMI_FORMULA_PAYLOAD_V1"
VERSION = "1.0.0"

WEIGHTS = {
    "lambda": 0.22,
    "khipu_topology": 0.16,
    "witness_density": 0.16,
    "tool_readiness": 0.14,
    "mesh_compatibility": 0.14,
    "evidence_quality": 0.10,
    "performance_reliability": 0.08,
}

PERMISSION_GATES = {
    "BLOCK": ["observe", "explain", "recommend"],
    "WATCH": ["observe", "draft", "ask_approval"],
    "ASSIST": ["observe", "draft", "run_safe_tests", "ask_approval"],
    "OPERATE": ["observe", "draft", "run_tests", "open_pr", "human_approval_required"],
    "AUTONOMOUS": ["observe", "draft", "run_tests", "open_pr", "low_risk_execute_if_policy_allows"],
}

@dataclass(frozen=True)
class EvidenceKnot:
    id: str
    kind: str
    path: str
    group: str
    witness: int
    tests: int
    integrations: int
    tools: int
    contradictions: int
    performance_hits: int
    confidence: float
    timestamp: float
    digest: str
    hint: str = ""

    def strength(self) -> float:
        witness = min(1.0, math.log1p(self.witness) / math.log(10))
        tests = min(1.0, math.log1p(self.tests) / math.log(10))
        mesh = min(1.0, math.log1p(self.integrations + self.tools) / math.log(10))
        penalty = min(0.75, self.contradictions * 0.10)
        return max(0.0, min(1.0, 0.35*self.confidence + 0.25*witness + 0.20*tests + 0.20*mesh - penalty))

    def signature(self) -> str:
        src = f"{self.kind}|{self.group}|{self.path}|{self.witness}|{self.tests}|{self.integrations}|{self.tools}|{self.contradictions}"
        return bin(int(hashlib.sha256(src.encode()).hexdigest(), 16))[2:18]

def sha(x: str | bytes) -> str:
    if isinstance(x, str):
        x = x.encode("utf-8", errors="ignore")
    return hashlib.sha256(x).hexdigest()

def safe_read(path: Path, limit: int = 1_250_000) -> bytes:
    try:
        data = path.read_bytes()
        return data[:limit]
    except Exception:
        return b""

def clamp(x: float) -> float:
    return max(0.0, min(1.0, float(x)))

def entropy(values: Sequence[str]) -> float:
    if not values:
        return 0.0
    counts: Dict[str, int] = {}
    for v in values:
        counts[v] = counts.get(v, 0) + 1
    n = len(values)
    h = -sum((c/n) * math.log2(c/n) for c in counts.values())
    u = len(counts)
    return 0.0 if u <= 1 else clamp(h / math.log2(u))

def egyptian_fraction(x: float, max_den: int = 144, max_terms: int = 8) -> List[int]:
    from fractions import Fraction
    x = clamp(x)
    if x <= 0:
        return []
    f = Fraction(x).limit_denominator(max_den)
    n, d = f.numerator, f.denominator
    out = []
    while n > 0 and len(out) < max_terms:
        unit = math.ceil(d/n)
        out.append(unit)
        n = n*unit - d
        d = d*unit
    return out

def lutar_lambda(cleanliness: float, horizon: float, resonance: float, reconciliation: float) -> float:
    return round(clamp(cleanliness) * clamp(horizon) * clamp(resonance) * clamp(reconciliation), 8)

def ami_formula(lambda_: float, K: float, W: float, T: float, M: float, E: float, P: float, N: float, D: float, G: float) -> float:
    variables = {
        "lambda": clamp(lambda_),
        "khipu_topology": clamp(K),
        "witness_density": clamp(W),
        "tool_readiness": clamp(T),
        "mesh_compatibility": clamp(M),
        "evidence_quality": clamp(E),
        "performance_reliability": clamp(P),
    }
    product = 1.0
    for key, weight in WEIGHTS.items():
        product *= max(1e-9, variables[key]) ** weight
    return round(product * math.exp(-0.7*clamp(N) - 0.5*clamp(D)) * clamp(G), 8)

def ouroboros_renew(state: Mapping[str, float]) -> Dict[str, float]:
    c, h, r, f = [clamp(state.get(k, 0.5)) for k in ["cleanliness", "horizon", "resonance", "reconciliation"]]
    n = clamp(state.get("noise", 0.1))
    w = clamp(state.get("witness", 0.5))
    correction = 0.17 * w * r * f
    return {
        "cleanliness": round(clamp(c + correction - 0.03*n), 6),
        "horizon": round(clamp(h + 0.55*correction), 6),
        "resonance": round(clamp(r + 0.40*correction - 0.015*n), 6),
        "reconciliation": round(clamp(f + 0.50*correction), 6),
        "noise": round(clamp(n*0.86 - 0.10*correction), 6),
        "witness": round(w, 6),
    }

class A11oyAMI:
    def __init__(self, root: str = ".", task: str = "", memory_file: Optional[str] = None):
        self.root = Path(root).resolve()
        self.task = task or ""
        self.memory_file = Path(memory_file).resolve() if memory_file else None
        self.task_terms = set(re.findall(r"[a-zA-Z0-9_]{3,}", self.task.lower()))

    def run(self) -> Dict[str, Any]:
        knots = self.scan_all()
        score = self.score(knots)
        return {
            "payload": PAYLOAD,
            "version": VERSION,
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "root": str(self.root),
            "task": self.task,
            "score": score,
            "knots_preview": [asdict(k) for k in knots[:40]],
            "manifest_hash": sha(json.dumps([asdict(k) for k in knots], sort_keys=True)) if knots else "",
        }

    def scan_all(self) -> List[EvidenceKnot]:
        knots = []
        knots.extend(self.scan_files())
        knots.extend(self.scan_git())
        knots.extend(self.scan_memory())
        if self.task:
            knots.append(EvidenceKnot(sha(self.task)[:12], "task", "current_task", "intent", 2, 0, 1, 1, 0, 0, 0.88, time.time(), sha(self.task), self.task[:140]))
        return knots

    def scan_files(self) -> List[EvidenceKnot]:
        if not self.root.exists():
            return []
        ignore = {".git", "node_modules", "__pycache__", ".pytest_cache", "dist", "build", ".next", ".venv", "venv"}
        out = []
        for path in list(self.root.rglob("*"))[:4000]:
            if not path.is_file() or any(part in ignore for part in path.parts):
                continue
            rel = str(path.relative_to(self.root))
            raw = safe_read(path)
            text = raw.decode("utf-8", errors="ignore")
            kind = self.kind(rel, text)
            out.append(EvidenceKnot(
                id=sha(rel)[:12], kind=kind, path=rel,
                group=rel.split("/")[0] if "/" in rel else "root",
                witness=self.count_terms(text, ["source", "cite", "citation", "evidence", "verified", "hash", "owner", "approval", "audit"]) + (1 if kind in {"docs", "test", "ci", "manifest"} else 0),
                tests=self.count_terms(text, ["assert", "expect(", "test(", "it(", "pytest", "vitest", "npm test", "build"]),
                integrations=self.count_terms(text, ["api", "webhook", "connector", "integration", "postgres", "neon", "replit", "pm2", "github", "slack", "jira", "salesforce", "erp", "crm"]),
                tools=self.count_terms(text, ["tool", "function", "system_inspect", "repo_search", "file_read", "http_probe", "pm2_status", "openai", "route"]),
                contradictions=self.count_terms(text, ["todo", "fixme", "stub", "broken", "failing", "not implemented", "temporary", "hack", "error"]),
                performance_hits=self.count_terms(text, ["latency", "cache", "timeout", "retry", "queue", "rate", "performance", "benchmark", "health"]),
                confidence=self.confidence(kind, text, raw),
                timestamp=path.stat().st_mtime,
                digest=sha(raw),
                hint=text[:140].replace("\n", " ")
            ))
        return out

    def scan_git(self) -> List[EvidenceKnot]:
        if not (self.root / ".git").exists():
            return []
        try:
            log = subprocess.check_output(["git", "log", "--pretty=format:%H|%ct|%s", "-n", "200"], cwd=self.root, text=True, stderr=subprocess.DEVNULL, timeout=8)
        except Exception:
            return []
        out = []
        for line in log.splitlines():
            parts = line.split("|", 2)
            if len(parts) != 3:
                continue
            h, ts, msg = parts
            low = msg.lower()
            out.append(EvidenceKnot(
                id=h[:12], kind="commit", path=msg[:120], group="git",
                witness=1 + self.count_terms(low, ["verify", "audit", "docs", "evidence", "fix"]),
                tests=self.count_terms(low, ["test", "ci", "pass", "build"]),
                integrations=self.count_terms(low, ["api", "connect", "integrat", "webhook"]),
                tools=self.count_terms(low, ["tool", "function", "agent"]),
                contradictions=self.count_terms(low, ["fail", "broken", "revert", "bug"]),
                performance_hits=self.count_terms(low, ["latency", "cache", "perf", "timeout"]),
                confidence=0.78, timestamp=float(ts), digest=h, hint=msg
            ))
        return out

    def scan_memory(self) -> List[EvidenceKnot]:
        if not self.memory_file or not self.memory_file.exists():
            return []
        raw = safe_read(self.memory_file)
        text = raw.decode("utf-8", errors="ignore")
        try:
            data = json.loads(text)
            items = data if isinstance(data, list) else data.get("memories", []) if isinstance(data, dict) else []
        except Exception:
            items = [x for x in text.splitlines() if x.strip()]
        out = []
        for i, item in enumerate(items[:1000]):
            s = json.dumps(item, sort_keys=True) if not isinstance(item, str) else item
            out.append(EvidenceKnot(
                id=sha(s)[:12], kind="memory", path=f"memory:{i}", group="memory",
                witness=self.count_terms(s, ["verified", "test", "evidence", "source", "audit"]),
                tests=self.count_terms(s, ["passed", "test", "ci"]),
                integrations=self.count_terms(s, ["api", "connector", "integration", "replit", "pm2", "neon"]),
                tools=self.count_terms(s, ["tool", "function", "agent", "operator"]),
                contradictions=self.count_terms(s, ["broken", "failing", "todo", "stub"]),
                performance_hits=self.count_terms(s, ["latency", "performance", "health"]),
                confidence=0.72, timestamp=time.time(), digest=sha(s), hint=s[:140]
            ))
        return out

    def score(self, knots: Sequence[EvidenceKnot]) -> Dict[str, Any]:
        if not knots:
            return {"ami_score": 0.0, "gate": "BLOCK", "recommendations": ["No evidence knots found. Run against A11oy repo root."]}
        n = len(knots)
        groups = {k.group for k in knots}
        kinds = {k.kind for k in knots}
        witnesses = sum(k.witness for k in knots)
        tests = sum(k.tests for k in knots)
        integrations = sum(k.integrations for k in knots)
        tools = sum(k.tools for k in knots)
        contradictions = sum(k.contradictions for k in knots)
        perf = sum(k.performance_hits for k in knots)
        strengths = [k.strength() for k in knots]
        sig_entropy = entropy([k.signature() for k in knots])
        K = min(1.0, math.log1p(len(groups)) / math.log1p(max(4, min(96, n))))
        W = min(1.0, witnesses / max(1, n*2.0))
        T = min(1.0, (tools + tests) / max(1, n*1.2))
        M = min(1.0, integrations / max(1, n*1.1))
        E = min(1.0, (sum(strengths)/n) * 0.55 + W * 0.45)
        P = min(1.0, (perf + tests) / max(1, n*0.75))
        coherence = max(0.0, 1.0 - contradictions / max(1, contradictions + witnesses + tests))
        recency = self.recency(knots)
        alignment = self.task_alignment(knots)
        N = clamp(0.35*(1-coherence) + 0.25*sig_entropy + 0.20*(1-W) + 0.20*(1-T))
        D = clamp(1.0 - alignment)
        G = self.governance_gate(contradictions, tests, W, T)
        cleanliness = clamp(1.0 - N)
        horizon = clamp(0.40*recency + 0.30*T + 0.30*alignment)
        resonance = clamp(0.35*coherence + 0.30*K + 0.20*M + 0.15*E)
        reconciliation = clamp(0.45*coherence + 0.30*W + 0.25*tests/max(1, n))
        L = lutar_lambda(cleanliness, horizon, resonance, reconciliation)
        renewed = ouroboros_renew({"cleanliness": cleanliness, "horizon": horizon, "resonance": resonance, "reconciliation": reconciliation, "noise": N, "witness": W})
        score = ami_formula(L, K, W, T, M, E, P, renewed["noise"], D, G)
        gate = self.gate(score, renewed["noise"], contradictions, tests, n)
        return {
            "formula": "AMI_v2 = (Λ^0.22*K^0.16*W^0.16*T^0.14*M^0.14*E^0.10*P^0.08)*e^(-0.7N-0.5D)*G",
            "ami_score": score,
            "gate": gate,
            "permissions": PERMISSION_GATES[gate],
            "components": {
                "lambda": L,
                "K_khipu_topology": round(K, 6),
                "W_witness_density": round(W, 6),
                "T_tool_readiness": round(T, 6),
                "M_mesh_compatibility": round(M, 6),
                "E_evidence_quality": round(E, 6),
                "P_performance_reliability": round(P, 6),
                "N_noise": round(renewed["noise"], 6),
                "D_drift": round(D, 6),
                "G_governance": round(G, 6),
            },
            "lutar_axes": {"cleanliness": round(cleanliness,6), "horizon": round(horizon,6), "resonance": round(resonance,6), "reconciliation": round(reconciliation,6)},
            "ouroboros": renewed,
            "counts": {"knots": n, "groups": len(groups), "kinds": len(kinds), "witnesses": witnesses, "tests": tests, "integrations": integrations, "tools": tools, "contradictions": contradictions, "performance_hits": perf},
            "egyptian_fraction_score": egyptian_fraction(score),
            "plan": self.plan(gate, K, W, T, M, E, P, N, D, contradictions),
            "recommendations": self.recommendations(K, W, T, M, E, P, N, D, contradictions, n),
        }

    def task_alignment(self, knots: Sequence[EvidenceKnot]) -> float:
        if not self.task_terms:
            return 0.70
        hits = 0
        for k in knots:
            hay = f"{k.kind} {k.path} {k.group} {k.hint}".lower()
            if any(t in hay for t in self.task_terms):
                hits += 1
        return clamp(hits / max(3, len(self.task_terms)*3))

    @staticmethod
    def governance_gate(contradictions: int, tests: int, W: float, T: float) -> float:
        if contradictions > max(3, tests):
            return 0.45
        if W < 0.35 or T < 0.25:
            return 0.60
        return 1.0

    @staticmethod
    def gate(score: float, noise: float, contradictions: int, tests: int, n: int) -> str:
        if n < 10 or score < 0.35 or noise > 0.72:
            return "BLOCK"
        if score < 0.58 or contradictions > max(5, tests*2):
            return "WATCH"
        if score < 0.76:
            return "ASSIST"
        if score < 0.90:
            return "OPERATE"
        return "AUTONOMOUS"

    @staticmethod
    def plan(gate: str, K: float, W: float, T: float, M: float, E: float, P: float, N: float, D: float, contradictions: int) -> List[str]:
        p = [f"Gate is {gate}; use permissions only from this gate."]
        if K < 0.55: p.append("Increase topology: connect docs, tests, routes, tools, and decisions into clear modules.")
        if W < 0.55: p.append("Increase witnesses: add sources, hashes, owners, timestamps, approvals, and audit notes.")
        if T < 0.55: p.append("Increase tool readiness: wire read-only tools first, then tests, then patch tools behind approval.")
        if M < 0.55: p.append("Increase mesh compatibility: add connectors/API docs for existing systems instead of replacement flows.")
        if E < 0.55: p.append("Improve evidence quality: add specs, README, falsification ledger, examples, and verified claims.")
        if P < 0.55: p.append("Improve performance reliability: add health checks, retries, timeouts, CI, and smoke tests.")
        if N > 0.25: p.append("Reduce noise: remove stale TODO/FIXME/stub/broken markers and duplicate configs.")
        if D > 0.35: p.append("Reduce drift: align file names, docs, prompts, and routes to the current task.")
        if contradictions: p.append("Reconcile contradictions before raising autonomy.")
        return p

    @staticmethod
    def recommendations(K: float, W: float, T: float, M: float, E: float, P: float, N: float, D: float, contradictions: int, n: int) -> List[str]:
        r = []
        if n < 50: r.append("Add more evidence knots: repo files, docs, tests, commits, issues, memory, and integrations.")
        if M < 0.60: r.append("Document A11oy as a mesh layer: APIs, connectors, databases, workflows, human approvals, no rip-and-replace.")
        if T < 0.60: r.append("Expose safe operator tools: system_inspect, repo_search, file_read, http_probe, pm2_status, test runner.")
        if W < 0.60: r.append("Every A11oy action should have a witness packet: why, source, test, approval, result, hash.")
        if P < 0.60: r.append("Add performance checks: health endpoint, latency budget, retry policy, queue status, CI pass/fail.")
        if contradictions: r.append("Turn contradictions into tracked issues and regression tests.")
        if not r: r.append("Formula is healthy. Expand autonomy slowly with CI and approval gates.")
        return r

    @staticmethod
    def recency(knots: Sequence[EvidenceKnot]) -> float:
        ages = [max(0, time.time() - k.timestamp) for k in knots if k.timestamp]
        if not ages:
            return 0.5
        median_days = sorted(ages)[len(ages)//2] / 86400
        return clamp(math.exp(-median_days / 180))

    @staticmethod
    def count_terms(text: str, terms: Sequence[str]) -> int:
        low = text.lower()
        return sum(low.count(t.lower()) for t in terms)

    @staticmethod
    def kind(rel: str, text: str) -> str:
        l = rel.lower(); t = text.lower()
        if "test" in l or "spec" in l: return "test"
        if ".github/workflows" in l or "ci" in l: return "ci"
        if l.endswith(("readme.md", "spec.md", "citations.md", "falsification_ledger.md")) or "/docs/" in l: return "docs"
        if l.endswith(("package.json", "pyproject.toml", "requirements.txt", "package-lock.json")): return "manifest"
        if "api" in l or "route" in l or "connector" in l: return "integration"
        if "tool" in l or "function" in l or "agent" in l: return "tool"
        if "schema" in l or "migration" in l or "ledger" in l: return "ledger"
        if l.endswith((".py", ".ts", ".tsx", ".js", ".jsx")): return "code"
        if any(x in t for x in ["todo", "fixme", "stub", "broken", "not implemented"]): return "contradiction"
        return "artifact"

    @staticmethod
    def confidence(kind: str, text: str, raw: bytes) -> float:
        base = {"test":0.90,"ci":0.84,"docs":0.80,"manifest":0.78,"integration":0.76,"tool":0.76,"ledger":0.75,"code":0.70,"contradiction":0.44}.get(kind,0.62)
        low = text.lower()
        if not raw: base -= 0.22
        if "verified" in low or "passed" in low: base += 0.05
        if "stub" in low or "not implemented" in low: base -= 0.18
        return clamp(base)

def main() -> None:
    ap = argparse.ArgumentParser(description="A11oy AMI Formula Payload")
    ap.add_argument("--root", default=".", help="A11oy repo root")
    ap.add_argument("--task", default="", help="Current mission/task")
    ap.add_argument("--memory-file", default=None, help="Optional memory export JSON/TXT")
    ap.add_argument("--output", default="a11oy_ami_report.json", help="Output report JSON")
    args = ap.parse_args()
    report = A11oyAMI(args.root, args.task, args.memory_file).run()
    Path(args.output).write_text(json.dumps(report, indent=2, sort_keys=True), encoding="utf-8")
    s = report["score"]
    print(json.dumps({
        "payload": PAYLOAD,
        "ami_score": s.get("ami_score"),
        "gate": s.get("gate"),
        "permissions": s.get("permissions"),
        "components": s.get("components"),
        "output": args.output,
    }, indent=2))

if __name__ == "__main__":
    main()
