# Required Status Checks Matrix

| Check Name | Trigger | Required for Merge | Blocking |
|-----------|---------|-------------------|----------|
| CI / build-api | push, PR | Yes | Yes |
| CI / build-web (all 7 apps) | push, PR | Yes | Yes |
| CI / typecheck (all 8 apps) | push, PR | Recommended | No (continue-on-error) |
| Build Check / build-all | push | No | No |
| CodeQL / analyze | push, PR, weekly | Recommended | No |
| Dependency Review | PR only | Recommended | Yes for high severity |
| Release | tag push only | N/A | N/A |
