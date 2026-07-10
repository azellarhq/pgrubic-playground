"""Models."""

from pydantic import Field, BaseModel as PydanticBaseModel, ConfigDict


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

    model_config = ConfigDict(extra="forbid")


class Disallowed(BaseConfig):
    """Disallowed."""

    name: str
    reason: str
    use_instead: str = Field(alias="use-instead")


class DisallowedSchema(Disallowed):
    """Disallowed schema."""


class Column(BaseConfig):
    """Column."""

    name: str
    data_type: str = Field(alias="data-type")


class DisallowedDataType(Disallowed):
    """Disallowed data type."""


class LinterConfig(BaseConfig):
    """Linter configuration."""

    target_postgres_version: int = Field(alias="target-postgres-version", default=14)
    additional_non_volatile_functions: list[str] = Field(
        alias="additional-non-volatile-functions",
        default_factory=list,
    )
    select: list[str] = Field(default_factory=list)
    ignore: list[str] = Field(default_factory=list)
    fixable: list[str] = Field(default_factory=list)
    unfixable: list[str] = Field(default_factory=list)
    ignore_noqa: bool = Field(alias="ignore-noqa", default=False)
    allowed_extensions: list[str] = Field(
        alias="allowed-extensions",
        default_factory=list,
    )
    allowed_languages: list[str] = Field(alias="allowed-languages", default_factory=list)
    disallowed_schemas: list[DisallowedSchema] = Field(
        alias="disallowed-schemas",
        default_factory=list,
    )
    disallowed_data_types: list[DisallowedDataType] = Field(
        alias="disallowed-data-types",
        default_factory=list,
    )
    required_columns: list[Column] = Field(
        alias="required-columns",
        default_factory=list,
    )
    timestamp_column_suffix: str = Field(alias="timestamp-column-suffix", default="_at")
    date_column_suffix: str = Field(alias="date-column-suffix", default="_date")
    regex_partition: str = Field(alias="regex-partition", default="^.+$")
    regex_index: str = Field(alias="regex-index", default="^.+$")
    regex_constraint_primary_key: str = Field(
        alias="regex-constraint-primary-key",
        default="^.+$",
    )
    regex_constraint_unique_key: str = Field(
        alias="regex-constraint-unique-key",
        default="^.+$",
    )
    regex_constraint_foreign_key: str = Field(
        alias="regex-constraint-foreign-key",
        default="^.+$",
    )
    regex_constraint_check: str = Field(alias="regex-constraint-check", default="^.+$")
    regex_constraint_exclusion: str = Field(
        alias="regex-constraint-exclusion",
        default="^.+$",
    )
    regex_sequence: str = Field(alias="regex-sequence", default="^.+$")


class FormatterConfig(BaseConfig):
    """Formatter configuration."""

    comma_at_beginning: bool = Field(alias="comma-at-beginning", default=True)
    new_line_before_semicolon: bool = Field(
        alias="new-line-before-semicolon",
        default=False,
    )
    remove_pg_catalog_from_functions: bool = Field(
        alias="remove-pg-catalog-from-functions",
        default=True,
    )
    lines_between_statements: int = Field(alias="lines-between-statements", default=1)


class Config(BaseConfig):
    """Configuration."""

    lint: LinterConfig
    format: FormatterConfig


# Request
class Request(BaseConfig):
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
