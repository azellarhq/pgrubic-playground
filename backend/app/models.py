"""Models."""

from pydantic import BaseModel as PydanticBaseModel
from pydantic import ConfigDict


# Forbid extra values.
class BaseModel(PydanticBaseModel):
    """Base model."""

    model_config = ConfigDict(extra="forbid")


# Errors
class Error(BaseModel):
    """Representation of an error."""

    statement: str
    message: str
    hint: str


# Configurations
class LinterConfig(BaseModel):
    """Linter configuration."""

    postgres_target_version: int = 14
    select: list[str] = []
    ignore: list[str] = []
    fixable: list[str] = []
    unfixable: list[str] = []
    ignore_noqa: bool = False
    allowed_extensions: list[str] = []
    allowed_languages: list[str] = []
    disallowed_schemas: list[str] = []
    disallowed_data_types: list[str] = []
    required_columns: list[str] = []
    timestamp_column_suffix: str = "_at"
    date_column_suffix: str = "_date"
    regex_partition: str = "^.+$"
    regex_index: str = "^.+$"
    regex_constraint_primary_key: str = "^.+$"
    regex_constraint_unique_key: str = "^.+$"
    regex_constraint_foreign_key: str = "^.+$"
    regex_constraint_check: str = "^.+$"
    regex_constraint_exclusion: str = "^.+$"
    regex_sequence: str = "^.+$"


class FormatterConfig(BaseModel):
    """Formatter configuration."""

    comma_at_beginning: bool = True
    new_line_before_semicolon: bool = True
    remove_pg_catalog_from_functions: bool = True
    lines_between_statements: int = 1


class Config(BaseModel):
    """Configuration."""

    lint: LinterConfig
    format: FormatterConfig


# Request
class Request(BaseModel):
    """Request."""

    source_code: str
    config: Config


# Lint
class LintSourceCode(Request):
    """Lint source code."""

    with_fix: bool = False


class Violation(BaseModel):
    """Representation of rule violation."""

    rule_code: str
    rule_name: str
    rule_category: str
    line_number: int
    column_offset: int
    line: str
    statement_location: int
    description: str
    is_auto_fixable: bool
    is_fix_enabled: bool
    help: str | None


class LintResult(BaseModel):
    """Lint result."""

    violations: list[Violation]
    errors: list[Error]
    fixed_source_code: str | None = None


# Format
class FormatSourceCode(Request):
    """Format source code."""


class FormatResult(BaseModel):
    """Format result."""

    formatted_source_code: str
    errors: list[Error]
