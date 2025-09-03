from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth.router import router as auth_router
from app.config.settings import Settings

app = FastAPI(
    title=Settings.PROJECT_NAME,
    version=Settings.VERSION,
    debug=Settings.DEBUG,
    openapi_url="/openapi.json"
)

if Settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=Settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(auth_router, prefix=Settings.API_V1_STR, tags=["Authentication"])

# Root endpoint
@app.get("/")
def read_root():
    return {
        "message": f"Welcome to {Settings.PROJECT_NAME}",
        "version": Settings.VERSION,
        "environment": Settings.ENVIRONMENT
    }

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy"}
