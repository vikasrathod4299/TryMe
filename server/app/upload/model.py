from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship 
from app.config.BaseModel import BaseModel
import enum

class UploadStatus(enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class UserUpload(BaseModel):
    __tablename__ = "user_uploads"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    avatar_key = Column(String, nullable=False)
    outfit_key = Column(String, nullable=False)
    result_key = Column(String, nullable=True) 
    status = Column(String, default=UploadStatus.PENDING.value)

    # Relationships
    user = relationship("User", back_populates="user_uploads")