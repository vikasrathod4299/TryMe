import uuid
import boto3
from botocore.config import Config
import json
import os
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.config.settings import settings
from app.upload.model import UserUpload 
from app.utils.repository import BaseRepository

# In Lambda/production, use IAM role credentials (boto3 handles this automatically)
# In local development, use explicit credentials from settings
is_lambda = os.environ.get("AWS_LAMBDA_FUNCTION_NAME") is not None
region = os.environ.get("AWS_REGION", settings.AWS_REGION)

# Configure S3 to use virtual-hosted style URLs with the correct region
s3_config = Config(
    region_name=region,
    signature_version='s3v4',
    s3={'addressing_style': 'virtual'}
)

if is_lambda or settings.ENVIRONMENT == "production":
    # Let boto3 use IAM role credentials
    s3_client = boto3.client("s3", config=s3_config)
    sqs_client = boto3.client("sqs", region_name=region)
else:
    # Use explicit credentials for local development
    s3_client = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=s3_config,
    )
    sqs_client = boto3.client(
        "sqs",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=region,
    )

class UploadService(BaseRepository[UserUpload]):
    def __init__(self, db: Session):
        super().__init__(UserUpload, db)

    def generate_s3_key(self, user_id:str, folder:str, filename:str, job_id:str) -> str:
        ext = filename.split('.')[-1]
        key = f"user_{user_id}/job_{job_id}/{folder}/{filename}_{uuid.uuid4()}.{ext}"
        return key

    def generate_upload_url(self, file_key:str, content_type:str = 'image/jpeg', expiration=3600) -> str:

        return s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.S3_BUCKET_NAME,
                "Key": file_key,
                "ContentType": content_type,
            },
            ExpiresIn=expiration
        )

    def get_view_url(self,file_key:str, expiration=3600) -> str:
        return s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.S3_BUCKET_NAME,
                "Key": file_key,
            },
            ExpiresIn=expiration
        )

    def add_user_upload(self, user_upload: UserUpload):

        res = self.create({
            "user_id": user_upload.user_id,
            "avatar_key": user_upload.avatar_key,
            "outfit_key": user_upload.outfit_key,
            "status":   user_upload.status
        })

        return res
    
    def verify_user_upload(self, avatar_key: str, outfit_key: str) -> bool:
        for key in [avatar_key, outfit_key]:
            try:
                s3_client.head_object(Bucket=settings.S3_BUCKET_NAME, Key=key)
            except s3_client.exceptions.NoSuchKey:
                return HTTPException(status_code=404, detail=f"File with key {key} not found in S3.")

        return True

    def enqueue_processing_job(self, job_data: dict):
        response = sqs_client.send_message(
            QueueUrl=settings.SQS_QUEUE_URL,
            MessageBody=json.dumps(job_data)
        )
        return response

