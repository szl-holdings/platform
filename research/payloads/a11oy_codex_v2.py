#!/usr/bin/env python3
"""
A11OY CODEX UNLOCK EVOLVED PAYLOAD v2.0
Single-file, no-dependency Python payload for A11oy / Alloy.

What it does:
- Scans a repo, git history, optional memory export, and optional task input.
- Converts operational evidence into Inca/khipu-style tokens.
- Computes Inca IQI, Lutar Lambda, Ouroboros renewal, Codex score, and agentic gate.
- Produces an execution plan with safety permissions: BLOCK, WATCH, ASSIST, AUTONOMOUS.
- Writes a JSON report for A11oy to ingest.

Run:
  python a11oy_codex_unlock_evolved_payload.py --root . --task "audit repo" --output a11oy_codex_report.json
"""
from __future__ import annotations
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Dict, List, Mapping, Optional, Sequence
import argparse, hashlib, json, math, os, re, subprocess, time

PAYLOAD_ID = "A11OY-CODEX-INCA-LUTAR-OUROBOROS-V2"
VERSION = "2.0.0"

HARD_CODED_AXIS_WEIGHTS = {
    "topology": 0.16,
    "witness": 0.16,
    "tests": 0.14,
    "coherence": 0.14,
    "diversity": 0.10,
    "recency": 0.08,
    "hash_uniqueness": 0.08,
    "inspectability": 0.06,
    "task_alignment": 0.08,
}

SAFE_AGENT_POLICY = {
    "BLOCK": ["read_only", "explain", "recommend"],
    "WATCH": ["read_only", "draft_patch", "ask_confirmation"],
    "ASSIST": ["read_only", "draft_patch", "run_tests", "open_pr_with_confirmation"],
    "AUTONOMOUS": ["read_only", "draft_patch", "run_tests", "open_pr", "low_risk_merge_if_ci_passes"],
}

@dataclass(frozen=True)
class CodexToken:
    id: str
    kind: str
    path: str
    color: str
    fiber: str
    twist: str
    knot: str
    register: int
    group: str
    witness: int
    tests: int
    contradictions: int
    confidence: float
    timestamp: float
    digest: str
    text_hint: str = ""

    def binary_signature(self) -> str:
        fields = [self.kind, self.color, self.fiber, self.twist, self.knot, str(self.register), self.group]
        bits = []
        for f in fields:
            bits.append(str(int(hashlib.sha256(f.encode()).hexdigest(), 16) % 2))
        bits.append("1" if self.witness else "0")
        bits.append("1" if self.tests else "0")
        bits.append("1" if self.contradictions == 0 else "0")
        return "".join(bits)

    def strength(self) -> float:
        w = min(1.0, math.log1p(max(0, self.witness)) / math.log(12))
        t = min(1.0, math.log1p(max(0, self.tests)) / math.log(12))
        c = min(0.75, 0.10 * max(0, self.contradictions))
        return round(max(0.0, min(1.0, 0.36*self.confidence + 0.28*w + 0.26*t + 0.10 - c)), 6)

def sha(data: bytes | str) -> str:
    if isinstance(data, str):
        data = data.encode("utf-8", errors="ignore")
    return hashlib.sha256(data).hexdigest()

def read_limited(p: Path, limit: int = 1_500_000) -> bytes:
    try:
        if p.stat().st_size > limit:
            return p.read_bytes()[:limit]
        return p.read_bytes()
    except Exception:
        return b""

def entropy(items: Sequence[str]) -> float:
    if not items:
        return 0.0
    counts: Dict[str, int] = {}
    for x in items:
        counts[x] = counts.get(x, 0) + 1
    n = len(items)
    h = -sum((c/n) * math.log2(c/n) for c in counts.values())
    u = len(counts)
    return 0.0 if u <= 1 else round(max(0.0, min(1.0, h / math.log2(u))), 6)

def egyptian_fraction(x: float, max_den: int = 256, max_terms: int = 10) -> List[int]:
    from fractions import Fraction
    x = max(0.0, min(1.0, float(x)))
    if x == 0:
        return []
    f = Fraction(x).limit_denominator(max_den)
    n, d = f.numerator, f.denominator
    out = []
    while n > 0 and len(out) < max_terms:
        unit = math.ceil(d / n)
        out.append(unit)
        n = n * unit - d
        d = d * unit
    return out

def lutar_lambda(cleanliness: float, horizon: float, resonance: float, reconciliation: float) -> float:
    c, h, r, f = [max(0.0, min(1.0, float(v))) for v in [cleanliness, horizon, resonance, reconciliation]]
    return round(c * h * r * f, 8)

def ouroboros(state: Mapping[str, float]) -> Dict[str, float]:
    c = float(state.get("cleanliness", 0.5))
    h = float(state.get("horizon", 0.5))
    r = float(state.get("resonance", 0.5))
    f = float(state.get("reconciliation", 0.5))
    n = float(state.get("noise", 0.1))
    w = float(state.get("witness", 0.5))
    correction = 0.18 * w * r * f
    return {
        "cleanliness": round(max(0, min(1, c + correction - 0.03*n)), 6),
        "horizon": round(max(0, min(1, h + 0.58*correction)), 6),
        "resonance": round(max(0, min(1, r + 0.42*correction - 0.015*n)), 6),
        "reconciliation": round(max(0, min(1, f + 0.50*correction)), 6),
        "noise": round(max(0, min(1, n*0.86 - 0.11*correction)), 6),
        "witness": round(max(0, min(1, w)), 6),
    }

class A11oyCodexUnlock:
    def __init__(self, root: str = ".", memory_file: Optional[str] = None, task: str = ""):
        self.root = Path(root).resolve()
        self.memory_file = Path(memory_file).resolve() if memory_file else None
        self.task = task or ""
        self.task_terms = {x for x in re.findall(r"[a-zA-Z0-9_]{3,}", self.task.lower())}

    def scan(self) -> List[CodexToken]:
        tokens: List[CodexToken] = []
        tokens.extend(self.scan_files())
        tokens.extend(self.scan_git())
        tokens.extend(self.scan_memory())
        if self.task:
            tokens.append(self.task_token())
        return tokens

    def scan_files(self) -> List[CodexToken]:
        ignore = {".git", "node_modules", "__pycache__", ".pytest_cache", "dist", "build", ".next", ".venv", "venv"}
        tokens: List[CodexToken] = []
        if not self.root.exists():
            return tokens
        for p in list(self.root.rglob("*"))[:5000]:
            if not p.is_file() or any(part in ignore for part in p.parts):
                continue
            rel = str(p.relative_to(self.root))
            raw = read_limited(p)
            text = raw.decode("utf-8", errors="ignore")
            kind = self.kind(rel, text)
            witness = self.count_witness(text, kind)
            tests = self.count_tests(text, kind)
            contradictions = self.count_contradictions(text)
            confidence = self.confidence(kind, text, raw)
            tokens.append(CodexToken(
                id=sha(rel)[:14], kind=kind, path=rel,
                color=self.color(kind), fiber=self.fiber(p.suffix.lower(), kind),
                twist="S" if len(raw) % 2 == 0 else "Z",
                knot="figure8" if contradictions else "long" if witness + tests > 2 else "single",
                register=min(9, max(1, len(Path(rel).parts))),
                group=rel.split("/")[0] if "/" in rel else "root",
                witness=witness, tests=tests, contradictions=contradictions,
                confidence=confidence, timestamp=p.stat().st_mtime, digest=sha(raw),
                text_hint=text[:160].replace("\n", " ")
            ))
        return tokens

    def scan_git(self) -> List[CodexToken]:
        if not (self.root / ".git").exists():
            return []
        try:
            log = subprocess.check_output(["git", "log", "--pretty=format:%H|%ct|%s", "-n", "250"], cwd=self.root, text=True, stderr=subprocess.DEVNULL, timeout=8)
        except Exception:
            return []
        out = []
        for line in log.splitlines():
            parts = line.split("|", 2)
            if len(parts) != 3:
                continue
            h, ts, msg = parts
            low = msg.lower()
            contradiction = 1 if any(x in low for x in ["fail", "broken", "revert", "hotfix", "bug"]) else 0
            tests = 1 if any(x in low for x in ["test", "ci", "verify", "pass"]) else 0
            witness = 1 + tests + (1 if any(x in low for x in ["audit", "fix", "docs", "evidence"]) else 0)
            out.append(CodexToken(h[:14], "commit", msg[:140], "green", "cord", "S" if int(ts)%2==0 else "Z", "figure8" if contradiction else "long", 1, "git", witness, tests, contradiction, 0.78 if not contradiction else 0.60, float(ts), h, msg))
        return out

    def scan_memory(self) -> List[CodexToken]:
        if not self.memory_file or not self.memory_file.exists():
            return []
        raw = read_limited(self.memory_file)
        text = raw.decode("utf-8", errors="ignore")
        try:
            data = json.loads(text)
            items = data if isinstance(data, list) else data.get("memories", []) if isinstance(data, dict) else []
        except Exception:
            items = [x for x in text.splitlines() if x.strip()]
        out = []
        for i, item in enumerate(items[:1000]):
            s = json.dumps(item, sort_keys=True) if not isinstance(item, str) else item
            out.append(CodexToken(sha(s)[:14], "memory", f"memory:{i}", "purple", "vicuña", "S" if i%2==0 else "Z", "single", 2, "memory", self.count_witness(s, "memory"), self.count_tests(s, "memory"), self.count_contradictions(s), 0.73, time.time(), sha(s), s[:160]))
        return out

    def task_token(self) -> CodexToken:
        return CodexToken(sha(self.task)[:14], "task", "current_user_task", "gold", "llama", "S", "royal", 1, "intent", 2, 0, 0, 0.86, time.time(), sha(self.task), self.task[:160])

    def score(self, tokens: Sequence[CodexToken]) -> Dict[str, Any]:
        if not tokens:
            return {"a11oy_master_score": 0.0, "agentic_gate": "BLOCK", "recommendations": ["No tokens found. Point --root to the A11oy repo."]}
        n = len(tokens)
        witnesses = sum(t.witness for t in tokens)
        tests = sum(t.tests for t in tokens)
        contradictions = sum(t.contradictions for t in tokens)
        groups = {t.group for t in tokens}
        kinds = {t.kind for t in tokens}
        digests = {t.digest for t in tokens if t.digest}
        strengths = [t.strength() for t in tokens]
        sig_entropy = entropy([t.binary_signature() for t in tokens])
        task_alignment = self.task_alignment(tokens)
        topology = min(1.0, math.log1p(len(groups)) / math.log1p(max(4, min(96, n))))
        witness_density = min(1.0, witnesses / max(1, n*2.2))
        test_density = min(1.0, tests / max(1, n*0.55))
        coherence = max(0.0, 1.0 - contradictions / max(1, contradictions + witnesses + tests))
        diversity = min(1.0, len(kinds) / 9.0)
        recency = self.recency(tokens)
        uniqueness = len(digests) / max(1, n)
        avg_strength = sum(strengths) / n
        inspectability = 1.0 / max(1, len(egyptian_fraction(avg_strength)))
        axes = {
            "topology": topology,
            "witness": witness_density,
            "tests": test_density,
            "coherence": coherence,
            "diversity": diversity,
            "recency": recency,
            "hash_uniqueness": uniqueness,
            "inspectability": inspectability,
            "task_alignment": task_alignment,
        }
        inca_iqi = sum(HARD_CODED_AXIS_WEIGHTS[k] * axes[k] for k in HARD_CODED_AXIS_WEIGHTS)
        noise = max(0.0, min(1.0, 0.35*(1-coherence) + 0.25*sig_entropy + 0.20*(1-witness_density) + 0.12*(1-test_density) + 0.08*(1-task_alignment)))
        cleanliness = max(0.0, 1.0 - noise)
        horizon = min(1.0, 0.34*recency + 0.30*test_density + 0.20*task_alignment + 0.16*diversity)
        resonance = min(1.0, 0.35*coherence + 0.30*topology + 0.20*avg_strength + 0.15*task_alignment)
        reconciliation = min(1.0, 0.42*coherence + 0.28*witness_density + 0.20*test_density + 0.10*inspectability)
        lam = lutar_lambda(cleanliness, horizon, resonance, reconciliation)
        renewed = ouroboros({"cleanliness": cleanliness, "horizon": horizon, "resonance": resonance, "reconciliation": reconciliation, "noise": noise, "witness": witness_density})
        codex_score = math.sqrt(max(0, inca_iqi) * max(0, lam)) * math.exp(-0.12 * renewed["noise"])
        gate = self.gate(codex_score, renewed["noise"], contradictions, tests, n)
        return {
            "payload_id": PAYLOAD_ID,
            "version": VERSION,
            "token_count": n,
            "group_count": len(groups),
            "kind_count": len(kinds),
            "witness_count": witnesses,
            "test_count": tests,
            "contradiction_count": contradictions,
            "axes": {k: round(v, 6) for k, v in axes.items()},
            "entropy": sig_entropy,
            "cleanliness": round(cleanliness, 6),
            "horizon": round(horizon, 6),
            "resonance": round(resonance, 6),
            "reconciliation": round(reconciliation, 6),
            "lutar_lambda": round(lam, 8),
            "inca_iqi": round(inca_iqi, 8),
            "ouroboros": renewed,
            "a11oy_master_score": round(codex_score, 8),
            "agentic_gate": gate,
            "allowed_permissions": SAFE_AGENT_POLICY[gate],
            "plan": self.plan(gate, axes, contradictions, tests, n),
            "recommendations": self.recommendations(axes, contradictions, tests, n, renewed["noise"]),
            "egyptian_fraction_master": egyptian_fraction(codex_score),
        }

    def run(self) -> Dict[str, Any]:
        tokens = self.scan()
        score = self.score(tokens)
        return {
            "engine": "A11oy Codex Unlock Evolved Payload",
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "root": str(self.root),
            "task": self.task,
            "score": score,
            "tokens_preview": [asdict(t) for t in tokens[:40]],
            "manifest_hash": sha(json.dumps([asdict(t) for t in tokens], sort_keys=True)) if tokens else "",
        }

    def task_alignment(self, tokens: Sequence[CodexToken]) -> float:
        if not self.task_terms:
            return 0.65
        hits = 0
        for t in tokens:
            hay = f"{t.kind} {t.path} {t.group} {t.text_hint}".lower()
            if any(term in hay for term in self.task_terms):
                hits += 1
        return round(min(1.0, hits / max(3, len(self.task_terms) * 4)), 6)

    @staticmethod
    def recency(tokens: Sequence[CodexToken]) -> float:
        ages = [max(0.0, time.time() - t.timestamp) for t in tokens if t.timestamp]
        if not ages:
            return 0.5
        median_days = sorted(ages)[len(ages)//2] / 86400
        return round(math.exp(-median_days / 150), 6)

    @staticmethod
    def gate(score: float, noise: float, contradictions: int, tests: int, n: int) -> str:
        if n < 20 or score < 0.38 or noise > 0.70:
            return "BLOCK"
        if contradictions > max(3, tests) or score < 0.58:
            return "WATCH"
        if score < 0.76:
            return "ASSIST"
        return "AUTONOMOUS"

    @staticmethod
    def plan(gate: str, axes: Mapping[str, float], contradictions: int, tests: int, n: int) -> List[Dict[str, str]]:
        actions = []
        if gate == "BLOCK":
            actions.append({"step":"stabilize", "action":"read repo only, produce audit, do not write files automatically"})
        if axes.get("tests", 0) < 0.55:
            actions.append({"step":"witness", "action":"add unit tests, smoke tests, and CI checks for core routes"})
        if axes.get("topology", 0) < 0.55:
            actions.append({"step":"structure", "action":"group repo into apps, packages, services, tests, docs, and ledgers"})
        if contradictions:
            actions.append({"step":"reconcile", "action":"convert TODO/FIXME/broken markers into issues or regression tests"})
        if axes.get("task_alignment", 0) < 0.55:
            actions.append({"step":"align", "action":"add docs and code paths explicitly tied to the requested task"})
        if not actions:
            actions.append({"step":"unlock", "action":"allow low-risk autonomous actions after tests pass"})
        return actions

    @staticmethod
    def recommendations(axes: Mapping[str, float], contradictions: int, tests: int, n: int, noise: float) -> List[str]:
        rec = []
        if n < 80: rec.append("Add more operational knots: files, tests, docs, commits, PRs, issues, and memory records.")
        if axes.get("witness", 0) < 0.50: rec.append("Increase witness density: every important action needs evidence, source, test, owner, timestamp, and hash.")
        if axes.get("tests", 0) < 0.55: rec.append("Raise test density: add CI, smoke tests, and regression tests before autonomous permissions.")
        if axes.get("topology", 0) < 0.55: rec.append("Improve topology: separate services, packages, docs, ledgers, and route maps.")
        if contradictions: rec.append("Reconcile contradictions: remove stale TODO/FIXME/stub/broken markers or turn them into tracked issues.")
        if noise > 0.25: rec.append("Reduce noise: delete dead files, duplicate docs, stale configs, and unclear prompts.")
        if axes.get("task_alignment", 0) < 0.55: rec.append("Align repo and memory to task: add mission docs and agent runbooks using the same vocabulary.")
        return rec or ["Ready for assisted/autonomous expansion: keep permissions incremental and test-gated."]

    @staticmethod
    def kind(rel: str, text: str) -> str:
        l = rel.lower(); t = text.lower()
        if "test" in l or "spec" in l: return "test"
        if ".github/workflows" in l or "ci" in l: return "ci"
        if l.endswith((".env", ".pem", ".key")) or "secret" in l: return "security"
        if l.endswith(("readme.md", "spec.md", "citations.md", "falsification_ledger.md")) or "/docs/" in l: return "evidence"
        if l.endswith(("package.json", "pyproject.toml", "requirements.txt", "poetry.lock", "package-lock.json")): return "manifest"
        if "schema" in l or "migration" in l or "ledger" in l: return "ledger"
        if l.endswith((".py", ".ts", ".tsx", ".js", ".jsx")): return "code"
        if any(x in t for x in ["todo", "fixme", "broken", "stub", "not implemented"]): return "contradiction"
        return "artifact"

    @staticmethod
    def color(kind: str) -> str:
        return {"test":"white","ci":"silver","security":"black","evidence":"blue","manifest":"gold","ledger":"brown","code":"red","contradiction":"orange","commit":"green","memory":"purple","task":"gold"}.get(kind,"gray")

    @staticmethod
    def fiber(ext: str, kind: str) -> str:
        if kind in {"code", "test"}: return "llama"
        if kind in {"evidence", "manifest"}: return "cotton"
        if kind in {"ledger", "ci"}: return "alpaca"
        return "vicuña"

    @staticmethod
    def count_witness(text: str, kind: str) -> int:
        terms = ["source", "citation", "cite", "doi", "test", "passed", "verified", "hash", "signature", "evidence", "witness", "audit", "owner", "timestamp"]
        return (1 if kind in {"test", "ci", "evidence", "ledger", "manifest", "task"} else 0) + sum(text.lower().count(x) for x in terms)

    @staticmethod
    def count_tests(text: str, kind: str) -> int:
        low = text.lower()
        if kind == "test": return max(1, low.count("assert") + low.count("expect(") + low.count("it(") + low.count("test("))
        if kind == "ci": return max(1, low.count("pytest") + low.count("vitest") + low.count("npm test") + low.count("build"))
        return low.count("assert") + low.count("test(")

    @staticmethod
    def count_contradictions(text: str) -> int:
        low = text.lower()
        return sum(low.count(x) for x in ["todo", "fixme", "hack", "broken", "failing", "error", "exception", "not implemented", "stub", "temporary"])

    @staticmethod
    def confidence(kind: str, text: str, raw: bytes) -> float:
        base = {"test":0.90,"ci":0.84,"evidence":0.80,"manifest":0.78,"ledger":0.76,"code":0.70,"task":0.86,"security":0.55,"contradiction":0.44}.get(kind,0.62)
        low = text.lower()
        if not raw: base -= 0.25
        if "stub" in low or "not implemented" in low: base -= 0.18
        if "verified" in low or "passed" in low: base += 0.05
        return round(max(0.05, min(0.98, base)), 4)

def main() -> None:
    ap = argparse.ArgumentParser(description="A11oy Codex Unlock Evolved Payload")
    ap.add_argument("--root", default=".")
    ap.add_argument("--memory-file", default=None)
    ap.add_argument("--task", default="")
    ap.add_argument("--output", default="a11oy_codex_unlock_report.json")
    args = ap.parse_args()
    engine = A11oyCodexUnlock(args.root, args.memory_file, args.task)
    report = engine.run()
    Path(args.output).write_text(json.dumps(report, indent=2, sort_keys=True), encoding="utf-8")
    s = report["score"]
    print(json.dumps({
        "payload": PAYLOAD_ID,
        "score": s.get("a11oy_master_score"),
        "gate": s.get("agentic_gate"),
        "inca_iqi": s.get("inca_iqi"),
        "lutar_lambda": s.get("lutar_lambda"),
        "permissions": s.get("allowed_permissions"),
        "output": args.output,
    }, indent=2))

if __name__ == "__main__":
    main()
