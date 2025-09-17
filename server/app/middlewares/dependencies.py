from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from app.auth.services import AuthService
from app.config.database import get_db
from app.user.service import UserService
from sqlalchemy.orm import Session


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(db:Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    try: 
        payload = AuthService.decode_token(token)

        user_id: str = payload.get("sub")

        if user_id is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials")

        user = UserService.get_user_by_id(db,user_id)

        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
    
        return user

    except Exception as e:
        print(e, e.__traceback__.tb_lineno)
        raise HTTPException(status_code=401, detail="Could not validate credentials") from e
    