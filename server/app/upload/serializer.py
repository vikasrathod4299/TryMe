from pydantic import BaseModel

class UploadRequest(BaseModel):
    avatar_filename: str
    outfit_filename: str