"""pgrubic operations."""

from pgrubic import core
from pgrubic.core.linter import LintResult
from pgrubic.core.formatter import FormatResult

from app import models

# Initialize infrastructure
config = core.parse_config()
linter = core.Linter(config=config, formatters=core.load_formatters)
formatter = core.Formatter(config=config, formatters=core.load_formatters)

def lint_source_code(*, source_code: models.LintSourceCode) -> models.LintResult:
    """Lint SQL."""
    config.lint.postgres_target_version = (
        source_code.config.lint.postgres_target_version
    )
    config.lint.select = source_code.config.lint.select
    config.lint.ignore = source_code.config.lint.ignore
    config.lint.ignore_noqa = source_code.config.lint.ignore_noqa
    config.lint.fix = source_code.with_fix

    rules = core.load_rules(config=config)
    for rule in rules:
        linter.checkers.add(rule())

    result: LintResult = linter.run(source_file="", source_code=source_code.source_code)

    return models.LintResult(
        # Serialize violations to pydantic model
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
            for violation in result.violations
        ],
        errors=result.errors,
        fixed_source_code=result.fixed_source_code,
    )


def format_source_code(
    *, source_code: models.SourceCode, config: models.Config
) -> models.FormatResult:
    """Format SQL."""
    config.format.comma_at_beginning = config.format.comma_at_beginning
    config.format.new_line_before_semicolon = config.format.new_line_before_semicolon
    config.format.remove_pg_catalog_from_functions = (
        config.format.remove_pg_catalog_from_functions
    )
    config.format.lines_between_statements = config.format.lines_between_statements

    format_result: FormatResult = formatter.format(
        source_file="", source_code=source_code
    )

    return models.FormatResult(
        formatted_source_code=format_result.formatted_source_code,
        errors=format_result.errors,
    )
