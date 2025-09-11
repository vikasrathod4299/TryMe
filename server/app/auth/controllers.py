from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.user.model import User
from app.user.serializer import UserProfile
from app.utils.repository import BaseRepository
from app.auth.serializer import UserRegistrationRequest, AuthResponse
from app.auth.services import AuthService 

class AuthController(BaseRepository[User]):
    def __init__(self, db: Session, user_data: UserRegistrationRequest):
        super().__init__(User, db)
        self.user_data = user_data

    async def register(self):
        user_dict = self.user_data.model_dump()
        user_dict['is_verified'] = False

        existing_user = self.find_one(email=user_dict['email'])

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )

        tokens = AuthService.create_tokens({"sub": user_dict['email']})

        user_dict.pop('confirm_password', None)

        user = self.create(user_dict)

        user_profile =  UserProfile (
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            is_verified=user.is_verified,
            created_at=user.created_at,
        )

        return AuthResponse(
            user=user_profile,
            access_token=tokens['access_token'],
            refresh_token=tokens['refresh_token'],
            message="Registration successful. Please verify your email to activate your account."
        )

    def login(self, username, password):
        # Logic for user login
        pass

    def logout(self, user_id):
        # Logic for user logout
        pass