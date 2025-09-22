from sqlalchemy.orm import Session
from app.upload.model import UploadStatus, UserUpload
from app.upload.serializer import UploadRequest
from app.upload.service import UploadService



class UploadController:

    def __init__(self, db: Session):
        self.uploadService = UploadService(db)
        self.db = db

    async def generate_upload_urls(self, req: UploadRequest, user_id: str):
        avatar_key = self.uploadService.generate_s3_key(user_id, "avatars", req.avatar_filename)
        outfit_key = self.uploadService.generate_s3_key(user_id, "outfits", req.outfit_filename)

        self.uploadService.add_user_upload(
            UserUpload(
                user_id=user_id,
                avatar_key=avatar_key,
                outfit_key=outfit_key,
                status=UploadStatus.PENDING.value
            )
        )

        return {
            "avatar": {
                "upload_url": self.uploadService.generate_upload_url(avatar_key, content_type="image/jpeg"),
                "key": avatar_key
            },
            "outfit": {
                "upload_url": self.uploadService.generate_upload_url(outfit_key, content_type="image/jpeg"),
                "key": outfit_key
            }
        }