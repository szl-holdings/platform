"""Pytest fixtures for the Sentra Detector Sidecar."""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

import pytest
from fastapi.testclient import TestClient

from sidecar.main import app


@pytest.fixture(scope="session")
def client() -> TestClient:
    with TestClient(app) as c:
        yield c
