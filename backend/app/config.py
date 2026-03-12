"""Application configuration using Pydantic Settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    DATABASE_URL: str = "postgresql://postgres.nfwqsczviswmlvchomxq:VinithCal%40369@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
    FRONTEND_URL: str = "http://localhost:5173"
    
    # SMTP settings for email notifications (optional)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "lvinithreddy@gmail.com"
    SMTP_PASSWORD: str = "bhrjjqucoksnlnsa"
    SMTP_FROM_EMAIL: str = "lvinithreddy@gmail.com"
    

    class Config:
        env_file = ".env"


settings = Settings()
