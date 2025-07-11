"""Settings for the app."""

import enum

from pydantic_settings import BaseSettings, SettingsConfigDict  # type: ignore


class Environment(enum.StrEnum):
    PRODUCTION  = enum.auto()
    STAGING     = enum.auto()
    DEVELOPMENT = enum.auto()
    LOCAL        = enum.auto()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
    )
    ENVIRONMENT: Environment = Environment.LOCAL
    PROJECT_NAME: str
    PROJECT_DESCRIPTION: str
    CORS_ORIGINS: list[str] = []
    VERSION: str
    API_V1_STR: str = "/api/v1"

settings = Settings() # type: ignore
