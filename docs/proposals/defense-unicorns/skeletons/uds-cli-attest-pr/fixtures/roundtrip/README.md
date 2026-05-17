# Round-trip fixture

A two-component synthetic bundle used by `ci/roundtrip.sh` to exercise
the full `create --attest → tamper → verify --offline` path. The
fixture intentionally stays minimal — its job is to fail loudly if any
of the three patches regress, not to model a real workload.

## Files

| File                  | Notes                                                                |
| --------------------- | -------------------------------------------------------------------- |
| `uds-bundle.yaml`     | Top-level bundle manifest pointing at the two local Zarf packages.   |
| `pkg-a/zarf.yaml`     | Component A: a single text "artifact".                               |
| `pkg-a/artifact.txt`  | Component A's artifact bytes (`"hello from a\n"`).                   |
| `pkg-b/zarf.yaml`     | Component B: a single text "artifact".                               |
| `pkg-b/artifact.txt`  | Component B's artifact bytes (`"hello from b\n"`).                   |
| `keygen.sh`           | One-shot generator for ed25519 + ml-dsa-65 keys + trust-root.json.   |

Neither the keys nor `trust-root.json` are committed — `keygen.sh`
regenerates the whole set fresh on every CI run so a leaked seed
cannot escape into production, and the trust root is rebuilt to match.
