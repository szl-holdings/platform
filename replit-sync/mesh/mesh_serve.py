#!/usr/bin/env python3
"""mesh_serve.py — SZL Sovereign GPU Mesh COORDINATOR (planning + emission only).

This program is PURE PLANNING. It reads every node-capability JSON produced by
mesh_join.sh, computes the model-placement table from DETECTED VRAM (never hardcoded),
and EMITS the serve commands (vLLM / llama.cpp) that an operator (or Forge) would run.

It does NOT launch anything. No subprocess that starts a server is ever invoked here.

DOCTRINE honored here:
  * SZL-Nemo = a GOVERNED serving of the OPEN model Qwen/Qwen3-32B (Apache-2.0).
    Never from-scratch, never "550B", never a local "Ultra" tier. Nemotron Ultra is a
    separate cloud-NIM verified tier and is NOT placed on these boxes.
  * Trust never 100%: placements are labeled MODELED until a node is health-verified LIVE.
  * No secrets are read or printed. Capability JSONs carry no secrets by contract.
  * Placement is COMPUTED from detected vram_mb; nothing about node count or GPU model is
    assumed.

Usage:
    python3 mesh_serve.py --cap-dir /var/lib/szl-mesh/caps --plan
    python3 mesh_serve.py --cap-dir ./caps --plan --emit-commands
    python3 mesh_serve.py --cap-dir ./caps --plan --json
"""

from __future__ import annotations

import argparse
import glob
import json
import os
import sys
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional, Tuple


# --------------------------------------------------------------------------------------
# Tunable thresholds (applied to DETECTED VRAM; change here, not in any node script).
# All values are MODELED footprints for the governed Qwen3-32B Q4 + companion tiers.
# --------------------------------------------------------------------------------------

GOVERNED_MODEL_ID = "Qwen/Qwen3-32B"          # OPEN, Apache-2.0. Served AS "SZL-Nemo".
GOVERNED_MODEL_LABEL = "SZL-Nemo"             # user-facing label for the governed serving.
GOVERNED_QUANT = "Q4"                          # quantization used for the sharded serving.
GOVERNED_HEAD_COUNT = 64                       # Qwen3-32B attention heads; TP must divide it.

# VRAM tier boundaries in MB.
T1_MIN_MB = 4 * 1024                            # >=4GB  : tiny model / embeddings
T2_MIN_MB = 8 * 1024                            # >=8GB  : one quantized chat model / RAG
T3_MIN_MB = 20 * 1024                           # >=20GB : eligible to shard SZL-Nemo
SINGLE_NODE_Q4_MB = 24 * 1024                   # >=24GB : may host Qwen3-32B Q4 single-node

# Companion artifacts (also OPEN, labeled).
MID_CHAT_MODEL = "Qwen/Qwen2.5-7B-Instruct"     # MODELED companion for T2 single-node chat.
EMBED_MODEL = "BAAI/bge-m3"                      # MODELED embeddings/RAG artifact.

DEFAULT_VLLM_PORT = 8000
DEFAULT_LLAMACPP_PORT = 8081


# --------------------------------------------------------------------------------------
# Data model
# --------------------------------------------------------------------------------------

@dataclass
class NodeCap:
    hostname: str
    tailscale_ip: str
    gpu_name: str
    vram_mb: int
    compute_capability: str = "none"
    role: str = "cpu"
    label: str = "MODELED"
    reported_at: str = ""
    source_file: str = ""

    @property
    def has_gpu(self) -> bool:
        return self.vram_mb is not None and self.vram_mb >= T1_MIN_MB

    @property
    def tier(self) -> str:
        v = self.vram_mb or 0
        if v >= T3_MIN_MB:
            return "T3"
        if v >= T2_MIN_MB:
            return "T2"
        if v >= T1_MIN_MB:
            return "T1"
        return "CPU"


@dataclass
class Placement:
    kind: str                      # "szl-nemo-shard" | "szl-nemo-single" | "mid-chat" |
                                   # "embeddings" | "coordinator" | "cpu-orchestration"
    nodes: List[str]               # hostnames
    model_id: Optional[str]        # OPEN model id, or None for infra roles
    served_as: Optional[str]       # user-facing label (e.g. SZL-Nemo) or None
    engine: str                    # "vllm" | "llama.cpp" | "none"
    tensor_parallel: int = 1
    quant: Optional[str] = None
    label: str = "MODELED"         # MODELED until health-verified LIVE
    notes: str = ""
    commands: List[str] = field(default_factory=list)


# --------------------------------------------------------------------------------------
# Loading
# --------------------------------------------------------------------------------------

def load_caps(cap_dir: str) -> List[NodeCap]:
    caps: List[NodeCap] = []
    pattern = os.path.join(cap_dir, "*.json")
    for path in sorted(glob.glob(pattern)):
        try:
            with open(path, "r", encoding="utf-8") as fh:
                raw = json.load(fh)
        except (OSError, ValueError) as exc:
            sys.stderr.write("[mesh_serve] skip %s: %s\n" % (path, exc))
            continue
        cap = NodeCap(
            hostname=str(raw.get("hostname", "")),
            tailscale_ip=str(raw.get("tailscale_ip", "")),
            gpu_name=str(raw.get("gpu_name", "none")),
            vram_mb=int(raw.get("vram_mb", 0) or 0),
            compute_capability=str(raw.get("compute_capability", "none")),
            role=str(raw.get("role", "cpu")),
            label=str(raw.get("label", "MODELED")),
            reported_at=str(raw.get("reported_at", "")),
            source_file=path,
        )
        if not cap.hostname:
            sys.stderr.write("[mesh_serve] skip %s: no hostname\n" % path)
            continue
        caps.append(cap)
    return caps


# --------------------------------------------------------------------------------------
# Command emitters (STRINGS ONLY — never executed)
# --------------------------------------------------------------------------------------

def emit_vllm_tp_commands(nodes: List[NodeCap], tp: int) -> List[str]:
    """Emit a Ray + vLLM tensor-parallel serve plan across `nodes` (TP=len)."""
    head = nodes[0]
    workers = nodes[1:]
    cmds: List[str] = []
    cmds.append(
        "# --- SZL-Nemo (governed Qwen3-32B %s) tensor-parallel TP=%d ---" % (GOVERNED_QUANT, tp)
    )
    cmds.append(
        "# Ray head on %s (%s):" % (head.hostname, head.tailscale_ip)
    )
    cmds.append(
        "ssh %s 'ray start --head --node-ip-address=%s --port=6379'"
        % (head.hostname, head.tailscale_ip)
    )
    for w in workers:
        cmds.append(
            "ssh %s 'ray start --address=%s:6379 --node-ip-address=%s'"
            % (w.hostname, head.tailscale_ip, w.tailscale_ip)
        )
    cmds.append(
        "ssh %s 'vllm serve %s --tensor-parallel-size %d "
        "--quantization %s --served-model-name %s --host %s --port %d'"
        % (
            head.hostname,
            GOVERNED_MODEL_ID,
            tp,
            _vllm_quant_flag(GOVERNED_QUANT),
            GOVERNED_MODEL_LABEL,
            head.tailscale_ip,
            DEFAULT_VLLM_PORT,
        )
    )
    cmds.append(
        "# endpoint: http://%s:%d/v1 (served-model-name=%s)"
        % (head.tailscale_ip, DEFAULT_VLLM_PORT, GOVERNED_MODEL_LABEL)
    )
    return cmds


def emit_vllm_single(node: NodeCap, model_id: str, served_as: str,
                     quant: Optional[str]) -> List[str]:
    quant_part = ""
    if quant:
        quant_part = " --quantization %s" % _vllm_quant_flag(quant)
    return [
        "# --- single-node vLLM on %s (%s) ---" % (node.hostname, node.tailscale_ip),
        "ssh %s 'vllm serve %s --served-model-name %s%s --host %s --port %d'"
        % (node.hostname, model_id, served_as, quant_part, node.tailscale_ip, DEFAULT_VLLM_PORT),
        "# endpoint: http://%s:%d/v1" % (node.tailscale_ip, DEFAULT_VLLM_PORT),
    ]


def emit_llamacpp_single(node: NodeCap, model_id: str, served_as: str) -> List[str]:
    return [
        "# --- single-node llama.cpp on %s (%s) ---" % (node.hostname, node.tailscale_ip),
        "# NOTE: provide a local GGUF of %s; no runtime CDN fetch." % model_id,
        "ssh %s 'llama-server -m /models/%s.gguf --alias %s --host %s --port %d'"
        % (node.hostname, _safe_name(model_id), served_as, node.tailscale_ip, DEFAULT_LLAMACPP_PORT),
        "# endpoint: http://%s:%d/v1" % (node.tailscale_ip, DEFAULT_LLAMACPP_PORT),
    ]


def _vllm_quant_flag(quant: str) -> str:
    mapping = {"Q4": "awq", "Q5": "gptq", "Q8": "fp8"}
    return mapping.get(quant.upper(), "awq")


def _safe_name(model_id: str) -> str:
    return model_id.replace("/", "_")


# --------------------------------------------------------------------------------------
# Planner — COMPUTES placement from detected VRAM
# --------------------------------------------------------------------------------------

def chunk_pairs(nodes: List[NodeCap], group_size: int) -> List[List[NodeCap]]:
    groups: List[List[NodeCap]] = []
    i = 0
    while i + group_size <= len(nodes):
        groups.append(nodes[i:i + group_size])
        i += group_size
    return groups


def choose_tp(num_t3: int) -> int:
    """Pick the largest TP that divides the head count and fits available T3 count."""
    for tp in (4, 2):
        if num_t3 >= tp and GOVERNED_HEAD_COUNT % tp == 0:
            return tp
    return 1


def compute_plan(caps: List[NodeCap]) -> List[Placement]:
    placements: List[Placement] = []

    t3 = sorted([c for c in caps if c.tier == "T3"], key=lambda c: -c.vram_mb)
    t2 = sorted([c for c in caps if c.tier == "T2"], key=lambda c: -c.vram_mb)
    t1 = sorted([c for c in caps if c.tier == "T1"], key=lambda c: -c.vram_mb)
    cpu = [c for c in caps if c.tier == "CPU"]

    # --- Coordinator / public proxy: prefer an always-up CPU node ---
    if cpu:
        coord = cpu[0]
        placements.append(Placement(
            kind="coordinator",
            nodes=[coord.hostname],
            model_id=None,
            served_as=None,
            engine="none",
            label=coord.label,
            notes="coordinator + public proxy + HF failover broker (always-on CPU host)",
        ))
        for extra in cpu[1:]:
            placements.append(Placement(
                kind="cpu-orchestration",
                nodes=[extra.hostname],
                model_id=None,
                served_as=None,
                engine="none",
                label=extra.label,
                notes="orchestration / k3d-UDS workers / redundancy",
            ))
    else:
        # No CPU node: elect the smallest GPU node as coordinator so the brain still exists.
        fallback = (t1 or t2 or t3)
        if fallback:
            coord = fallback[-1]
            placements.append(Placement(
                kind="coordinator",
                nodes=[coord.hostname],
                model_id=None,
                served_as=None,
                engine="none",
                label=coord.label,
                notes="no CPU node available; elected smallest GPU node as coordinator",
            ))

    # --- T3: shard the governed SZL-Nemo across pairs (or single-node if alone & big) ---
    used_t3: set = set()
    if len(t3) >= 2:
        tp = choose_tp(len(t3))
        groups = chunk_pairs(t3, tp)
        for grp in groups:
            placements.append(Placement(
                kind="szl-nemo-shard",
                nodes=[n.hostname for n in grp],
                model_id=GOVERNED_MODEL_ID,
                served_as=GOVERNED_MODEL_LABEL,
                engine="vllm",
                tensor_parallel=tp,
                quant=GOVERNED_QUANT,
                label="MODELED",
                notes="governed Qwen3-32B %s sharded TP=%d (head_count %d divisible)"
                      % (GOVERNED_QUANT, tp, GOVERNED_HEAD_COUNT),
                commands=emit_vllm_tp_commands(grp, tp),
            ))
            for n in grp:
                used_t3.add(n.hostname)
        # Any leftover T3 not in a full group → single-node governed serving if big enough.
        for n in t3:
            if n.hostname in used_t3:
                continue
            if n.vram_mb >= SINGLE_NODE_Q4_MB:
                placements.append(_single_governed(n))
                used_t3.add(n.hostname)
    elif len(t3) == 1:
        n = t3[0]
        if n.vram_mb >= SINGLE_NODE_Q4_MB:
            placements.append(_single_governed(n))
            used_t3.add(n.hostname)
        else:
            # 20-24GB lone T3: treat as mid single rather than risk OOM on Q4 + KV.
            placements.append(_mid_single(n))
            used_t3.add(n.hostname)

    # Any T3 not yet used (e.g. odd one out, too small to solo) → mid single chat.
    for n in t3:
        if n.hostname not in used_t3:
            placements.append(_mid_single(n))

    # --- T2: one quantized chat model OR embeddings each ---
    # First T2 → embeddings/RAG (so a chat dependency isn't pinned to a laptop-class node);
    # remaining T2 → mid single chat.
    for idx, n in enumerate(t2):
        if idx == 0:
            placements.append(_embeddings(n, engine="llama.cpp"))
        else:
            placements.append(_mid_single(n))

    # --- T1: tiny model or embeddings ---
    for n in t1:
        placements.append(_embeddings(n, engine="llama.cpp"))

    return placements


def _single_governed(node: NodeCap) -> Placement:
    return Placement(
        kind="szl-nemo-single",
        nodes=[node.hostname],
        model_id=GOVERNED_MODEL_ID,
        served_as=GOVERNED_MODEL_LABEL,
        engine="vllm",
        tensor_parallel=1,
        quant=GOVERNED_QUANT,
        label="MODELED",
        notes="lone large GPU (>=24GB) hosts governed Qwen3-32B %s single-node" % GOVERNED_QUANT,
        commands=emit_vllm_single(node, GOVERNED_MODEL_ID, GOVERNED_MODEL_LABEL, GOVERNED_QUANT),
    )


def _mid_single(node: NodeCap) -> Placement:
    return Placement(
        kind="mid-chat",
        nodes=[node.hostname],
        model_id=MID_CHAT_MODEL,
        served_as="szl-mid",
        engine="vllm",
        tensor_parallel=1,
        quant="Q4",
        label="MODELED",
        notes="mid GPU: one quantized chat model",
        commands=emit_vllm_single(node, MID_CHAT_MODEL, "szl-mid", "Q4"),
    )


def _embeddings(node: NodeCap, engine: str) -> Placement:
    if engine == "vllm":
        cmds = emit_vllm_single(node, EMBED_MODEL, "szl-embed", None)
    else:
        cmds = emit_llamacpp_single(node, EMBED_MODEL, "szl-embed")
    return Placement(
        kind="embeddings",
        nodes=[node.hostname],
        model_id=EMBED_MODEL,
        served_as="szl-embed",
        engine=engine,
        tensor_parallel=1,
        quant=None,
        label="MODELED",
        notes="embeddings / RAG reranker",
        commands=cmds,
    )


# --------------------------------------------------------------------------------------
# Rendering
# --------------------------------------------------------------------------------------

def render_table(caps: List[NodeCap], placements: List[Placement]) -> str:
    lines: List[str] = []
    lines.append("== DETECTED NODES (label = capability source) ==")
    lines.append("%-20s %-16s %-22s %8s %5s %-8s %s"
                 % ("hostname", "tailscale_ip", "gpu_name", "vram_mb", "tier", "role", "label"))
    for c in caps:
        lines.append("%-20s %-16s %-22s %8d %5s %-8s %s"
                     % (c.hostname, c.tailscale_ip, (c.gpu_name or "none")[:22],
                        c.vram_mb or 0, c.tier, c.role, c.label))
    lines.append("")
    lines.append("== COMPUTED PLACEMENT TABLE (MODELED until health-verified LIVE) ==")
    lines.append("%-20s %-26s %-10s %-4s %s"
                 % ("kind", "nodes", "engine", "tp", "served_as / model"))
    for p in placements:
        served = p.served_as or "-"
        model = p.model_id or "-"
        lines.append("%-20s %-26s %-10s %-4d %s"
                     % (p.kind, ",".join(p.nodes)[:26], p.engine, p.tensor_parallel,
                        "%s (%s)" % (served, model)))
    return "\n".join(lines)


def render_commands(placements: List[Placement]) -> str:
    out: List[str] = []
    out.append("# ============================================================")
    out.append("# EMITTED SERVE COMMANDS (PLAN ONLY — NOT EXECUTED BY THIS TOOL)")
    out.append("# SZL-Nemo == governed serving of OPEN %s (Apache-2.0)." % GOVERNED_MODEL_ID)
    out.append("# Run these via Forge/operator on the real boxes; verify each endpoint.")
    out.append("# ============================================================")
    for p in placements:
        out.append("")
        out.append("# [%s] nodes=%s label=%s" % (p.kind, ",".join(p.nodes), p.label))
        if p.notes:
            out.append("#   note: %s" % p.notes)
        if p.commands:
            out.extend(p.commands)
        else:
            out.append("#   (infra role — no serve command)")
    return "\n".join(out)


def plan_to_dict(caps: List[NodeCap], placements: List[Placement]) -> Dict[str, Any]:
    return {
        "schema": "szl-mesh.plan/v1",
        "governed_model": {
            "served_as": GOVERNED_MODEL_LABEL,
            "open_model_id": GOVERNED_MODEL_ID,
            "license": "Apache-2.0",
            "doctrine": "governed serving of an OPEN model; never from-scratch / never 550B / "
                        "never local-Ultra. Nemotron Ultra = cloud-NIM verified tier only.",
        },
        "trust_note": "all placements MODELED until a live health probe promotes them to LIVE; "
                      "trust never 100%.",
        "nodes": [asdict(c) for c in caps],
        "placements": [asdict(p) for p in placements],
    }


# --------------------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------------------

def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="SZL Sovereign GPU Mesh coordinator (plan only).")
    parser.add_argument("--cap-dir", default=os.environ.get("CAP_DIR", "/var/lib/szl-mesh/caps"),
                        help="directory of node-capability JSONs written by mesh_join.sh")
    parser.add_argument("--plan", action="store_true", help="compute and print the placement table")
    parser.add_argument("--emit-commands", action="store_true",
                        help="also print the emitted (not executed) serve commands")
    parser.add_argument("--json", action="store_true", help="print the plan as JSON")
    args = parser.parse_args(argv)

    caps = load_caps(args.cap_dir)
    if not caps:
        sys.stderr.write("[mesh_serve] no capability JSONs found in %s\n" % args.cap_dir)
        sys.stderr.write("[mesh_serve] run mesh_join.sh on each node first.\n")
        return 2

    placements = compute_plan(caps)

    if args.json:
        print(json.dumps(plan_to_dict(caps, placements), indent=2))
        return 0

    if args.plan or not args.emit_commands:
        print(render_table(caps, placements))

    if args.emit_commands:
        print("")
        print(render_commands(placements))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
