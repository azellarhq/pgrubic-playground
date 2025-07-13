"""pgrubic operations."""

from pgrubic import core
from pgrubic.core.linter import LintResult  # noqa: TC002
from pgrubic.core.formatter import FormatResult  # noqa: TC002

from app import models

# Initialize common infrastructure
config = core.parse_config()


def lint_source_code(*, lint_source_code: models.LintSourceCode) -> models.LintResult:
    """Lint source code."""
    linter = core.Linter(config=config, formatters=core.load_formatters)

    # Config overrides
    config.lint.postgres_target_version = (
        lint_source_code.config.lint.postgres_target_version
    )
    config.lint.select = lint_source_code.config.lint.select
    config.lint.ignore = lint_source_code.config.lint.ignore
    config.lint.ignore_noqa = lint_source_code.config.lint.ignore_noqa
    config.lint.fix = lint_source_code.with_fix

    config.format.comma_at_beginning = lint_source_code.config.format.comma_at_beginning
    config.format.new_line_before_semicolon = (
        lint_source_code.config.format.new_line_before_semicolon
    )
    config.format.remove_pg_catalog_from_functions = (
        lint_source_code.config.format.remove_pg_catalog_from_functions
    )
    config.format.lines_between_statements = (
        lint_source_code.config.format.lines_between_statements
    )

    rules = core.load_rules(config=config)
    for rule in rules:
        linter.checkers.add(rule())

    lint_result: LintResult = linter.run(
        source_file="",
        source_code=lint_source_code.source_code,
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
    format_source_code: models.FormatSourceCode,
) -> models.FormatResult:
    """Format source code."""
    # Config overrides
    config.format.comma_at_beginning = format_source_code.config.format.comma_at_beginning
    config.format.new_line_before_semicolon = (
        format_source_code.config.format.new_line_before_semicolon
    )
    config.format.remove_pg_catalog_from_functions = (
        format_source_code.config.format.remove_pg_catalog_from_functions
    )
    config.format.lines_between_statements = (
        format_source_code.config.format.lines_between_statements
    )

    formatter = core.Formatter(config=config, formatters=core.load_formatters)

    format_result: FormatResult = formatter.format(
        source_file="",
        source_code=format_source_code.source_code,
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
