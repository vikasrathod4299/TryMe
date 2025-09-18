from sqlalchemy import Column, DateTime
from sqlalchemy.sql import func
from app.config.database import Base
import uuid
from sqlalchemy.dialects.postgresql import UUID


class BaseModel(Base):
    """Base model for all database entities with common fields."""
    __abstract__ = True
    
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        unique=True,
        nullable=False
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())