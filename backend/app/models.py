"""Models."""

from pydantic import BaseModel as PydanticBaseModel

# from pgrubic.core.linter import Violation
from pgrubic.core import errors
import typing


# Forbid extra values.
class BaseModel(PydanticBaseModel):
    class Config:
        extra = "forbid"


# source code
class SourceCode(BaseModel):
    source_code: str


# Configurations
class LinterConfig(BaseModel):
    postgres_target_version: int = 14
    select: list[str] = []
    ignore: list[str] = []
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
    comma_at_beginning: bool = True
    new_line_before_semicolon: bool = True
    remove_pg_catalog_from_functions: bool = True
    lines_between_statements: int = 1


class Config(BaseModel):
    lint: LinterConfig
    format: FormatterConfig


# Request
class Request(SourceCode):
    config: Config


# Lint
class LintSourceCode(Request):
    with_fix: bool = False


class Violation(BaseModel):
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
    violations: list[Violation]
    errors: set[errors.Error]
    fixed_source_code: str | None = None


# Format
class FormatSourceCode(Request): ...


class FormatResult(BaseModel):
    formatted_source_code: str
    errors: set[errors.Error]
