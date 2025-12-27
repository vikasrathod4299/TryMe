from pydantic import BaseModel
from typing import Optional

class UploadRequest(BaseModel):
    avatar_filename: str
    outfit_filename: str
    avatar_content_type: Optional[str] = "image/jpeg"
    outfit_content_type: Optional[str] = "image/jpeg"

class UploadResponse(BaseModel):
    avatar: dict
    outfit: dict

class ConfirmUploadResponse(BaseModel):
    avatar_url: str
    outfit_url: str
    job_id: str

    class Config:
        from_attributes = True
