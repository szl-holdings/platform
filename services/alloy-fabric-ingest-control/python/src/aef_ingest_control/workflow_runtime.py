"""Workflow runtime used by the ingestion control service.

Python mirror of `packages/aef-workflow-runtime` (types, checkpoint and approval stores, actors,
state machine and the five workflow definitions). Checkpoint and approval files keep the
original on-disk format, a JSON array of `[id, record]` pairs indented by two spaces, so the
TypeScript and Python services can read each other's state.
"""

from __future__ import annotations

import copy
import math
import re
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Protocol

from .jscompat import (
    UNDEFINED,
    iso_now,
    js_number,
    js_or_default,
    js_split_whitespace,
    js_spread,
    js_string,
    js_trim,
    js_truthy,
    now_ms,
    parse_json,
    short_random,
    stringify,
    utf16_length,
)

Record = dict[str, Any]
AuditEmitter = Callable[[Record], None]


# ─── Stores ──────────────────────────────────────────────────────────────────


class _FileMapStore:
    """In-memory map mirrored to one JSON file; flushes are best-effort, as in the original."""

    def __init__(self, file_path: str) -> None:
        self._path = Path(file_path)
        self._data: dict[str, Record] = self._load_from_disk()

    def _load_from_disk(self) -> dict[str, Record]:
        try:
            if not self._path.exists():
                return {}
            entries = parse_json(self._path.read_text(encoding="utf-8"))
            if not isinstance(entries, list):  # `new Map(nonArray)` throws, and the throw is caught
                return {}
            return {key: value for key, value in entries}
        except Exception:  # noqa: BLE001 - a corrupt file starts empty, matching the original
            return {}

    def _flush(self) -> None:
        try:
            self._path.parent.mkdir(parents=True, exist_ok=True)
            self._path.write_text(stringify([[k, v] for k, v in self._data.items()], indent=2),
                                  encoding="utf-8")
        except Exception:  # noqa: BLE001 - best-effort flush, never raises
            pass


class FileCheckpointStore(_FileMapStore):
    def save(self, checkpoint: Record) -> None:
        self._data[checkpoint["workflowId"]] = copy.deepcopy(checkpoint)
        self._flush()

    def load(self, workflow_id: str) -> Record | None:
        checkpoint = self._data.get(workflow_id)
        return copy.deepcopy(checkpoint) if checkpoint is not None else None

    def delete(self, workflow_id: str) -> bool:
        if workflow_id not in self._data:
            return False
        del self._data[workflow_id]
        self._flush()
        return True

    def list(self) -> list[Record]:
        return [copy.deepcopy(cp) for cp in self._data.values()]


class FileApprovalStore(_FileMapStore):
    def create(self, request: Record) -> None:
        if request["approvalId"] in self._data:
            raise KeyError(f"Approval request already exists: {request['approvalId']}")
        self._data[request["approvalId"]] = copy.deepcopy(request)
        self._flush()

    def get(self, approval_id: str) -> Record | None:
        record = self._data.get(approval_id)
        return copy.deepcopy(record) if record is not None else None

    def resolve(self, approval_id: str, decision: Any, operator_id: Any, rationale: Any = UNDEFINED) -> Record:
        existing = self._data.get(approval_id)
        if existing is None:
            raise KeyError(f"Approval request not found: {approval_id}")
        if existing.get("decision", UNDEFINED) != "pending":
            raise ValueError(
                f"Approval {approval_id} is already resolved: {js_string(existing.get('decision', UNDEFINED))}"
            )
        resolved = {
            **existing,
            "decision": decision,
            "operatorId": operator_id,
            **({"rationale": rationale} if rationale is not UNDEFINED else {}),
            "resolvedAt": iso_now(),
        }
        self._data[approval_id] = resolved
        self._flush()
        return copy.deepcopy(resolved)

    def list(self, workflow_id: str | None = None) -> list[Record]:
        records = list(self._data.values())
        if workflow_id:
            records = [r for r in records if r.get("workflowId") == workflow_id]
        return [copy.deepcopy(r) for r in records]


class CheckpointStore(Protocol):
    def save(self, checkpoint: Record) -> None: ...
    def load(self, workflow_id: str) -> Record | None: ...
    def delete(self, workflow_id: str) -> bool: ...


class ApprovalStore(Protocol):
    def create(self, request: Record) -> None: ...
    def get(self, approval_id: str) -> Record | None: ...


def create_approval_request(workflow_id: str, kind: str, context: Record | None = None) -> Record:
    return {
        "approvalId": f"apr-{now_ms()}-{short_random()}",
        "workflowId": workflow_id,
        "kind": kind,
        "requestedAt": iso_now(),
        "decision": "pending",
        "context": context if context is not None else {},
    }


# ─── Actors ──────────────────────────────────────────────────────────────────


class ChunkTokenizer(Protocol):
    def encode(self, text: str) -> list[int]: ...
    def decode(self, ids: list[int]) -> str: ...


def ingestion_planner(ctx: Record, inp: Record) -> Record:
    source_id = js_string(js_or_default(inp.get("sourceId", UNDEFINED), "unknown"))
    content_length = utf16_length(js_string(js_or_default(inp.get("content", UNDEFINED), "")))
    return {"output": {
        "plan": "sequential-ingest",
        "sourceId": source_id,
        "estimatedChunks": max(1, math.ceil(content_length / 512)),
        "contentLengthBytes": content_length,
        "profileId": ctx.get("profileId", UNDEFINED),
        "tenantId": ctx["tenantId"],
    }}


def source_normalizer(_ctx: Record, inp: Record) -> Record:
    content = js_string(js_or_default(inp.get("content", UNDEFINED), ""))
    normalized = js_trim(re.sub(" {2,}", " ", content.replace("\r\n", "\n").replace("\t", " ")))
    return {"output": {
        "normalizedLength": utf16_length(normalized),
        "contentType": js_string(js_or_default(inp.get("contentType", UNDEFINED), "text/plain")),
        "normalizedAt": iso_now(),
    }}


def load_default_chunk_tokenizer(
    model_ref: str = "Xenova/all-MiniLM-L6-v2@751bff37182d3f1213fa05d7196b954e230abad9",
) -> ChunkTokenizer | None:
    """Model tokenizer for token-aligned chunking, or None to fall back to words.

    The original lazily imports the embedding worker's tokenizer and falls back to word
    chunking when it cannot be loaded. This port does not download a tokenizer: it uses one
    only when the `tokenizers` package and a locally cached copy of the pinned revision are
    already present. Token-mode parity with transformers.js is not yet verified.
    """
    try:
        from huggingface_hub import hf_hub_download  # type: ignore[import-not-found]
        from tokenizers import Tokenizer  # type: ignore[import-not-found]

        repo, revision = model_ref.split("@", 1)
        path = hf_hub_download(repo, "tokenizer.json", revision=revision, local_files_only=True)
        tokenizer = Tokenizer.from_file(path)
    except Exception:  # noqa: BLE001 - any failure means word fallback, as in the original
        return None

    class _Adapter:
        def encode(self, text: str) -> list[int]:
            return tokenizer.encode(text).ids

        def decode(self, ids: list[int]) -> str:
            return tokenizer.decode(ids)

    return _Adapter()


@dataclass
class ChunkPlanner:
    tokenizer: ChunkTokenizer | None = None
    tokenizer_loader: Callable[[], ChunkTokenizer | None] | None = None
    truncation_policy: Record | None = None
    _loaded: bool = field(default=False, repr=False)

    def _resolve_tokenizer(self) -> ChunkTokenizer | None:
        if self.tokenizer is not None:
            return self.tokenizer
        if self.tokenizer_loader is None:
            return None
        if not self._loaded:  # the loader runs once, like the cached promise in the original
            self._loaded = True
            self.tokenizer = self.tokenizer_loader()
        return self.tokenizer

    def __call__(self, _ctx: Record, inp: Record) -> Record:
        content = js_string(js_or_default(inp.get("content", UNDEFINED), ""))
        chunk_size = js_number(js_or_default(inp.get("chunkSize", UNDEFINED), 512))
        chunk_overlap = js_number(js_or_default(inp.get("chunkOverlap", UNDEFINED), 64))
        policy = js_or_default(inp.get("truncationPolicy", UNDEFINED), UNDEFINED)
        if policy is UNDEFINED:
            policy = (self.truncation_policy if self.truncation_policy is not None
                      else {"strategy": "truncate", "maxTokens": 512})
        tokenizer = self._resolve_tokenizer()
        if tokenizer is not None:
            return _plan_by_tokens(tokenizer, content, chunk_size, chunk_overlap, policy)
        return _plan_by_words(content, chunk_size, chunk_overlap, policy)


def _member(value: Any, key: str) -> Any:
    """`value.key` for a JSON-shaped value: anything but an object yields undefined."""
    return value.get(key, UNDEFINED) if isinstance(value, dict) else UNDEFINED


def _plan_by_tokens(tokenizer: ChunkTokenizer, content: str, chunk_size: Any, chunk_overlap: Any,
                    policy: Any) -> Record:
    ids = tokenizer.encode(content)
    if chunk_size <= 0:
        raise ValueError(f"ChunkPlanner: chunkSize={js_string(chunk_size)} must be > 0")
    if chunk_overlap < 0 or chunk_overlap >= chunk_size:
        raise ValueError(
            f"ChunkPlanner: chunkOverlap={js_string(chunk_overlap)} must be in [0, {js_string(chunk_size)})"
        )
    step = max(1, chunk_size - chunk_overlap)
    max_tokens = js_number(_member(policy, "maxTokens"))
    chunks: list[Record] = []
    cursor = 0
    while cursor < len(ids):
        end = min(cursor + chunk_size, len(ids))
        window = ids[cursor:end]
        truncated = False
        if len(window) > max_tokens:  # a missing or non-numeric limit compares false, as in JS
            if _member(policy, "strategy") == "reject":
                raise ValueError(
                    f"ChunkPlanner[reject]: window of {len(window)} tokens exceeds maxTokens={js_string(max_tokens)}"
                )
            window = window[:int(max_tokens)]
            truncated = True
        chunks.append({
            "chunkIndex": len(chunks), "start": cursor, "end": cursor + len(window), "unit": "tokens",
            "tokenCount": len(window), "text": tokenizer.decode(window), "truncated": truncated,
        })
        if end >= len(ids):
            break
        cursor += step
    return {"output": {
        "chunkPlan": chunks, "totalChunks": len(chunks), "unit": "tokens",
        "chunkSizeTokens": chunk_size, "chunkOverlapTokens": chunk_overlap, "totalTokens": len(ids),
        "truncationPolicy": policy, "anyTruncated": any(c["truncated"] for c in chunks),
    }}


def _plan_by_words(content: str, chunk_size: Any, chunk_overlap: Any, policy: Any) -> Record:
    words = js_split_whitespace(content)
    chunks: list[Record] = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        estimate = math.ceil((end - start) * 1.3)
        if estimate > js_number(_member(policy, "maxTokens")) and _member(policy, "strategy") == "reject":
            raise ValueError(
                f"ChunkPlanner[reject]: estimated {estimate} tokens exceeds maxTokens="
                f"{js_string(_member(policy, 'maxTokens'))} (no tokenizer injected)"
            )
        chunks.append({"chunkIndex": len(chunks), "start": start, "end": end, "unit": "words",
                       "tokenCount": estimate})
        if end >= len(words):
            break
        start = end - chunk_overlap
        if start <= chunks[-1]["start"]:
            start = end
    return {"output": {
        "chunkPlan": chunks, "totalChunks": len(chunks), "unit": "words",
        "chunkSizeWords": chunk_size, "chunkOverlapWords": chunk_overlap, "truncationPolicy": policy,
    }}


def policy_guard(ctx: Record, inp: Record) -> Record:
    operation = js_string(js_or_default(inp.get("operation", UNDEFINED), "ingest"))
    is_destructive = operation in ("rebuild_index", "rotate_profile_version")
    return {"output": {
        "tenantId": ctx["tenantId"],
        "operation": operation,
        "policyDecision": "allow",
        "isDestructive": is_destructive,
        "approvalRequired": ctx["approvalRequired"] and is_destructive,
        "checkedAt": iso_now(),
    }}


def vector_dispatch(ctx: Record, inp: Record) -> Record:
    return {"output": {
        "dispatchedChunks": js_number(js_or_default(inp.get("totalChunks", UNDEFINED), 0)),
        "backend": "LocalCpuBackend",
        "profileId": ctx.get("profileId", UNDEFINED),
        "model": "aef-embed-v1",
        "batchSize": 32,
        "dispatchedAt": iso_now(),
    }}


def index_verifier(ctx: Record, inp: Record) -> Record:
    expected = js_number(js_or_default(inp.get("expectedChunks", UNDEFINED), 0))
    indexed = js_number(js_or_default(inp.get("indexedChunks", UNDEFINED), expected))
    missing = expected - indexed
    return {"output": {
        "verified": missing == 0,
        "expectedChunks": expected,
        "indexedChunks": indexed,
        "missingChunks": missing,
        "tenantId": ctx["tenantId"],
        "verifiedAt": iso_now(),
    }}


def retrieval_evaluator(ctx: Record, inp: Record) -> Record:
    query_count = js_number(js_or_default(inp.get("queryCount", UNDEFINED), 0))
    return {"output": {
        "queryCount": query_count,
        "profileId": ctx.get("profileId", UNDEFINED),
        "tenantId": ctx["tenantId"],
        "evalStatus": "completed" if query_count > 0 else "skipped",
        "sampleMetrics": {
            "ndcg_at_10": 0.82 if query_count > 0 else None,
            "recall_at_10": 0.75 if query_count > 0 else None,
        },
        "evaluatedAt": iso_now(),
    }}


def approval_gate(_ctx: Record, inp: Record) -> Record:
    requires = js_truthy(js_or_default(inp.get("requiresApproval", UNDEFINED), False))
    return {
        "output": {"gateResult": "approval_required" if requires else "pass",
                   "requiresApproval": requires, "checkedAt": iso_now()},
        "requiresApproval": requires,
    }


# ─── Workflow definitions ────────────────────────────────────────────────────


@dataclass(frozen=True)
class Step:
    step_id: str
    actor: str
    execute: Callable[[Record, list[Record]], Record]


@dataclass(frozen=True)
class WorkflowDefinition:
    kind: str
    steps: tuple[Step, ...]


def _prior(prior: list[Record], step_id: str) -> Record:
    for result in prior:
        if result.get("stepId") == step_id:
            return result.get("output") or {}
    return {}


def ingest_document_workflow(chunk_planner: ChunkPlanner | None = None) -> WorkflowDefinition:
    planner = chunk_planner or ChunkPlanner(tokenizer_loader=load_default_chunk_tokenizer)

    def gate(ctx: Record, prior: list[Record]) -> Record:
        total = js_number(js_or_default(_prior(prior, "plan-chunks").get("totalChunks", UNDEFINED), 0))
        return approval_gate(ctx, {"requiresApproval": ctx["approvalRequired"] and total > 1000})

    def dispatch(ctx: Record, prior: list[Record]) -> Record:
        total = js_number(js_or_default(_prior(prior, "plan-chunks").get("totalChunks", UNDEFINED), 0))
        return vector_dispatch(ctx, {"totalChunks": total, **ctx["input"]})

    def verify(ctx: Record, prior: list[Record]) -> Record:
        expected = js_number(js_or_default(_prior(prior, "plan-chunks").get("totalChunks", UNDEFINED), 0))
        dispatched = js_number(
            js_or_default(_prior(prior, "vector-dispatch").get("dispatchedChunks", UNDEFINED), expected))
        return index_verifier(ctx, {"expectedChunks": expected, "indexedChunks": dispatched})

    return WorkflowDefinition("ingest_document", (
        Step("policy-check", "PolicyGuard",
             lambda ctx, _p: policy_guard(ctx, {"operation": "ingest_document", **ctx["input"]})),
        Step("plan-ingestion", "IngestionPlanner", lambda ctx, _p: ingestion_planner(ctx, ctx["input"])),
        Step("normalize-source", "SourceNormalizer", lambda ctx, _p: source_normalizer(ctx, ctx["input"])),
        Step("plan-chunks", "ChunkPlanner", lambda ctx, _p: planner(ctx, ctx["input"])),
        Step("approval-gate", "ApprovalGate", gate),
        Step("vector-dispatch", "VectorDispatch", dispatch),
        Step("verify-index", "IndexVerifier", verify),
    ))


def _js_length(value: Any) -> int | float:
    """`value.length`: strings count UTF-16 units; values without a length give NaN arithmetic."""
    if isinstance(value, str):
        return utf16_length(value)
    if isinstance(value, list):
        return len(value)
    return math.nan


def _rebuild_dispatch(ctx: Record, _prior_steps: list[Record]) -> Record:
    source_ids = ctx["input"].get("sourceIds", UNDEFINED)
    total = _js_length(source_ids) * 10 if js_truthy(source_ids) else 100
    return vector_dispatch(ctx, {"totalChunks": total, "operation": "rebuild"})


def _rebuild_verify(ctx: Record, prior: list[Record]) -> Record:
    dispatched = js_number(js_or_default(_prior(prior, "vector-dispatch").get("dispatchedChunks", UNDEFINED), 0))
    return index_verifier(ctx, {"expectedChunks": dispatched, "indexedChunks": dispatched})


REBUILD_INDEX = WorkflowDefinition("rebuild_index", (
    Step("policy-check", "PolicyGuard",
         lambda ctx, _p: policy_guard(ctx, {"operation": "rebuild_index", **ctx["input"]})),
    Step("approval-gate", "ApprovalGate", lambda ctx, _p: approval_gate(ctx, {
        "requiresApproval": ctx["approvalRequired"] and js_truthy(ctx["input"].get("fullRebuild", UNDEFINED)),
        "operation": "rebuild_index",
        "isFullRebuild": js_truthy(ctx["input"].get("fullRebuild", UNDEFINED)),
    })),
    Step("vector-dispatch", "VectorDispatch", _rebuild_dispatch),
    Step("verify-index", "IndexVerifier", _rebuild_verify),
))

VERIFY_INDEX_HEALTH = WorkflowDefinition("verify_index_health", (
    Step("policy-check", "PolicyGuard",
         lambda ctx, _p: policy_guard(ctx, {"operation": "verify_index_health", **ctx["input"]})),
    Step("verify-index", "IndexVerifier", lambda ctx, _p: index_verifier(ctx, {
        "expectedChunks": js_number(js_or_default(ctx["input"].get("expectedChunks", UNDEFINED), 0)),
        "indexedChunks": js_number(js_or_default(ctx["input"].get("expectedChunks", UNDEFINED), 0)),
    })),
))


def _eval_step(ctx: Record, _prior_steps: list[Record]) -> Record:
    queries = ctx["input"].get("queries", UNDEFINED)
    count = len(queries) if isinstance(queries, list) else js_number(
        js_or_default(ctx["input"].get("queryCount", UNDEFINED), 0))
    return retrieval_evaluator(ctx, {"queryCount": count, **ctx["input"]})


RUN_RETRIEVAL_EVAL = WorkflowDefinition("run_retrieval_eval", (
    Step("policy-check", "PolicyGuard",
         lambda ctx, _p: policy_guard(ctx, {"operation": "run_retrieval_eval", **ctx["input"]})),
    Step("run-evaluation", "RetrievalEvaluator", _eval_step),
))

ROTATE_PROFILE_VERSION = WorkflowDefinition("rotate_profile_version", (
    Step("policy-check", "PolicyGuard",
         lambda ctx, _p: policy_guard(ctx, {"operation": "rotate_profile_version", **ctx["input"]})),
    Step("approval-gate", "ApprovalGate", lambda ctx, _p: approval_gate(ctx, {
        "requiresApproval": ctx["approvalRequired"],
        "operation": "rotate_profile_version",
        "profileId": ctx.get("profileId", UNDEFINED),
        "newVersion": ctx["input"].get("newVersion", UNDEFINED),
        "affectedTenants": ctx["input"].get("tenantIds", UNDEFINED),
    })),
    # The original returns this record without an `output` wrapper; the runner stores it as-is.
    Step("activate-version", "PolicyGuard", lambda ctx, _p: {
        "activated": True,
        "profileId": ctx.get("profileId", UNDEFINED),
        "previousVersion": ctx["input"].get("previousVersion", UNDEFINED),
        "newVersion": ctx["input"].get("newVersion", UNDEFINED),
        "activatedAt": iso_now(),
        "tenantIds": ctx["input"].get("tenantIds", UNDEFINED),
    }),
))


# ─── State machine ───────────────────────────────────────────────────────────


@dataclass
class WorkflowRunResult:
    workflow_id: str
    kind: str
    status: str
    completed_steps: list[Record]
    approval_request_id: str | None = None
    final_output: Record = field(default_factory=dict)


class WorkflowStateMachine:
    def __init__(self, definition: WorkflowDefinition) -> None:
        self.definition = definition

    def run(self, ctx: Record, checkpoint_store: CheckpointStore, approval_store: ApprovalStore,
            audit_emitter: AuditEmitter | None = None) -> WorkflowRunResult:
        kind = self.definition.kind
        workflow_id = ctx["workflowId"]
        started = time.monotonic()
        checkpoint = checkpoint_store.load(workflow_id)
        start_index = 0
        completed: list[Record] = []

        if checkpoint is not None:
            start_index = checkpoint["currentStepIndex"]
            completed = list(checkpoint.get("completedSteps", []))
            approval_id = checkpoint.get("approvalRequestId", UNDEFINED)
            if checkpoint.get("status") == "waiting_approval" and js_truthy(approval_id):
                approval = approval_store.get(approval_id)
                if approval is None:
                    raise LookupError(
                        f"Workflow {workflow_id} is waiting for approval {approval_id} "
                        "but the approval record was not found."
                    )
                decision = approval.get("decision", UNDEFINED)
                if decision == "pending":
                    return WorkflowRunResult(workflow_id, kind, "waiting_approval", completed, approval_id,
                                             {"awaiting": "approval"})
                if decision == "rejected":
                    self._save(checkpoint_store, ctx, "rejected", start_index, completed,
                               checkpoint.get("context", {}))
                    self._audit(audit_emitter, ctx, outcome="rejected", details={"approvalId": approval_id})
                    return WorkflowRunResult(workflow_id, kind, "rejected", completed, approval_id,
                                             {"rejection": "operator rejected"})
                start_index = checkpoint["currentStepIndex"] + 1  # approved: resume after the gate
        else:
            checkpoint = self._initial(ctx)
            checkpoint_store.save(checkpoint)

        accumulated: Record = js_spread(checkpoint.get("context", {}))

        for index in range(start_index, len(self.definition.steps)):
            step = self.definition.steps[index]
            started_at = iso_now()
            self._save(checkpoint_store, ctx, "running", index, completed, accumulated)
            self._audit(audit_emitter, ctx, step=step, outcome="success", details={"phase": "step_start"})
            try:
                step_ctx = {**ctx, "input": {**js_spread(ctx["input"]), **accumulated}}
                result = step.execute(step_ctx, completed)
                inner = result.get("output", UNDEFINED)
                flat = inner if isinstance(inner, (dict, list)) else result

                if result.get("requiresApproval") is True and ctx["approvalRequired"]:
                    request = create_approval_request(workflow_id, f"{kind}.{step.step_id}",
                                                      js_or_default(result.get("approvalContext", UNDEFINED), {}))
                    approval_store.create(request)
                    completed.append({"stepId": step.step_id, "actor": step.actor, "status": "waiting",
                                      "startedAt": started_at, "completedAt": iso_now(), "output": flat})
                    self._save(checkpoint_store, ctx, "waiting_approval", index, completed, accumulated,
                               request["approvalId"])
                    self._audit(audit_emitter, ctx, step=step, outcome="approval_requested",
                                details={"approvalId": request["approvalId"]})
                    return WorkflowRunResult(workflow_id, kind, "waiting_approval", completed,
                                             request["approvalId"],
                                             {"awaiting": "approval", "approvalId": request["approvalId"]})

                step_result = {"stepId": step.step_id, "actor": step.actor, "status": "success",
                               "startedAt": started_at, "completedAt": iso_now(), "output": flat}
                accumulated = {**accumulated, **js_spread(flat)}
                self._audit(audit_emitter, ctx, step=step, outcome="success", details={"output": result})
            except Exception as error:  # noqa: BLE001 - a failing step fails the workflow, as in the original
                completed.append({"stepId": step.step_id, "actor": step.actor, "status": "failed",
                                  "startedAt": started_at, "completedAt": iso_now(), "output": {},
                                  "error": str(error.args[0]) if error.args else str(error)})
                self._save(checkpoint_store, ctx, "failed", index, completed, accumulated)
                self._audit(audit_emitter, ctx, step=step, outcome="failure",
                            details={"error": completed[-1]["error"]})
                return WorkflowRunResult(workflow_id, kind, "failed", completed, None, accumulated)
            completed.append(step_result)

        self._save(checkpoint_store, ctx, "completed", len(self.definition.steps), completed, accumulated)
        checkpoint_store.delete(workflow_id)
        self._audit(audit_emitter, ctx, outcome="success", details={
            "totalSteps": len(completed), "durationMs": int((time.monotonic() - started) * 1000)})
        return WorkflowRunResult(workflow_id, kind, "completed", completed, None, accumulated)

    def _initial(self, ctx: Record) -> Record:
        now = iso_now()
        return {
            "workflowId": ctx["workflowId"], "tenantId": ctx["tenantId"], "kind": self.definition.kind,
            "currentStepIndex": 0, "totalSteps": len(self.definition.steps), "status": "pending",
            "completedSteps": [], "context": ctx["input"], "createdAt": now, "updatedAt": now,
        }

    def _save(self, store: CheckpointStore, ctx: Record, status: str, index: int, completed: list[Record],
              context: Record, approval_request_id: str | None = None) -> None:
        current = store.load(ctx["workflowId"]) or self._initial(ctx)
        store.save({
            **current, "status": status, "currentStepIndex": index, "completedSteps": list(completed),
            "context": context, "updatedAt": iso_now(),
            **({"approvalRequestId": approval_request_id} if approval_request_id is not None else {}),
        })

    def _audit(self, emitter: AuditEmitter | None, ctx: Record, *, outcome: str, details: Record,
               step: Step | None = None) -> None:
        if emitter is None:
            return
        emitter({
            "auditId": f"aud-{now_ms()}-{short_random()}",
            "workflowId": ctx["workflowId"],
            "kind": self.definition.kind,
            **({"stepId": step.step_id, "actor": step.actor} if step is not None else {}),
            "tenantId": ctx["tenantId"],
            **({"profileId": ctx["profileId"]} if ctx.get("profileId", UNDEFINED) is not UNDEFINED else {}),
            "occurredAt": iso_now(),
            "outcome": outcome,
            "details": details,
        })


WORKFLOWS: dict[str, WorkflowDefinition] = {
    "ingest_document": ingest_document_workflow(),
    "rebuild_index": REBUILD_INDEX,
    "verify_index_health": VERIFY_INDEX_HEALTH,
    "run_retrieval_eval": RUN_RETRIEVAL_EVAL,
    "rotate_profile_version": ROTATE_PROFILE_VERSION,
}


def create_workflow_machine(kind: str) -> WorkflowStateMachine:
    definition = WORKFLOWS.get(kind)
    if definition is None:
        raise LookupError(f"Unknown workflow kind: {kind}")
    return WorkflowStateMachine(definition)
