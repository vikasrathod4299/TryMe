from fastapi import APIRouter, Form
from fastapi import Depends
from app.user.service import UserService
from app.middlewares.dependencies import get_current_user
from app.user.model import User
from app.user.serializer import UserProfile
from app.config.serializer import ResponseModel

router = APIRouter()


@router.get("/me", response_model=ResponseModel[UserProfile])
def get_current_user_profile(user: User = Depends(get_current_user)):
    """Get the current authenticated user's profile"""
    return {
        "message": "User profile retrieved successfully",
        "data": UserProfile(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            is_verified=user.is_verified,
            created_at=user.created_at
        )
    }
