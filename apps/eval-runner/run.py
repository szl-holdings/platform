#!/usr/bin/env python3
"""
Eval Runner — starts the FastAPI service.
Usage: python run.py
"""
import os
import sys

# Add src to path so relative imports work when running from the package root
sys.path.insert(0, os.path.dirname(__file__))

import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8001"))
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=port,
        log_level="info",
        reload=False,
    )
