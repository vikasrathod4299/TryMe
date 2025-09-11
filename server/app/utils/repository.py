from typing import TypeVar, Generic, Type, Optional, List, Dict, Any, Union
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config.BaseModel import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)

class BaseRepository(Generic[ModelType]):
    """Base repository providing common database operations"""

    def __init__(self, model: Type[ModelType], db:Session):
        self.model = model
        self.db = db

    def get(self, id: Union[int, str]) -> Optional[ModelType]:
        """Retrieve a record by its ID"""
        return self.db.query(self.model).filter(self.model.id == id).first()

    def get_all(self) -> List[ModelType]:
        """Retrieve all records"""
        return self.db.query(self.model).all()
    
    def find_one(self, **filters) -> Optional[ModelType]:
        query = self.db.query(self.model)
        for key, value in filters.items():
            if hasattr(self.model, key):
                query = query.filter(getattr(self.model, key) == value)
            return query.first()

    def create(self, obj_in: Dict[str, Any]) -> ModelType:
        """Create a new record"""
        try:
            db_obj = self.model(**obj_in)
            self.db.add(db_obj)
            self.db.commit()
            self.db.refresh(db_obj)
            return db_obj
        except IntegrityError as e:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e.orig))
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error")

    def update(self, db_obj: ModelType, obj_in: Dict[str, Any]) -> ModelType:
        """Update an existing record"""
        try:
            for field, value in obj_in.items():
                setattr(db_obj, field, value)
            self.db.add(db_obj)
            self.db.commit()
            self.db.refresh(db_obj)
            return db_obj
        except IntegrityError as e:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e.orig))
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error")

    def delete(self, id: Union[int, str]) -> ModelType:
        """Delete a record by its ID"""
        try:
            obj = self.db.query(self.model).get(id)
            if not obj:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
            self.db.delete(obj)
            self.db.commit()
            return obj
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error")