"""Early authentication and request-size admission for the Ovis HTTP boundary."""

from __future__ import annotations

from fastapi import HTTPException
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from .ovis_omni import _require_internal_auth


MAX_OVIS_REQUEST_BODY_BYTES = 10 * 1024 * 1024
_OVIS_PATH_PREFIX = "/aef/ovis/"


class OvisBoundaryMiddleware:
    """Reject unauthorized or oversized Ovis traffic before JSON parsing."""

    def __init__(
        self,
        app: ASGIApp,
        max_body_bytes: int = MAX_OVIS_REQUEST_BODY_BYTES,
    ) -> None:
        if max_body_bytes <= 0:
            raise ValueError("max_body_bytes must be positive")
        self.app = app
        self.max_body_bytes = max_body_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or not scope.get("path", "").startswith(
            _OVIS_PATH_PREFIX
        ):
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive=receive)
        try:
            _require_internal_auth(request)
        except HTTPException as error:
            response = JSONResponse(
                status_code=error.status_code,
                content={"detail": error.detail},
                headers=error.headers,
            )
            await response(scope, receive, send)
            return

        if scope.get("method") not in {"POST", "PUT", "PATCH"}:
            await self.app(scope, receive, send)
            return

        content_length = request.headers.get("content-length")
        if content_length is not None:
            try:
                declared_length = int(content_length)
            except ValueError:
                response = JSONResponse(
                    status_code=400,
                    content={"detail": "Invalid Content-Length"},
                )
                await response(scope, receive, send)
                return
            if declared_length < 0:
                response = JSONResponse(
                    status_code=400,
                    content={"detail": "Invalid Content-Length"},
                )
                await response(scope, receive, send)
                return
            if declared_length > self.max_body_bytes:
                response = JSONResponse(
                    status_code=413,
                    content={"detail": "Ovis request body exceeds the admitted size"},
                )
                await response(scope, receive, send)
                return

        body = bytearray()
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            if message["type"] != "http.request":
                continue
            body.extend(message.get("body", b""))
            if len(body) > self.max_body_bytes:
                response = JSONResponse(
                    status_code=413,
                    content={"detail": "Ovis request body exceeds the admitted size"},
                )
                await response(scope, receive, send)
                return
            if not message.get("more_body", False):
                break

        replayed = False

        async def replay_receive() -> Message:
            nonlocal replayed
            if not replayed:
                replayed = True
                return {
                    "type": "http.request",
                    "body": bytes(body),
                    "more_body": False,
                }
            return await receive()

        await self.app(scope, replay_receive, send)
