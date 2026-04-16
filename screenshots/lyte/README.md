# Lyte Command Center Screenshots

**App**: Lyte — Business Observability Platform
**Status**: Not captured

## Platform Constraint

The Lyte Command Center Vite server requires port 19291 to be alive for the Replit workflow health check (OPENED_A_PORT). When Lyte is launched as a gateway sub-process (shared port 9090 + own port 19291), the platform kills the process on health-check failure.

Lyte is accessible in development by running it as the primary workflow, but cannot be screenshot concurrently with other gateway-sharing apps.

## App Screens Available

Access at `/lyte-command-center/` when running standalone:
- Marketing home
- Platform Pulse dashboard
- Blocker Board
- Performance Intelligence
