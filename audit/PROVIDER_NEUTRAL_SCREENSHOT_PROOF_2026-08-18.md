# Provider-neutral screenshot proof migration

## Decision

Replit is no longer an available execution environment. Screenshot proof is now provider-neutral and exact-source-bound.

## Source changes

- root agent doctrine no longer requires Replit;
- screenshot doctrine requires exact source, route, viewport, environment, run/command identity, and artifact digest;
- a GitHub-native capture workflow and deterministic Playwright capture script are installed;
- the legacy Replit doctrine remains historical compatibility documentation only.

## Boundaries

This work changes doctrine and proof tooling. It does not claim that a prior screenshot was recaptured, that a deployment is production-ready, or that a screenshot alone proves backend behavior.
