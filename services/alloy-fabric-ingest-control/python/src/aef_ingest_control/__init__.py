"""Alloy Embedding Fabric ingestion control service — Python port of src/server.ts (draft)."""

from .app import create_app

__all__ = ["create_app"]
