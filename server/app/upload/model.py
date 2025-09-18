from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship 
from app.config.BaseModel import BaseModel

class UserUpload(BaseModel):
    __tablename__ = "user_uploads"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    avatar_key = Column(String, nullable=False)
    outfit_key = Column(String, nullable=False)
    generated_key = Column(String, nullable=True) 
    processed = Column(Boolean, default=False)

    # Relationships
    user = relationship("User", back_populates="user_uploads")