"""pgrubic operations."""

import string
import secrets

import toml
import models
import diskcache
from config import settings
from fastapi import HTTPException, status
from pgrubic import core

# Initialize common infrastructure
config = core.parse_config()
cache = diskcache.Cache(directory=settings.SHARE_CACHE_DIRECTORY)


def lint_source_code(*, data: models.LintSourceCode) -> models.LintResult:
    """Lint source code."""
    linter = core.Linter(config=config, formatters=core.load_formatters)

    # Config overrides
    config.lint.postgres_target_version = data.config.lint.postgres_target_version
    config.lint.select = data.config.lint.select
    config.lint.ignore = data.config.lint.ignore
    config.lint.ignore_noqa = data.config.lint.ignore_noqa
    config.lint.fix = data.with_fix

    config.format.comma_at_beginning = data.config.format.comma_at_beginning
    config.format.new_line_before_semicolon = data.config.format.new_line_before_semicolon
    config.format.remove_pg_catalog_from_functions = (
        data.config.format.remove_pg_catalog_from_functions
    )
    config.format.lines_between_statements = data.config.format.lines_between_statements

    rules = core.load_rules(config=config)
    for rule in rules:
        linter.checkers.add(rule())

    lint_result = linter.run(
        source_file="",
        source_code=data.source_code,
    )

    return models.LintResult(
        # Serialize violations and errors to pydantic model
        violations=[
            models.Violation(
                rule_code=violation.rule_code,
                rule_name=violation.rule_name,
                rule_category=violation.rule_category,
                line_number=violation.line_number,
                column_offset=violation.column_offset,
                line=violation.line,
                statement_location=violation.statement_location,
                description=violation.description,
                is_auto_fixable=violation.is_auto_fixable,
                is_fix_enabled=violation.is_fix_enabled,
                help=violation.help,
            )
            for violation in lint_result.violations
        ],
        errors=[
            models.Error(
                statement=error.statement,
                message=error.message,
                hint=error.hint,
            )
            for error in lint_result.errors
        ],
        fixed_source_code=lint_result.fixed_source_code,
    )


def format_source_code(
    *,
    data: models.FormatSourceCode,
) -> models.FormatResult:
    """Format source code."""
    # Config overrides
    config.format.comma_at_beginning = data.config.format.comma_at_beginning
    config.format.new_line_before_semicolon = data.config.format.new_line_before_semicolon
    config.format.remove_pg_catalog_from_functions = (
        data.config.format.remove_pg_catalog_from_functions
    )
    config.format.lines_between_statements = data.config.format.lines_between_statements

    formatter = core.Formatter(config=config, formatters=core.load_formatters)

    format_result = formatter.format(
        source_file="",
        source_code=data.source_code,
    )

    return models.FormatResult(
        # Serialize formatted source code and errors to pydantic model
        formatted_source_code=format_result.formatted_source_code,
        errors=[
            models.Error(
                statement=error.statement,
                message=error.message,
                hint=error.hint,
            )
            for error in format_result.errors
        ],
    )


def _generate_key(length: int = 8) -> str:
    """Generate a random key."""
    return "".join(
        secrets.choice(string.ascii_letters + string.digits) for _ in range(length)
    )


def create_share_id(*, data: models.ShareRequest) -> models.ShareResponse:
    """Create share id."""
    request_id = _generate_key()
    cache.set(
        request_id,
        {
            "source_code": data.source_code,
            "config": data.config.model_dump(by_alias=True),
            "lint_violations_summary": data.lint_violations_summary,
            "lint_violations_summary_class": data.lint_violations_summary_class,
            "lint_output": data.lint_output,
            "sql_output_box_style": data.sql_output_box_style,
            "sql_output_label": data.sql_output_label,
            "sql_output": data.sql_output,
        },
        expire=settings.SHARE_EXPIRE_MINUTES * 60,
    )
    return models.ShareResponse(request_id=request_id)


def get_share_by_id(*, request_id: str) -> models.ShareResult:
    """Get share by id."""
    data = cache.get(request_id)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share id not found",
        )

    return models.ShareResult(
        source_code=data["source_code"],
        config=data["config"],
        toml_config=toml.dumps(data["config"]),
        lint_violations_summary=data["lint_violations_summary"],
        lint_violations_summary_class=data["lint_violations_summary_class"],
        lint_output=data["lint_output"],
        sql_output_box_style=data["sql_output_box_style"],
        sql_output_label=data["sql_output_label"],
        sql_output=data["sql_output"],
    )
