from sqlalchemy.orm import Session
from app.upload.model import UploadStatus, UserUpload
from app.upload.serializer import UploadRequest, UploadResponse, ConfirmUploadResponse
from app.upload.service import UploadService



class UploadController:

    def __init__(self, db: Session):
        self.uploadService = UploadService(db)
        self.db = db

    async def generate_upload_urls(self, req: UploadRequest, user_id: str) -> UploadResponse:
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

    async def confirm_upload(self, avatar_key: str, outfit_key: str, user_id: str) -> ConfirmUploadResponse:

        try:
            self.uploadService.verify_user_upload(avatar_key, outfit_key)
        except ValueError as e:
            return {"detail": str(e)}


        avatar_url = self.uploadService.get_view_url(avatar_key)
        outfit_url = self.uploadService.get_view_url(outfit_key)

        userUpload = self.uploadService.find_one(avatar_key=avatar_key, outfit_key=outfit_key, user_id=user_id)

        if not userUpload:
            raise ValueError("No matching upload record found.")

        if userUpload.status != UploadStatus.PENDING.value:
            raise ValueError(f"Upload already processed with status {userUpload.status}.")

        job_data = {
            "job_id": str(userUpload.id),   
            "avatar_key": avatar_key,
            "outfit_key": outfit_key
        }

        self.uploadService.update(userUpload, {"status": UploadStatus.PROCESSING.value})

        self.uploadService.enqueue_processing_job(job_data)
        
        return {
            "avatar_url": avatar_url,
            "outfit_url": outfit_url
        }