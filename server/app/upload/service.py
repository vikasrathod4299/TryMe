import uuid
import boto3
from app.config.settings import settings
from app.upload.model import UserUpload
from app.utils.repository import BaseRepository

s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION,
)

class UploadService:
    @staticmethod
    def generate_s3_key(user_id:str, folder:str, filename:str):
        ext = filename.split('.')[-1]
        key = f"users/{user_id}/{folder}/{uuid.uuid4()}.{ext}"
        return key

    @staticmethod
    def generate_upload_url(file_key:str, content_type:str = 'image/jpeg', expiration=3600) -> str:

        return s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.S3_BUCKET_NAME,
                "Key": file_key,
                "ContentType": content_type,
            },
            ExpiresIn=expiration
        )

    @staticmethod
    def get_view_url(file_key:str, expiration=3600) -> str:
        return s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.S3_BUCKET_NAME,
                "Key": file_key,
            },
            ExpiresIn=expiration
        )
    
    @staticmethod
    def add_user_upload(user_upload: UserUpload):
        # Here you would typically add the user_upload instance to the database
        baseRepository = BaseRepository(UserUpload)  # You need to provide a valid DB session

        baseRepository.create({
            "user_id": user_upload.user_id,
            "avatar_key": user_upload.avatar_key,
            "outfit_key": user_upload.outfit_key,
            "processed": False
        })