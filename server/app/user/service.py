from fastapi import HTTPException, status
from fastapi import Depends
from requests import Session
from app.user.model import User
from app.config.database import get_db
from app.utils.repository import BaseRepository

class UserService:

    @staticmethod
    def get_user_by_id(db:Session,user_id: str) -> User:

        baseRepo = BaseRepository(User, db)
        user = baseRepo.find_one(id=user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user
    
