from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "ML Playground"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    BASE_URL: str = "http://localhost"

    # Database
    DATABASE_URL: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/mlplayground"
    )
    TEST_DATABASE_URL: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5433/mlplayground_test"
    )

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Email (placeholder)
    EMAIL_BACKEND: str = "console"  # "console", "smtp", "sendgrid"
    SMTP_HOST: str | None = None
    SMTP_PORT: int | None = None

    # File uploads
    UPLOAD_DIR: str = "./uploads"

    # Plot created
    PLOT_DIR: str = "./plots"

    # Celery tasks
    SYNC_DATABASE_URL: str = (
        "postgresql+psycopg2://postgres:postgres@db:5432/mlplayground"
    )
    SYNC_TEST_DB_URL: str = (
        "postgresql+psycopg2://postgres:postgres@localhost:5433/mlplayground_test"
    )

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost",  # nginx default
        "http://localhost:80",  # nginx explicit
        "http://127.0.0.1",  # nginx alternative
        "http://127.0.0.1:80",  # nginx explicit alternative
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


settings = Settings()
