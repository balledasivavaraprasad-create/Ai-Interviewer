import os
from pathlib import Path
from pydantic import BaseModel

# Locate project root .env
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = ROOT_DIR / ".env"

if ENV_PATH.exists():
    with open(ENV_PATH, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

class Settings(BaseModel):
    PROJECT_NAME: str = "AURA · TALENT Executive AI Interview Platform"
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "aura_talent")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "aura_talent_ultra_secure_jwt_secret_key_2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24
    OTP_EXPIRY_MINUTES: int = 10
    DEFAULT_TIMEZONE: str = "Asia/Kolkata"

settings = Settings()
