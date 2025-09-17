from fastapi import APIRouter, Depends
from fastapi import Form
from app.upload.model import UserUpload
from app.user.service import UserService
from app.upload.serializer import UploadRequest
from app.middlewares.dependencies import get_current_user
from app.user.model import User
from app.upload.service import UploadService


router = APIRouter()

@router.post("/generate-upload-urls")
async def generate_upload_urls(req:UploadRequest, user: User = Depends(get_current_user)):
    avatar_key = UploadService.generate_s3_key(user.id, "avatars", req.avatar_filename)
    outfit_key = UploadService.generate_s3_key(user.id, "outfits", req.outfit_filename)

    UploadService.add_user_upload(
        UserUpload(
            user_id=user.id,
            avatar_key=avatar_key,
            outfit_key=outfit_key,
            processed=False
        )
    )

    return {
        "avatar": {
            "file_key": avatar_key,
            "upload_url": UploadService.generate_upload_url(avatar_key, content_type="image/jpeg"),
            "view_url": UploadService.get_view_url(avatar_key)
        },
        "outfit": {
            "file_key": outfit_key,
            "upload_url": UploadService.generate_upload_url(outfit_key, content_type="image/jpeg"),
            "view_url": UploadService.get_view_url(outfit_key)
        }
    }