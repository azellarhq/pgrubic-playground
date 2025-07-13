"""Settings for the app."""

import enum

from pydantic_settings import BaseSettings, SettingsConfigDict


class Environment(enum.StrEnum):
    """Enum representing the supported environments."""

    PRODUCTION = enum.auto()
    STAGING = enum.auto()
    DEVELOPMENT = enum.auto()
    LOCAL = enum.auto()


class Settings(BaseSettings):
    """Settings for the Backend."""

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
    HOST_BIND: str
    HOST_PORT: int


settings = Settings()  # type: ignore[call-arg] # fastapi will take care of it
