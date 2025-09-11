from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config.database import get_db

from .serializer import (
    UserRegistrationRequest, AuthResponse
)

from .controllers import AuthController

router = APIRouter()


@router.post("/register", response_model=AuthResponse)
async def complete_registration(
    user_data: UserRegistrationRequest,
    db: Session = Depends(get_db)
):
    controller = AuthController(db, user_data)
    return await controller.register()
