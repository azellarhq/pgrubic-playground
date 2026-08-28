"""Models."""

from pydantic import BaseModel as PydanticBaseModel, ConfigDict
from pgrubic.core import config as pgrubic_config


class BaseModel(PydanticBaseModel):
    """Base model."""

    # Forbid extra fields.
    model_config = ConfigDict(extra="forbid")


# Errors
class Error(BaseModel):
    """Representation of an error."""

    statement: str
    message: str
    hint: str


# Configurations
class BaseConfig(BaseModel):
    """Base configuration."""


Config = pgrubic_config.create_scoped_config_model_from_defaults(
    scope=pgrubic_config.ConfigScope.GENERAL,
)


# Request
class Request(BaseConfig):
    """Request."""

    source_code: str
    config: Config  # type: ignore[valid-type]


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


# Share
class ShareRequest(Request):
    """Share request."""

    lint_violations_summary: str | None = None
    lint_violations_summary_class: str | None = None
    lint_output: str | None = None
    sql_output_box_style: str | None = None
    sql_output_label: str | None = None
    sql_output: str | None = None


class ShareResponse(BaseModel):
    """Share response."""

    request_id: str


class ShareResult(ShareRequest):
    """Share result."""

    toml_config: str


class PgrubicVersion(BaseModel):
    """Pgrubic version."""

    version: str
    """The version of Pgrubic, represented as a string."""
