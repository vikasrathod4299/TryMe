from fastapi import APIRouter, Form
from fastapi import Depends
from app.user.service import UserService
from app.middlewares.dependencies import get_current_user
from app.user.model import User

router = APIRouter()

