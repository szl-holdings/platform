# `@szl/mcp-governor`

Fail-closed governance primitives for MCP tool execution.

The package supplies:

- model-independent Ed25519 capability tokens scoped to an actor, tenant,
  tool set, risk ceiling, validity window, and one-use token ID;
- a canonical governed-action envelope that carries argument digests rather
  than raw secrets;
- mandatory policy evaluation that converts evaluator errors or malformed
  decisions into blocks while allowing policy to inspect raw arguments;
- signed `before` and `after` receipts around state-changing effects;
- signed `blocked` receipts for denied actions;
- a read-only invariant that forbids a `read_only` action from claiming a state
  mutation; and
- a replaceable replay store for multi-instance deployments.

Raw arguments are visible only to the in-process policy evaluator. Receipts
persist their SHA-256 digest, never the raw argument payload.

`private: false` makes the workspace package publication-ready. This repository
does not claim that an external npm publication occurred.
