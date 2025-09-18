from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.user.model import User
from .serializer import (
    UserRegistrationRequest, AuthResponse, UserLoginRequest, LogoutPayload
)
from .controllers import AuthController
from app.middlewares.dependencies import get_current_user

router = APIRouter()


@router.post("/register", response_model=AuthResponse)
async def complete_registration(
    user_data: UserRegistrationRequest,
    db: Session = Depends(get_db)
):
    controller = AuthController(db)
    return await controller.register(user_data)


@router.post("/login", response_model=AuthResponse)
def login(
    login_data: UserLoginRequest,
    db: Session = Depends(get_db)
):
    controller = AuthController(db)
    return controller.login(login_data)

@router.post("/logout", response_model=dict)
def logout(
    logout_data: LogoutPayload,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user), 
):
    controller = AuthController(db)
    return controller.logout(logout_data=logout_data, user_id=user.id)