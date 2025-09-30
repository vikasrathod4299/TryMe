from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi import Form
from app.upload.serializer import UploadRequest, UploadResponse, ConfirmUploadResponse
from app.middlewares.dependencies import get_current_user
from app.user.model import User
from app.config.serializer import ResponseModel
from app.config.database import get_db
from app.upload.controller import UploadController


router = APIRouter()
@router.post("/generate-upload-urls", response_model=ResponseModel[UploadResponse])
async def generate_upload_urls(req: UploadRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):

    userUploadController = UploadController(db)

    result = await userUploadController.generate_upload_urls(req, user.id)

    return {"message": "Upload URLs generated successfully.", "data": result}


@router.post("/confirm-upload", response_model=ResponseModel[ConfirmUploadResponse])
async def confirm_upload(avatar_key: str = Form(...), outfit_key: str = Form(...), db:Session=Depends(get_db),user: User = Depends(get_current_user)):
    
    userUploadController = UploadController(db)

    try:
        result = await userUploadController.confirm_upload(avatar_key, outfit_key, user.id)
    except ValueError as e:
        return {"detail": str(e)}

    return {"message": "Upload confirmed successfully.", "data": result}
