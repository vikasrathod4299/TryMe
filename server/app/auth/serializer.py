from typing_extensions import Annotated
from pydantic import BaseModel, EmailStr, Field, field_validator

class UserRegistrationRequest(BaseModel):
    email: Annotated[EmailStr, Field(title="User email", description="The email of the user to register" ,pattern=r"^[\w\.-]+@[\w\.-]+\.\w{2,4}$")]
    password: Annotated[str, Field(title="User password", description="The password of the user to register", min_length=8)]
    confirm_password: Annotated[str, Field(title="Confirm password", description="The confirmation of the password", min_length=8)]
    full_name: Annotated[str, Field(title="Full name", description="The full name of the user", min_length=1, max_length=100)]

    @field_validator('confirm_password')
    def check_passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError("Passwords do not match")
        return v

class UserLoginRequest(BaseModel):
    email: Annotated[EmailStr, Field(title="User email", description="The email of the user to login", pattern=r"^[\w\.-]+@[\w\.-]+\.\w{2,4}$")]
    password: Annotated[str, Field(title="User password", description="The password of the user to login", min_length=8)]


class AuthResponse(BaseModel):
    """Response model for authentication endpoints."""
    access_token: Annotated[str, Field(title="Access Token", description="JWT access token for authenticated user")]
    token_type: Annotated[str, Field(title="Token Type", description="Type of the token, typically 'bearer'")]
    message: Annotated[str, Field(title="Message", description="A message indicating the result of the authentication process")]