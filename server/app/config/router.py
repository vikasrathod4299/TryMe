from fastapi import APIRouter
from app.user.router import router as users_router
from app.auth.router import router as auth_router
from app.upload.router import router as upload_router
from app.credits.router import router as credits_router


api_router = APIRouter()

api_router.include_router(users_router, prefix="/user", tags=["Users"])
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(upload_router, prefix="/upload", tags=["Upload"])
api_router.include_router(credits_router, tags=["Credits"])