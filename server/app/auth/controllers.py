from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.user.model import User
from app.user.serializer import UserProfile
from app.utils.repository import BaseRepository
from app.auth.serializer import UserRegistrationRequest, AuthResponse, UserLoginRequest, LogoutPayload
from app.auth.services import AuthService 

class AuthController(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(User, db)

    async def register(self, user_data: UserRegistrationRequest):
        user_dict = user_data.model_dump()
        user_dict['is_verified'] = False

        existing_user = self.find_one(email=user_dict['email'])

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )


        user_dict.pop('confirm_password', None)

        hashed_password = AuthService.hash_password(user_dict['password'])
        user_dict['password'] = hashed_password

        user = self.create(user_dict)
        tokens = AuthService.create_tokens({"sub": user.id})

        AuthService.add_refresh_token_to_db(self.db, user.id, tokens['refresh_token'])

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

    def login(self, login_data: UserLoginRequest):

        user = self.find_one(email=login_data.email)

        if not user or not AuthService.verify_password(login_data.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified. Please verify your email to activate your account."
            )


        tokens = AuthService.create_tokens({"sub": str(user.id)})

        print('tokens',tokens)

        AuthService.add_refresh_token_to_db(self.db, user.id, tokens['refresh_token'])

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
            message="Login successful."
        )


    def logout(self, logout_data: LogoutPayload, user_id: str):
        """veryfy the refresh token and delete it from the database"""
        AuthService.revoke_refresh_token_in_db(self.db, logout_data.refresh_token, user_id)

        return {"message": "Logout successful."}