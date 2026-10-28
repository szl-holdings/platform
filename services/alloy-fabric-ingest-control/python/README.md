# alloy-fabric-ingest-control (Python port, draft)

Python port of `../src/server.ts`, built on the stack platform's other Python services use (FastAPI, uvicorn, pydantic v2). It serves the same routes with the same status codes, JSON bodies and `Retry-After` header. Checkpoint and approval files keep the original format, so either service can read the other's state.

- Production remains on HOLD exactly as in the original: `/readyz` and every control route return 503 when a production marker is set.
- The TypeScript service and its Dockerfile are unchanged. Switching the deployment is a separate, approved step.

## Run and test

```bash
python -m aef_ingest_control          # needs AEF_S2S_SECRET; binds AEF_INGEST_CONTROL_PORT, PORT or 4201
pytest                                # unit tests; test_parity.py is skipped without Node
AEF_PARITY_NODE=/path/to/node AEF_PARITY_TS_DIR=/path/to/ts-copy pytest tests/test_parity.py
```

`test_parity.py` starts the original and the port side by side and sends both the same requests. It covers development, tenant-bound and production configurations and startup refusals.

## Known differences from the original

- **Validation errors:** `issues` in 400 `validation_error` bodies follow Zod's shape (`code`, `path`, `message`), but the wording comes from pydantic.
- **Error pages:** HTML error pages (404, 400 for malformed JSON, 413, 415, 500) keep the status and content type. They never include stack traces; the original prints them outside production.
- **Token-based chunking:** the original loads the embedding model's tokenizer through `@workspace/alloy-vector-worker` and falls back to word chunking when it can't. The port never downloads a tokenizer. It uses one only if `tokenizers` and a cached copy of the pinned revision are already present, and token-mode output has not been compared with transformers.js. Word mode has been.
- **Request bodies:** `gzip`, `deflate` and `br` request bodies are refused with 415; the original inflates them.

## Behaviour kept on purpose (open questions for the owner)

- **`/control/eval`:** validates `queries` but does not pass them to the workflow, so every evaluation reports `skipped`.
- **`/control/rotate-profile`:** passes `targetVersion`, but the workflow reads `newVersion`, so the activated record has no version unless a resume supplies `input.newVersion`.
- **`/control/approvals/:id/resolve`:** does not validate `decision`. An already-resolved approval answers 404 rather than 409.
