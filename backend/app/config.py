"""Settings for the app."""

import enum

from pydantic_settings import BaseSettings, SettingsConfigDict


class Environment(enum.StrEnum):
    """Enum representing the supported environments."""

    PRODUCTION = enum.auto()
    STAGING = enum.auto()
    DEVELOPMENT = enum.auto()


class Settings(BaseSettings):
    """Settings for the Backend."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
    )
    ENVIRONMENT: Environment = Environment.DEVELOPMENT
    PROJECT_NAME: str = "pgrubic-playground"
    PROJECT_DESCRIPTION: str = "An in-browser playground for pgrubic, a PostgreSQL linter and formatter for schema migrations and design best practices."  # noqa: E501
    CORS_ORIGINS: list[str] = []
    API_V1_STR: str = "/api/v1"
    HOST_BIND: str = "localhost"
    HOST_PORT: int = 8000


settings = Settings()
