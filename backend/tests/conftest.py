"""Conftest."""

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    """Setup test client from the app."""
    with TestClient(app) as app_client:
        yield app_client
