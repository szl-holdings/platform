"""Run the service: `python -m aef_ingest_control` (binds AEF_INGEST_CONTROL_PORT, then PORT, default 4201)."""

import os

import uvicorn

from .app import create_app


def main() -> None:
    port = os.environ.get("AEF_INGEST_CONTROL_PORT", os.environ.get("PORT", "4201"))
    uvicorn.run(create_app(), host="0.0.0.0", port=int(port), log_level="warning", access_log=False)


if __name__ == "__main__":
    main()
