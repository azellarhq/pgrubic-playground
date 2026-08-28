"""Test API models."""

from pgrubic.core import config as pgrubic_config

from app import models


def test_config_schema_is_sourced_from_pgrubic() -> None:
    """Expose pgrubic's general config fields and defaults to API consumers."""
    schema = models.Config.model_json_schema(by_alias=True)
    lint_schema = schema["$defs"]["ConfigLint"]
    format_schema = schema["$defs"]["ConfigFormat"]
    defaults = pgrubic_config.load_default_config_by_scope(
        scope=pgrubic_config.ConfigScope.GENERAL,
    )
    lint_defaults = defaults["lint"]
    format_defaults = defaults["format"]

    assert isinstance(lint_defaults, dict)
    assert isinstance(format_defaults, dict)

    assert set(lint_schema["properties"]) == set(lint_defaults)
    assert set(format_schema["properties"]) == set(format_defaults)
    assert format_schema["properties"]["type-casting-style"]["default"] == ("standard")
