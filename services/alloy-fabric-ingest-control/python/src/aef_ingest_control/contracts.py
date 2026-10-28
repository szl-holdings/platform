"""Request contracts used by the ingestion control service.

Python mirror of the Zod schemas in `packages/aef-contracts` (ingest.ts, index-ops.ts,
evals.ts, tenant.ts) and of `isProductionRuntime` (runtime-environment.ts). Zod's rules are
kept: unknown members are stripped, optional members accept a missing key but not `null`,
integers must be safe JavaScript integers, and booleans or numeric strings are never coerced.
"""

from __future__ import annotations

import math
from collections.abc import Mapping, Sequence
from typing import Annotated, Any, Literal

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field, StrictBool, StrictStr, ValidationError

from .jscompat import UNDEFINED, js_trim, stringify

_MAX_SAFE_INTEGER = 2**53 - 1


def _safe_integer(value: Any) -> int:
    # z.number().int(): a finite JSON number with no fractional part, within the safe range.
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("Invalid input: expected number")
    if isinstance(value, float) and (not math.isfinite(value) or not value.is_integer()):
        raise ValueError("Invalid input: expected int, received number")
    if abs(value) > _MAX_SAFE_INTEGER:
        raise ValueError("Invalid input: expected int, received number")
    return int(value)


SafeInt = Annotated[int, BeforeValidator(_safe_integer)]
NonEmptyStr = Annotated[StrictStr, Field(min_length=1)]
Record = dict[StrictStr, Any]

# A field typed without `None` but defaulting to UNDEFINED behaves like `.optional()`:
# a missing key is accepted (pydantic does not validate defaults) and an explicit null fails.
_OPTIONAL = Field(default=UNDEFINED)


class _Contract(BaseModel):
    model_config = ConfigDict(extra="ignore", arbitrary_types_allowed=True)


class IngestDocument(_Contract):
    sourceId: NonEmptyStr
    sourceUri: StrictStr = _OPTIONAL
    title: StrictStr = _OPTIONAL
    content: NonEmptyStr
    contentType: Literal["text/plain", "text/markdown", "application/pdf", "text/html"] = "text/plain"
    metadata: Record = Field(default_factory=dict)
    profileId: StrictStr = _OPTIONAL


class IngestRequest(_Contract):
    requestId: NonEmptyStr
    tenantId: NonEmptyStr
    documents: Annotated[list[IngestDocument], Field(min_length=1, max_length=256)]
    chunkSize: Annotated[SafeInt, Field(gt=0)] = 512
    chunkOverlap: Annotated[SafeInt, Field(ge=0)] = 64
    model: StrictStr = _OPTIONAL
    metadata: Record = Field(default_factory=dict)


class IndexRebuildRequest(_Contract):
    requestId: NonEmptyStr
    tenantId: NonEmptyStr
    profileId: StrictStr = _OPTIONAL
    fullRebuild: StrictBool = False
    sourceIds: list[StrictStr] = _OPTIONAL
    metadata: Record = Field(default_factory=dict)


class IndexVerifyRequest(_Contract):
    requestId: NonEmptyStr
    tenantId: NonEmptyStr
    profileId: StrictStr = _OPTIONAL
    sourceIds: list[StrictStr] = _OPTIONAL


class EvalQuery(_Contract):
    queryId: StrictStr
    query: NonEmptyStr
    relevantChunkIds: Annotated[list[StrictStr], Field(min_length=1)]
    metadata: Record = Field(default_factory=dict)


class EvalRunRequest(_Contract):
    requestId: NonEmptyStr
    tenantId: NonEmptyStr
    profileId: StrictStr
    datasetId: StrictStr
    queries: Annotated[list[EvalQuery], Field(min_length=1)]
    topK: Annotated[SafeInt, Field(gt=0)] = 10
    metrics: list[Literal["ndcg", "recall", "precision", "mrr"]] = Field(
        default_factory=lambda: ["ndcg", "recall"]
    )
    metadata: Record = Field(default_factory=dict)


def validation_issues(error: ValidationError) -> list[dict[str, Any]]:
    """Issue list in Zod's shape (`code`, `path`, `message`). Messages are pydantic's, not Zod's."""
    return [
        {"code": issue["type"], "path": [part for part in issue["loc"]], "message": issue["msg"]}
        for issue in error.errors(include_url=False, include_context=False, include_input=False)
    ]


def safe_parse(model: type[_Contract], body: Any) -> tuple[_Contract | None, list[dict[str, Any]]]:
    """`schema.safeParse(body)`: the parsed model, or Zod-shaped issues."""
    try:
        return model.model_validate(body), []
    except ValidationError as error:
        return None, validation_issues(error)


_VALID_RUNTIME_MODES = ("local-dev", "internal-preview", "demo", "production")


def _normalized(value: str | None) -> str | None:
    if value is None:
        return None
    result = js_trim(value).lower()
    return result or None


def is_production_runtime(env: Mapping[str, str], service_marker_names: Sequence[str] = ()) -> bool:
    """Any production marker wins over conflicting development markers (fail toward HOLD)."""
    runtime_mode = _normalized(env.get("RUNTIME_MODE"))
    if runtime_mode and runtime_mode not in _VALID_RUNTIME_MODES:
        raise ValueError(
            f"Invalid RUNTIME_MODE {stringify(env.get('RUNTIME_MODE'))}; expected one of "
            + ", ".join(_VALID_RUNTIME_MODES)
        )
    names = ["RUNTIME_MODE", "APP_ENV", "NODE_ENV", "SZL_ENV", *service_marker_names]
    return any(_normalized(env.get(name)) in ("production", "prod") for name in names)
