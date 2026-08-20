import os


class Settings:
    PROJECT_NAME: str = "Bayagra API"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "bayagra-super-secret-key-2026-analyst-auth")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day session
    
    # SQLite file-based database placed inside the backend folder
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./backend/bayagra.db")
    
    # Default data source toggle: True for mock engine, False to simulate live requests
    MOCK_MODE: bool = os.getenv("MOCK_MODE", "True").lower() == "true"
    
    # External API configuration placeholders
    VIRUSTOTAL_API_KEY: str = os.getenv("VIRUSTOTAL_API_KEY", "")
    IPINFO_API_KEY: str = os.getenv("IPINFO_API_KEY", "")
    IPQUALITYSCORE_API_KEY: str = os.getenv("IPQUALITYSCORE_API_KEY", "")
    NUMVERIFY_API_KEY: str = os.getenv("NUMVERIFY_API_KEY", "")

settings = Settings()
