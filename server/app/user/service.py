from fastapi import HTTPException, status
from auth.services import AuthService
from user.model import  User
from sqlalchemy.orm import Session
from utils.repository import BaseRepository

class UserService(BaseRepository[User]):

    def __init__(self, db:Session):
        super().__init__(User, db)

            
