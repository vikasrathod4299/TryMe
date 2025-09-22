from datetime import datetime
from pydantic import BaseModel, Field
from typing_extensions import Annotated
import uuid

class UserProfile(BaseModel):
    """User profile response"""
    id: Annotated[uuid.UUID, Field(..., description="The unique identifier of the user")]
    email: Annotated[str, Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')]
    full_name: str
    is_verified: bool = True
    created_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }