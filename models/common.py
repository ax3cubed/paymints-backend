from bson import ObjectId
from pydantic import BaseModel, Field
from typing import Optional, Any, List, Dict, Union
from datetime import datetime

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    data: list[Any]

# Base MongoDB Document Model
class MongoBaseModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True
        arbitrary_types_allowed = True
        
    def dict(self, **kwargs):
        """Override dict method to convert ObjectId to string"""
        kwargs.pop("by_alias", None)
        return super().dict(by_alias=True, **kwargs)