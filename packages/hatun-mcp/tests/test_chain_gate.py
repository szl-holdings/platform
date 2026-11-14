from __future__ import annotations

import sys
import types

from hatun_mcp.governance import ClientRegistry, DsseSigner, KhipuChain


def _emit(chain: KhipuChain, *, operation_id: str):
    return chain.emit(
        tool="test_tool",
        client_id="client-1",
        operation_id=operation_id,
        status="success",
        tripwire=None,
        yuyay_min_axis=0.97,
        hatun_mcp_factor=0.7,
        puriq_score=0.7,
        detail={"test": True},
    )


def _install_mcp_import_stub() -> None:
    """Provide only the decorators needed to import the offline server module."""

    try:
        __import__("mcp.server.fastmcp")
        return
    except ModuleNotFoundError:
        pass

    class FastMCP:
        def __init__(self, *args, **kwargs):
            pass

        def tool(self, *args, **kwargs):
            return lambda function: function

        def resource(self, *args, **kwargs):
            return lambda function: function

        def run(self):  # pragma: no cover - import contract only
            raise AssertionError("the import stub must never start a server")

    class TransportSecuritySettings:
        def __init__(self, **kwargs):
            self.options = kwargs

    mcp_module = types.ModuleType("mcp")
    server_module = types.ModuleType("mcp.server")
    fastmcp_module = types.ModuleType("mcp.server.fastmcp")
    transport_module = types.ModuleType("mcp.server.transport_security")
    fastmcp_module.FastMCP = FastMCP
    transport_module.TransportSecuritySettings = TransportSecuritySettings
    mcp_module.server = server_module
    server_module.fastmcp = fastmcp_module
    server_module.transport_security = transport_module
    sys.modules["mcp"] = mcp_module
    sys.modules["mcp.server"] = server_module
    sys.modules["mcp.server.fastmcp"] = fastmcp_module
    sys.modules["mcp.server.transport_security"] = transport_module


def test_emit_reports_actual_pre_append_chain_state() -> None:
    chain = KhipuChain()
    first = _emit(chain, operation_id="first")
    assert first.chain_verified is True
    assert chain.verify() is True

    first.chain_verified = False
    assert chain.verify() is False
    first.chain_verified = True
    assert chain.verify() is True

    first.continuum_hash = "f" * 64
    assert chain.verify() is False

    after_tamper = _emit(chain, operation_id="after-tamper")
    assert after_tamper.chain_verified is False
    assert chain.verify() is False


def test_corrupt_chain_declines_before_state_changing_backend(monkeypatch) -> None:
    _install_mcp_import_stub()
    from hatun_mcp import server

    chain = KhipuChain()
    first = _emit(chain, operation_id="first")
    first.continuum_hash = "f" * 64
    assert chain.verify() is False

    monkeypatch.setattr(server, "KHIPU", chain)
    monkeypatch.setattr(server, "SIGNER", DsseSigner())
    monkeypatch.setattr(server, "CLIENTS", ClientRegistry())
    context_tokens = (
        (server._ctx_client, server._ctx_client.set("client-1")),
        (server._ctx_scope, server._ctx_scope.set("admin")),
        (server._ctx_sovereign, server._ctx_sovereign.set(False)),
        (server._ctx_second_approver, server._ctx_second_approver.set("client-2")),
    )

    backend_calls: list[str] = []

    async def backend() -> dict[str, bool]:
        backend_calls.append("entered")
        return {"deployed": True}

    try:
        governed_call = server.governed(
            tool="test_state_change",
            operation_id="test.write",
            gate_text="bounded authorized test",
            needs_scope="write",
            state_changing=True,
            backend_coro=backend(),
        )
        try:
            governed_call.send(None)
        except StopIteration as completed:
            response = completed.value
        else:  # pragma: no cover - a corrupt chain must return before any await
            raise AssertionError("governed call reached its backend await")
    finally:
        for context_var, token in reversed(context_tokens):
            context_var.reset(token)

    assert backend_calls == []
    assert response["status"] == "declined"
    assert response["gate_transparency"]["reason"] == "receipt_chain_invalid"
    assert response["khipu_receipt"]["tripwire"] == "T01"
    assert response["khipu_receipt"]["chain_verified"] is False
