from pydantic import BaseModel
from typing import TypeVar, Optional, Generic, List

T = TypeVar('T')

class ResponseModel(BaseModel, Generic[T]):
    message: Optional[str] = None
    data: Optional[T] | List[T] | None = None
    detail: Optional[str] = None

    class Config:
        from_attributes = True
        