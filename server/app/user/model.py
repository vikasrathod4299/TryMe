from sqlalchemy import Column, DateTime, String, Boolean
from sqlalchemy.orm import relationship
from app.config.BaseModel import BaseModel

class User(BaseModel):
    """User model"""
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_verified = Column(Boolean, default=True)
    role = Column(String(20), default="user")
    verification_code = Column(String(6), nullable=True)
    verification_code_expires = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    user_uploads = relationship("UserUpload", back_populates="user", cascade="all, delete-orphan")

    
    def __repr__(self):
        return f"<User(email={self.email}, name={self.full_name})>"