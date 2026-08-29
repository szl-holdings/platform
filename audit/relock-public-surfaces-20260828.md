# Public-surface current-main relock

- Requested: 2026-08-28
- Source authority: the exact protected `main` produced by protected squash merge of this PR
- Public surfaces: the source-bound SZL/A11oy web deployments, including `a-11-oy.com` and `a11oy.net` wherever this repository is the configured deployment owner

This audit-only receipt creates one protected-main promotion edge after the current platform PR convergence. It changes no application code, route, workflow, secret, ruleset, provider, domain, or infrastructure configuration.

Completion requires the configured deployment system to consume the exact merged source and live readback to prove valid TLS, expected public routes, current build identity, responsive delivery, and truthful readiness. A merge alone is not a deployment-success claim.
