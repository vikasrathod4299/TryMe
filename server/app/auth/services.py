
from datetime import datetime, timedelta, timezone
from typing import Dict, Any
import jwt
from jwt.exceptions import ExpiredSignatureError, PyJWTError
from passlib.context import CryptContext
from passlib.hash import bcrypt
from fastapi import HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import random
import string
from fastapi import Depends
from app.config.settings import settings
from app.auth.enums import TokenType
from app.auth.model import RefreshToken

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.REFRESH_TOKEN_EXPIRE_DAYS

# Security scheme
security = HTTPBearer()

class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt"""
        return bcrypt.normhash(pwd_context.hash(password))

    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""

        normalized_hash = bcrypt.normhash(hashed_password)
        return pwd_context.verify(plain_password, normalized_hash)
    
    @staticmethod
    def create_access_token(data: Dict[str, Any]) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire, "type": TokenType.ACCESS})
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    @staticmethod
    def create_refresh_token(data: Dict[str, Any]) -> str:
        """Create JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": TokenType.REFRESH})
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    @staticmethod
    def decode_token(token: str) -> Dict[str, Any]:
        """Decode and validate JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
    
    @staticmethod
    def create_tokens(user_data: Dict[str, Any]) -> Dict[str, str]:
        """Create both access and refresh tokens"""
        access_token = AuthService.create_access_token(user_data)
        refresh_token = AuthService.create_refresh_token(user_data)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    @staticmethod
    def verify_refresh_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
        """Verify refresh token"""
        token = credentials.credentials
        payload = AuthService.decode_token(token)
        
        if payload.get("type") != TokenType.REFRESH:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        return payload

    @staticmethod
    def generate_verification_code() -> str:
            """Generate a 6-digit verification code"""
            return ''.join(random.choices(string.digits, k=6))
        
    @staticmethod
    def is_verification_code_valid(expires_at: Optional[datetime]) -> bool:
        """Check if verification code is still valid"""
        if not expires_at:
            return False
        return datetime.now(timezone.utc) < expires_at

    @staticmethod
    def get_verification_code_expiry() -> datetime:
        """Get expiry time for verification code"""
        return datetime.now(timezone.utc) + timedelta(minutes=settings.VERIFICATION_CODE_EXPIRE_MINUTES)
    
    @staticmethod
    def add_refresh_token_to_db(db, user_id: str, token: str) -> None:
        """Add refresh token to the database"""
        new_token = RefreshToken(user_id=user_id, token=token)
        db.add(new_token)
        db.commit()
        
        db.refresh(new_token)
    
    @staticmethod
    def revoke_refresh_token_in_db(db, token: str, user_id: str) -> str:
        """Revoke a refresh token in the database"""
        refresh_token = db.query(RefreshToken).filter_by(token=token, user_id=user_id, revoked=False).first()

        if refresh_token:
            refresh_token.revoked = True
            db.commit()
            db.refresh(refresh_token)

        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or already revoked refresh token"
            )
        return refresh_token


    @staticmethod
    def verify_refresh_token_in_db(db, token: str, user_id: str) -> RefreshToken:
        """Verify if the refresh token exists in the database"""
        refresh_token = db.query(RefreshToken).filter_by(token=token, user_id=user_id, revoked=False).first()

        print("hereeee")
        if refresh_token:
            refresh_token.revoked = True
            db.commit()
            db.refresh(refresh_token)
            print("not hereeee")
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or revoked refresh token"
            )

        return refresh_token.token