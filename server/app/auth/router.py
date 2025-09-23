from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.user.model import User
from app.auth.serializer import (
    UserRegistrationRequest, AuthResponse, UserLoginRequest, LogoutPayload
)
from .controllers import AuthController
from app.config.serializer import ResponseModel
from app.middlewares.dependencies import get_current_user

router = APIRouter()


@router.post("/register", response_model=ResponseModel[AuthResponse])
async def complete_registration(
    user_data: UserRegistrationRequest,
    db: Session = Depends(get_db)
):
    controller = AuthController(db)

    result = await controller.register(user_data)

    return { "message": "Registration successful", "data": result }

@router.post("/login", response_model=ResponseModel[AuthResponse])
def login(
    login_data: UserLoginRequest,
    db: Session = Depends(get_db)
):
    controller = AuthController(db)

    result = controller.login(login_data)

    return { "message": "Login successful", "data": result }

@router.post("/logout", response_model=ResponseModel)
def logout(
    logout_data: LogoutPayload,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user), 
):
    controller = AuthController(db)

    controller.logout(logout_data=logout_data, user_id=user.id)

    return { "message": "Logout successful" }