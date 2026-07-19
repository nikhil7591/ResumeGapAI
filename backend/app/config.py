from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str

    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440

    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"
    groq_judge_model: str = "llama-3.1-8b-instant"

    stripe_secret_key: str
    stripe_webhook_secret: str
    stripe_price_id_pro: str

    frontend_url: str = "http://localhost:3000"

    free_daily_review_limit: int = 3

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)


settings = Settings()
