"""HTTP surface of the ingestion control service: a Python port of `src/server.ts`.

Routes, status codes, JSON bodies, headers that callers rely on (`Retry-After`), checkpoint
and approval files, and the per-step log lines match the Express service. Express routing
rules are kept too: paths match case-insensitively with an optional trailing slash, OPTIONS
is answered from the registered methods, and unknown routes return an HTML 404. Request
bodies follow `express.json({ limit: '20mb' })`: parsed only when a body is present and the
type is `application/json`, strict top-level object or array, empty body as `{}`.

Known differences are listed in ../README.md (validation `issues` text, HTML error pages).
Production stays on HOLD exactly as in the original.
"""

from __future__ import annotations

import hmac
import html
import math
import os
import re
import sys
import time
import uuid
from collections.abc import Awaitable, Callable, Mapping
from typing import Any
from urllib.parse import unquote

from fastapi import FastAPI, Request
from fastapi.responses import Response

from .contracts import (
    EvalRunRequest,
    IndexRebuildRequest,
    IndexVerifyRequest,
    IngestRequest,
    is_production_runtime,
    safe_parse,
)
from .jscompat import JS_NON_WS, JS_WS, UNDEFINED, iso_now, js_or_default, js_trim, js_truthy, parse_json, stringify
from .workflow_runtime import FileApprovalStore, FileCheckpointStore, create_workflow_machine

SERVICE = "alloy-fabric-ingest-control"
_BODY_LIMIT = 20 * 1024 * 1024  # express.json({ limit: '20mb' })
_BEARER = re.compile(rf"Bearer{JS_WS}+({JS_NON_WS}+)", re.IGNORECASE)
_PROCESS_STARTED = time.monotonic()

PRODUCTION_HOLDS = (
    "Checkpoint and approval state use a single-process JSON file store without durable transactional guarantees.",
    "No qualified evidence ledger is wired to prove workflow side effects.",
    "No tenant-scoped durable workflow backend is available.",
)


class _Reply(Exception):
    """Ends the middleware chain with a response, like `res.status(...).json(...)` without `next()`."""

    def __init__(self, response: Response) -> None:
        self.response = response


def _json(status: int, payload: Any, headers: Mapping[str, str] | None = None) -> Response:
    return Response(stringify(payload), status_code=status, headers=dict(headers or {}),
                    media_type="application/json; charset=utf-8")


def _html_error(status: int, message: str) -> Response:
    # Shape of Express's finalhandler page; the original also embeds stack traces outside production.
    page = ("<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<title>Error</title>\n"
            f"</head>\n<body>\n<pre>{html.escape(message, quote=False)}</pre>\n</body>\n</html>\n")
    return Response(page, status_code=status, media_type="text/html; charset=utf-8",
                    headers={"Content-Security-Policy": "default-src 'none'", "X-Content-Type-Options": "nosniff"})


def _production_unavailable() -> dict[str, Any]:
    return {"ready": False, "status": "HOLD", "code": "INGEST_CONTROL_PRODUCTION_UNAVAILABLE",
            "evidenceState": "UNAVAILABLE", "holds": list(PRODUCTION_HOLDS)}


def _checkpoint_tenant(checkpoint: Any) -> str | None:
    tenant = checkpoint.get("tenantId") if isinstance(checkpoint, dict) else None
    return tenant if isinstance(tenant, str) and tenant else None


def _member(body: Any, key: str) -> Any:
    """Destructuring `const { key } = req.body`: an absent body throws, a non-object yields undefined."""
    if body is UNDEFINED or body is None:
        raise TypeError(f"Cannot destructure property '{key}' of 'req.body' as it is undefined.")
    return body.get(key, UNDEFINED) if isinstance(body, dict) else UNDEFINED


async def _read_body(request: Request) -> Any:
    headers = request.headers
    if "content-length" not in headers and "transfer-encoding" not in headers:
        return UNDEFINED  # body-parser skips requests without a body
    content_type = headers.get("content-type", "")
    media_type, _, params = content_type.partition(";")
    if media_type.strip().lower() != "application/json":
        return UNDEFINED
    charset_match = re.search(r"charset\s*=\s*\"?([^\";\s]+)", params, re.IGNORECASE)
    charset = charset_match.group(1).lower() if charset_match else "utf-8"
    if not charset.startswith("utf-"):
        raise _Reply(_html_error(415, "UnsupportedMediaTypeError: unsupported charset"))
    if headers.get("content-encoding", "identity").lower() != "identity":
        raise _Reply(_html_error(415, "UnsupportedMediaTypeError: unsupported content encoding"))
    declared = headers.get("content-length")
    if declared is not None and declared.isdigit() and int(declared) > _BODY_LIMIT:
        raise _Reply(_html_error(413, "PayloadTooLargeError: request entity too large"))
    raw = await request.body()
    if len(raw) > _BODY_LIMIT:
        raise _Reply(_html_error(413, "PayloadTooLargeError: request entity too large"))
    if not raw:
        return {}
    try:
        text = raw.decode(charset)
    except (LookupError, UnicodeDecodeError):
        raise _Reply(_html_error(400, "BadRequestError: invalid body encoding")) from None
    first = re.match(r"[\x20\x09\x0a\x0d]*([^\x20\x09\x0a\x0d])", text)
    if first is None or first.group(1) not in "{[":
        raise _Reply(_html_error(400, "SyntaxError: Unexpected token in JSON"))
    try:
        return parse_json(text)
    except (ValueError, RecursionError):
        raise _Reply(_html_error(400, "SyntaxError: Unexpected token in JSON")) from None


Handler = Callable[["_Exchange"], Awaitable[Response]]


class _Exchange:
    """Per-request state: the parsed body, route params and the credential tenant binding."""

    def __init__(self, request: Request, params: dict[str, str]) -> None:
        self.request = request
        self.params = params
        self.body: Any = UNDEFINED
        self.credential_tenant: str | None = None


class IngestControlService:
    def __init__(self, env: Mapping[str, str]) -> None:
        data_dir = env.get("AEF_DATA_DIR", "/tmp/aef-ingest-control")
        self.checkpoints = FileCheckpointStore(f"{data_dir}/checkpoints.json")
        self.approvals = FileApprovalStore(f"{data_dir}/approvals.json")
        self.is_production = is_production_runtime(env, ["AEF_ENV", "AEF_INGEST_CONTROL_ENV"])
        secret = env.get("AEF_S2S_SECRET")
        self.bearer = js_trim(secret) if secret is not None else ""
        if not self.bearer:
            raise RuntimeError("AEF_S2S_SECRET env var is required — refusing to start without an auth secret")
        tenant = env.get("AEF_S2S_TENANT_ID")
        self.credential_tenant = js_trim(tenant) if tenant is not None else None
        if self.is_production and not self.credential_tenant:
            raise RuntimeError(
                "AEF_S2S_TENANT_ID is required in production — refusing to start without a credential tenant binding"
            )

    # ─── middleware ──────────────────────────────────────────────────────────

    def auth(self, ex: _Exchange) -> None:
        match = _BEARER.fullmatch(ex.request.headers.get("authorization", ""))
        token = match.group(1) if match else ""
        if not token or not hmac.compare_digest(token.encode("utf-8"), self.bearer.encode("utf-8")):
            raise _Reply(_json(401, {"error": "unauthorized"}))
        ex.credential_tenant = self.credential_tenant

    def tenant_body(self, ex: _Exchange) -> None:
        raw = ex.body.get("tenantId", UNDEFINED) if isinstance(ex.body, dict) else UNDEFINED
        requested = js_trim(raw) if isinstance(raw, str) else None
        if isinstance(raw, str) and requested == "":
            raise _Reply(_json(400, {"error": "invalid_tenant_id"}))
        if ex.credential_tenant and requested and requested != ex.credential_tenant:
            raise _Reply(_json(403, {"error": "credential_tenant_mismatch"}))
        if requested:
            ex.body["tenantId"] = requested

    def workflow_owner(self, ex: _Exchange) -> None:
        workflow_id = ex.params.get("workflowId")
        if not ex.credential_tenant or not workflow_id:
            return
        checkpoint = self.checkpoints.load(workflow_id)
        if checkpoint is None or _checkpoint_tenant(checkpoint) != ex.credential_tenant:
            raise _Reply(_json(404, {"error": "workflow_not_found", "workflowId": workflow_id}))

    def approval_owner(self, ex: _Exchange) -> None:
        approval_id = ex.params.get("approvalId")
        if not ex.credential_tenant or not approval_id:
            return
        approval = self.approvals.get(approval_id)
        checkpoint = self.checkpoints.load(approval["workflowId"]) if approval else None
        if approval is None or checkpoint is None or _checkpoint_tenant(checkpoint) != ex.credential_tenant:
            raise _Reply(_json(404, {"error": "approval_not_found", "approvalId": approval_id}))

    def production_hold(self, _ex: _Exchange) -> None:
        if self.is_production:
            raise _Reply(_json(503, _production_unavailable(), {"Retry-After": "60"}))

    @staticmethod
    def _step_logger(workflow_id: str) -> Callable[[dict[str, Any]], None]:
        def emit(event: dict[str, Any]) -> None:
            sys.stdout.write(stringify({
                "level": "info", "ts": iso_now(), "service": SERVICE, "msg": "workflow_step",
                "workflowId": workflow_id, "stepId": event.get("stepId", UNDEFINED), "outcome": event["outcome"],
            }) + "\n")
            sys.stdout.flush()
        return emit

    def _run(self, kind: str, ctx: dict[str, Any]):
        return create_workflow_machine(kind).run(ctx, self.checkpoints, self.approvals,
                                                 self._step_logger(ctx["workflowId"]))

    # ─── handlers ────────────────────────────────────────────────────────────

    async def health(self, _ex: _Exchange) -> Response:
        return _json(200, {"status": "alive", "service": SERVICE, "productionReady": not self.is_production,
                           "uptimeSeconds": math.floor(time.monotonic() - _PROCESS_STARTED)})

    async def healthz(self, _ex: _Exchange) -> Response:
        return _json(200, {"status": "alive", "productionReady": not self.is_production})

    async def readyz(self, _ex: _Exchange) -> Response:
        if self.is_production:
            return _json(503, _production_unavailable(), {"Retry-After": "60"})
        return _json(200, {"ready": True, "status": "development-only"})

    async def ingest(self, ex: _Exchange) -> Response:
        parsed, issues = safe_parse(IngestRequest, ex.body)
        if parsed is None:
            return _json(400, {"error": "validation_error", "issues": issues})
        results = []
        for doc in parsed.documents:
            workflow_id = f"ingest-{uuid.uuid4()}"
            ctx = {"workflowId": workflow_id, "tenantId": parsed.tenantId, "requestedBy": parsed.requestId,
                   "input": {"sourceId": doc.sourceId, "content": doc.content, "contentType": doc.contentType,
                             "chunkSize": parsed.chunkSize, "chunkOverlap": parsed.chunkOverlap,
                             "metadata": doc.metadata},
                   "approvalRequired": False}
            result = self._run("ingest_document", ctx)
            results.append({"workflowId": workflow_id, "sourceId": doc.sourceId, "status": result.status})
        return _json(202, {"requestId": parsed.requestId, "tenantId": parsed.tenantId, "results": results})

    async def rebuild(self, ex: _Exchange) -> Response:
        parsed, issues = safe_parse(IndexRebuildRequest, ex.body)
        if parsed is None:
            return _json(400, {"error": "validation_error", "issues": issues})
        workflow_id = f"rebuild-{uuid.uuid4()}"
        source_ids = {"sourceIds": parsed.sourceIds} if js_truthy(parsed.sourceIds) else {}
        ctx = {"workflowId": workflow_id, "tenantId": parsed.tenantId, "requestedBy": parsed.requestId,
               "input": {"fullRebuild": parsed.fullRebuild, **source_ids}, "approvalRequired": parsed.fullRebuild}
        result = self._run("rebuild_index", ctx)
        return _json(202 if result.status == "waiting_approval" else 200, {
            "requestId": parsed.requestId, "tenantId": parsed.tenantId, "workflowId": workflow_id,
            "status": result.status, "approvalRequestId": result.approval_request_id})

    async def verify(self, ex: _Exchange) -> Response:
        parsed, issues = safe_parse(IndexVerifyRequest, ex.body)
        if parsed is None:
            return _json(400, {"error": "validation_error", "issues": issues})
        workflow_id = f"verify-{uuid.uuid4()}"
        ctx = {"workflowId": workflow_id, "tenantId": parsed.tenantId, "requestedBy": parsed.requestId,
               "input": {"sourceIds": parsed.sourceIds}, "approvalRequired": False}
        result = self._run("verify_index_health", ctx)
        return _json(200, {"requestId": parsed.requestId, "tenantId": parsed.tenantId, "workflowId": workflow_id,
                           "status": result.status, "steps": len(result.completed_steps)})

    async def eval(self, ex: _Exchange) -> Response:
        parsed, issues = safe_parse(EvalRunRequest, ex.body)
        if parsed is None:
            return _json(400, {"error": "validation_error", "issues": issues})
        workflow_id = f"eval-{uuid.uuid4()}"
        # As in the original, `queries` is validated but not passed on, so the evaluation step reports "skipped".
        ctx = {"workflowId": workflow_id, "tenantId": parsed.tenantId, "requestedBy": parsed.requestId,
               "input": {"profileId": parsed.profileId, "datasetId": parsed.datasetId}, "approvalRequired": False}
        result = self._run("run_retrieval_eval", ctx)
        return _json(200, {"requestId": parsed.requestId, "tenantId": parsed.tenantId, "workflowId": workflow_id,
                           "status": result.status})

    async def rotate_profile(self, ex: _Exchange) -> Response:
        request_id, tenant_id = _member(ex.body, "requestId"), _member(ex.body, "tenantId")
        profile_id, target_version = _member(ex.body, "profileId"), _member(ex.body, "targetVersion")
        if not js_truthy(tenant_id) or not js_truthy(profile_id):
            return _json(400, {"error": "validation_error", "message": "tenantId and profileId are required"})
        req_id = js_or_default(request_id, str(uuid.uuid4()))
        workflow_id = f"rotate-{uuid.uuid4()}"
        # The workflow reads `newVersion`, not `targetVersion`; kept as-is for parity with the original.
        version = {"targetVersion": target_version} if js_truthy(target_version) else {}
        ctx = {"workflowId": workflow_id, "tenantId": tenant_id, "requestedBy": req_id,
               "input": {"profileId": profile_id, **version}, "approvalRequired": True}
        result = self._run("rotate_profile_version", ctx)
        return _json(202 if result.status == "waiting_approval" else 200, {
            "requestId": req_id, "tenantId": tenant_id, "workflowId": workflow_id, "profileId": profile_id,
            "status": result.status, "approvalRequestId": result.approval_request_id})

    async def resume(self, ex: _Exchange) -> Response:
        workflow_id = ex.params["workflowId"]
        request_id, tenant_id = _member(ex.body, "requestId"), _member(ex.body, "tenantId")
        resume_input = _member(ex.body, "input")
        if not js_truthy(tenant_id):
            return _json(400, {"error": "validation_error", "message": "tenantId is required"})
        checkpoint = self.checkpoints.load(workflow_id)
        if checkpoint is None:
            return _json(404, {"error": "workflow_not_found", "workflowId": workflow_id})
        if checkpoint.get("status") != "waiting_approval":
            return _json(409, {"error": "workflow_not_paused", "workflowId": workflow_id,
                               "status": checkpoint.get("status", UNDEFINED)})
        req_id = js_or_default(request_id, str(uuid.uuid4()))
        tenant = _checkpoint_tenant(checkpoint)
        ctx = {"workflowId": workflow_id, "tenantId": tenant if tenant is not None else tenant_id,
               "requestedBy": req_id, "input": js_or_default(resume_input, {}), "approvalRequired": False}
        result = self._run(checkpoint.get("kind"), ctx)
        return _json(200, {"requestId": req_id, "workflowId": workflow_id, "status": result.status,
                           "completedSteps": len(result.completed_steps), "resumedAt": iso_now()})

    async def resolve_approval(self, ex: _Exchange) -> Response:
        approval_id = ex.params["approvalId"]
        decision, resolved_by = _member(ex.body, "decision"), _member(ex.body, "resolvedBy")
        comment = _member(ex.body, "comment")
        try:
            self.approvals.resolve(approval_id, decision, resolved_by, comment)
        except (KeyError, ValueError):
            return _json(404, {"error": "approval_not_found", "approvalId": approval_id})
        return _json(200, {"approvalId": approval_id, "decision": decision, "resolvedAt": iso_now()})

    async def list_approvals(self, ex: _Exchange) -> Response:
        workflow_id = ex.params["workflowId"]
        return _json(200, {"workflowId": workflow_id, "approvals": self.approvals.list(workflow_id)})


def _route(path: str) -> re.Pattern[str]:
    """Express path matching: case-insensitive, optional trailing slash, `:param` is one segment."""
    pattern = re.sub(r":(\w+)", r"(?P<\1>[^/]+)", re.escape(path).replace(r"\:", ":"))
    return re.compile(f"{pattern}/?", re.IGNORECASE)


def create_app(env: Mapping[str, str] | None = None) -> FastAPI:
    service = IngestControlService(os.environ if env is None else env)
    s = service
    common = [s.auth, s.tenant_body, s.production_hold]
    routes: list[tuple[str, re.Pattern[str], list[Callable[[_Exchange], None]], Handler]] = [
        ("GET", _route("/health"), [], s.health),
        ("GET", _route("/healthz"), [], s.healthz),
        ("GET", _route("/readyz"), [], s.readyz),
        ("POST", _route("/control/ingest"), common, s.ingest),
        ("POST", _route("/control/rebuild"), common, s.rebuild),
        ("POST", _route("/control/verify"), common, s.verify),
        ("POST", _route("/control/eval"), common, s.eval),
        ("POST", _route("/control/rotate-profile"), common, s.rotate_profile),
        ("POST", _route("/control/workflows/:workflowId/resume"),
         [s.auth, s.tenant_body, s.workflow_owner, s.production_hold], s.resume),
        ("POST", _route("/control/approvals/:approvalId/resolve"),
         [s.auth, s.approval_owner, s.production_hold], s.resolve_approval),
        ("GET", _route("/control/approvals/:workflowId"), [s.auth, s.workflow_owner, s.production_hold],
         s.list_approvals),
    ]

    app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None, title=SERVICE)
    app.state.service = service

    async def dispatch(request: Request, full_path: str = "") -> Response:
        # Express matches the raw path and decodes params afterwards, so `%2F` stays inside one param.
        raw_path = request.scope.get("raw_path")
        path = raw_path.decode("latin-1") if raw_path else request.url.path
        method = request.method.upper()
        try:
            body = await _read_body(request)  # app.use(express.json()) runs before any route
        except _Reply as reply:
            return reply.response
        matched = [(m, r.fullmatch(path), mw, h) for m, r, mw, h in routes]
        matched = [entry for entry in matched if entry[1] is not None]
        lookup = "GET" if method == "HEAD" else method
        for route_method, match, middleware, handler in matched:
            if route_method != lookup:
                continue
            ex = _Exchange(request, {k: unquote(v) for k, v in match.groupdict().items()})
            ex.body = body
            try:
                for step in middleware:
                    step(ex)
                return await handler(ex)
            except _Reply as reply:
                return reply.response
            except Exception:  # noqa: BLE001 - Express answers an unhandled error with a 500 page
                return _html_error(500, "Internal Server Error")
        if method == "OPTIONS" and matched:
            allowed = []
            for route_method, *_ in matched:
                for name in (route_method, "HEAD") if route_method == "GET" else (route_method,):
                    if name not in allowed:
                        allowed.append(name)
            text = ", ".join(allowed)
            return Response(text, status_code=200, media_type="text/plain; charset=utf-8", headers={"Allow": text})
        return _html_error(404, f"Cannot {method} {path}")

    app.add_api_route("/{full_path:path}", dispatch, include_in_schema=False,
                      methods=["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
    return app
