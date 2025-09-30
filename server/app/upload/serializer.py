from pydantic import BaseModel

class UploadRequest(BaseModel):
    avatar_filename: str
    outfit_filename: str

class UploadResponse(BaseModel):
    avatar: dict
    outfit: dict

class ConfirmUploadResponse(BaseModel):
    avatar_url: str
    outfit_url: str

    class Config:
        from_attributes = True
