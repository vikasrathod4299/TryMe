from pydantic import BaseModel
from typing import TypeVar, Optional, Generic, List

T = TypeVar('T')

class ResponseModel(BaseModel, Generic[T]):
    message: str
    data: Optional[T] | List[T] | None = None

    class Config:
        orm_mode = True
        