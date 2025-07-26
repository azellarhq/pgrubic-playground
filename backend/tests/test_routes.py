"""Test API routes."""

from fastapi.testclient import TestClient

from app.config import settings

config = {
    "lint": {
        "postgres-target-version": 14,
        "select": [],
        "ignore": [],
        "fixable": [],
        "unfixable": [],
        "ignore-noqa": True,
        "allowed-extensions": [],
        "allowed-languages": [],
        "disallowed-schemas": [],
        "disallowed-data-types": [],
        "required-columns": [],
        "timestamp-column-suffix": "_at",
        "date-column-suffix": "_date",
        "regex-partition": "^.+$",
        "regex-index": "^.+$",
        "regex-constraint-primary-key": "^.+$",
        "regex-constraint-unique-key": "^.+$",
        "regex-constraint-foreign-key": "^.+$",
        "regex-constraint-check": "^.+$",
        "regex-constraint-exclusion": "^.+$",
        "regex-sequence": "^.+$",
    },
    "format": {
        "comma-at-beginning": True,
        "new-line-before-semicolon": True,
        "remove-pg-catalog-from-functions": True,
        "lines-between-statements": 1,
    },
}


def test_lint_source_code_no_violations_no_errors(client: TestClient) -> None:
    """Test lint source code with no violations or errors."""
    lint_data = {
        "source_code": "SELECT 1;",
        "config": config,
    }
    response = client.post(f"{settings.API_V1_STR}/lint", json=lint_data)
    lint_result = response.json()
    assert response.status_code == 200
    assert not lint_result["violations"]
    assert not lint_result["errors"]
    assert not lint_result["fixed_source_code"]


def test_lint_source_code_with_violations_no_errors(client: TestClient) -> None:
    """Test lint source code with violations."""
    lint_data = {
        "source_code": "CREATE TABLE users (id INT, name TEXT);",
        "config": config,
    }
    response = client.post(f"{settings.API_V1_STR}/lint", json=lint_data)
    lint_result = response.json()
    assert response.status_code == 200
    assert lint_result["violations"]
    assert not lint_result["errors"]
    assert not lint_result["fixed_source_code"]


def test_lint_source_code_no_violations_with_errors(client: TestClient) -> None:
    """Test lint source code with errors."""
    lint_data = {
        "source_code": "CREATE TABLE users (id INT, name);",
        "config": config,
    }
    response = client.post(f"{settings.API_V1_STR}/lint", json=lint_data)
    lint_result = response.json()
    assert response.status_code == 200
    assert not lint_result["violations"]
    assert lint_result["errors"]
    assert not lint_result["fixed_source_code"]


def test_lint_source_code_with_fix(client: TestClient) -> None:
    """Test lint source code with fix."""
    lint_data = {
        "source_code": "CREATE INDEX users_name_idx ON public.users (name);",
        "config": config,
        "with_fix": True,
    }
    response = client.post(f"{settings.API_V1_STR}/lint", json=lint_data)
    lint_result = response.json()
    assert response.status_code == 200
    assert lint_result["violations"]
    assert not lint_result["errors"]
    assert lint_result["fixed_source_code"]


def test_format_source_code_no_errors(client: TestClient) -> None:
    """Test format source code with no errors."""
    format_data = {
        "source_code": "select 1;",
        "config": config,
    }
    response = client.post(f"{settings.API_V1_STR}/format", json=format_data)
    format_result = response.json()
    assert response.status_code == 200
    assert not format_result["errors"]
    assert format_result["formatted_source_code"]


def test_format_source_code_with_errors(client: TestClient) -> None:
    """Test format source code with errors."""
    format_data = {
        "source_code": "select 1 from;",
        "config": config,
    }
    response = client.post(f"{settings.API_V1_STR}/format", json=format_data)
    format_result = response.json()
    assert response.status_code == 200
    assert format_result["errors"]
    assert format_result["formatted_source_code"]


def test_pgrubic_version(client: TestClient) -> None:
    """Test pgrubic version."""
    response = client.get(f"{settings.API_V1_STR}/pgrubic-version")
    pgrubic_version = response.json()
    assert response.status_code == 200
    assert pgrubic_version


def test_health_check(client: TestClient) -> None:
    """Test health check."""
    response = client.get(f"{settings.API_V1_STR}/health")
    health_check = response.json()
    assert response.status_code == 200
    assert health_check


def test_create_share_id(client: TestClient) -> None:
    """Test create share id."""
    request_data = {
        "source_code": "CREATE TABLE users (id INT, name);",
        "config": config,
    }
    response = client.post(f"{settings.API_V1_STR}/share", json=request_data)
    request_id = response.json()
    assert response.status_code == 200
    assert request_id


def test_get_share_by_id(client: TestClient) -> None:
    """Test get share by id."""
    request_data = {
        "source_code": "CREATE TABLE users (id INT, name);",
        "config": config,
    }
    response = client.post(f"{settings.API_V1_STR}/share", json=request_data)
    request_id = response.json()

    response = client.get(f"{settings.API_V1_STR}/share/{request_id['request_id']}")
    share_result = response.json()
    assert response.status_code == 200
    assert share_result["source_code"] == request_data["source_code"]
    assert share_result["config"] == request_data["config"]

    response = client.get(f"{settings.API_V1_STR}/share/1234")
    assert response.status_code == 404
