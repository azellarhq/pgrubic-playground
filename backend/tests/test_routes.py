"""Test API routes."""

from app.config import settings
from fastapi.testclient import TestClient

config = {
    "lint": {
        "postgres_target_version": 14,
        "select": [],
        "ignore": [],
        "fixable": [],
        "unfixable": [],
        "ignore_noqa": True,
        "allowed_extensions": [],
        "allowed_languages": [],
        "disallowed_schemas": [],
        "disallowed_data_types": [],
        "required_columns": [],
        "timestamp_column_suffix": "_at",
        "date_column_suffix": "_date",
        "regex_partition": "^.+$",
        "regex_index": "^.+$",
        "regex_constraint_primary_key": "^.+$",
        "regex_constraint_unique_key": "^.+$",
        "regex_constraint_foreign_key": "^.+$",
        "regex_constraint_check": "^.+$",
        "regex_constraint_exclusion": "^.+$",
        "regex_sequence": "^.+$",
    },
    "format": {
        "comma_at_beginning": True,
        "new_line_before_semicolon": True,
        "remove_pg_catalog_from_functions": True,
        "lines_between_statements": 1,
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
