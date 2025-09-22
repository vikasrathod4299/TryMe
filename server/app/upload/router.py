from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi import Form
from app.upload.model import UploadStatus
from app.upload.serializer import UploadRequest
from app.middlewares.dependencies import get_current_user
from app.user.model import User
from app.config.database import get_db
from app.upload.service import UploadService
from app.upload.controller import UploadController


router = APIRouter()
@router.post("/generate-upload-urls")
async def generate_upload_urls(req: UploadRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):

    userUploadController = UploadController(db)

    return await userUploadController.generate_upload_urls(req, user.id)


@router.post("/confirm-upload")
async def confirm_upload(avatar_key: str = Form(...), outfit_key: str = Form(...), db:Session=Depends(get_db),user: User = Depends(get_current_user)):
    uploadService = UploadService(db)
    try:
        uploadService.verify_user_upload(avatar_key, outfit_key)
    except HTTPException as e:
        raise e

    avatar_url = uploadService.get_view_url(avatar_key)
    outfit_url = uploadService.get_view_url(outfit_key)

    userUpload = uploadService.find_one(avatar_key=avatar_key, outfit_key=outfit_key, user_id=user.id)
    if not userUpload:
        return {"error": "Upload record not found."}

    if userUpload.status != UploadStatus.PENDING.value:
        return {"error": f"Upload already processed with status {userUpload.status}."}

    
    job_data = {
        "job_id": str(userUpload.id),   
        "avatar_key": avatar_key,
        "outfit_key": outfit_key
    }

    uploadService.enqueue_processing_job(job_data)
    

    uploadService.update(userUpload, {"status": UploadStatus.PROCESSING.value})

    return {
        "avatar_url": avatar_url,
        "outfit_url": outfit_url
    }