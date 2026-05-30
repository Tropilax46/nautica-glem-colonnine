"""Configurazione caricata da .env."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+psycopg://glem:glem@localhost:5432/glem"

    # JWT
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_min: int = 15
    jwt_refresh_days: int = 30

    # MQTT
    mqtt_host: str = "localhost"
    mqtt_port: int = 8883
    mqtt_user: str = "backend"
    mqtt_pass: str = ""
    mqtt_ca_cert: str = "./certs/ca.crt"

    # Stripe
    stripe_secret: str = ""
    stripe_webhook_secret: str = ""

    # Misc
    cors_origins: list[str] = ["*"]
    base_tariff_eur_per_kwh: float = 0.55
    min_wallet_to_start_eur: float = 2.0
    min_wallet_to_continue_eur: float = 0.30

    class Config:
        env_file = ".env"


settings = Settings()
