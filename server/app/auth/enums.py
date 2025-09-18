from enum import Enum

class UserRole(str, Enum):
    """User roles in the system"""
    ADMIN = "admin"
    USER = "user"

class TokenType(str, Enum):
    """JWT token types"""
    ACCESS = "access"
    REFRESH = "refresh"