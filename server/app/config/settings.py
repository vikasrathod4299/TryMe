from pydantic_settings import BaseSettings 

class Settings(BaseSettings):
    # =============================================================================
    # APPLICATION SETTINGS
    # =============================================================================
    PROJECT_NAME: str = "FastAPI Application"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    API_V1_STR: str = "/api/v1"
    LOG_LEVEL: str = "DEBUG"

    # =============================================================================
    # DATABASE CONFIGURATION (PostgreSQL)
    # =============================================================================
    DATABASE_URL: str  = "postgresql://postgres:rathod1234vikas@localhost:5433/try_me"
    POSTGRES_DB: str = "try_me"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "rathod1234vikas"

    # =============================================================================
    # REDIS CONFIGURATION
    # =============================================================================
    REDIS_URL: str = "redis://redis:6379/0"
    REDIS_PASSWORD: str = "rathod1234vikas"
    REDIS_DB: int = 0
    REDIS_TIMEOUT: int = 3600

    # =============================================================================
    # JWT & SECURITY CONFIGURATION
    # =============================================================================
    SECRET_KEY: str = "your-super-secret-key-change-in-production-256-bit-minimum"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 20
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    VERIFICATION_CODE_EXPIRE_MINUTES: int = 10

    # =============================================================================
    # CORS CONFIGURATION
    # =============================================================================
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173","http://localhost:3000","http://localhost:8000","http://localhost:8080"]

    # =============================================================================
    # AWS S3 CONFIGURATION
    # =============================================================================
    AWS_ACCESS_KEY_ID: str = "your-aws-access-key-id"
    AWS_SECRET_ACCESS_KEY: str = "your-aws-secret-access-key"
    AWS_REGION: str = "your-aws-region"
    S3_BUCKET_NAME: str = "your-s3-bucket-name"
    SQS_QUEUE_URL: str = "https://sqs.ap-south-1.amazonaws.com/your-account/outfit-checker-jobs"

    OPENAI_API_KEY: str = "your-openai-api-key"
    GEMINI_API_KEY: str = "your-gemini-api-key"

    # =============================================================================
    # RAZORPAY CONFIGURATION (Payments - India)
    # =============================================================================
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    # =============================================================================
    # CREDITS CONFIGURATION
    # =============================================================================
    FREE_CREDITS_ON_SIGNUP: int = 3

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()