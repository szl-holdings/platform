# Platform Hatun receipt-chain gate proof packet

**Workcell:** `PLATFORM-HATUN-CHAIN-GATE-20261102`

**Base revision:** `dca2db629a2d10ecfe27343f1e24843e4f25acd3` (`main`)

**Evidence class:** local source candidate

## Trigger and prior behavior

`packages/hatun-mcp/hatun_mcp/server.py` awaited the supplied backend coroutine
before calling `KHIPU.verify()`. If an existing receipt had been corrupted, a
state-changing backend could run before tripwire `T01` was calculated.
`KhipuChain.emit()` then set `chain_verified=True` without consulting the chain.

## Candidate behavior

- `KhipuChain.verify()` now serializes verification with append and read
  operations.
- `emit()` verifies under the same lock, records the real pre-append state, and
  includes `chain_verified` in the continuum-hash packet and DSSE payload.
- `governed()` verifies before any backend await. An invalid chain returns a
  receipted `declined` response with reason `receipt_chain_invalid`, tripwire
  `T01`, zero PURIQ utility from the Khipu factor, and an honestly false
  `chain_verified` field.
- The unawaited backend coroutine is explicitly closed on the decline path.

## Verification

| Command | Result |
|---|---|
| `python -m pytest packages/hatun-mcp/tests -q` with `PYTHONPATH=packages/hatun-mcp` | PASS: `3 passed` |
| `python -m py_compile` for the two modified modules and regression test | PASS |
| `git diff --check` | PASS |
| Baseline `pnpm typecheck` | BLOCKED: `pnpm` is unavailable in the execution environment |
| Direct `import hatun_mcp.server` without a test stub | BLOCKED: `ModuleNotFoundError: mcp` |

The new regression mutates an existing continuum hash, then proves both that a
subsequent receipt reports `chain_verified=false` and that a fully authenticated,
two-person, state-changing call returns before entering its backend coroutine.
The test supplies only import-time MCP decorators because this package currently
declares `dependencies=[]`; it does not start a server or fake backend behavior.

No UI surface changed, so screenshot evidence is not applicable.

## Remaining boundaries

- `packages/hatun-mcp/README.md` identifies this package as a non-canonical copy.
  The separate canonical `szl-holdings/hatun-mcp` source and any deployed runtime
  were not changed or verified.
- The receipt chain remains process-local, mutable by a process controller, and
  neither durable nor independently witnessed.
- The package still omits its imported MCP SDK and HTTP client dependencies from
  `pyproject.toml`; runtime installation is not qualified by this patch.
- Hosted checks, protected admission, signatures from a provisioned key, and
  external readback remain required before an operational claim.
