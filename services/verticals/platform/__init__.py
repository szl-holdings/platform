"""Platform / AgentOps vertical pack — Source Of Truth.

Reference vertical pack #1 for the Alloy Meridian substrate.

Signals come from repo-internal sources: build/test/lint/audit results,
MCP registry health, and drift reports. No network access required.

At least one recommendation exercises the human-approval path (``requires_human_approval=True``).
"""
