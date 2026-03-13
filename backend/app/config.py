"""Application configuration using Pydantic Settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # FRONTEND_URL: str = "http://localhost:5173"
    # DATABASE_URL: str = "postgresql://postgres.nfwqsczviswmlvchomxq:VinithCal%40369@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
    DATABASE_URL: str = "postgresql+psycopg://postgres.nfwqsczviswmlvchomxq:VinithCal%40369@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
    FRONTEND_URL: str 

    class Config:
        env_file = ".env"


settings = Settings()
