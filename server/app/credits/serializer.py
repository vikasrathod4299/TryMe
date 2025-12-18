from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum
from uuid import UUID


class TransactionType(str, Enum):
    PURCHASE = "purchase"
    USAGE = "usage"
    BONUS = "bonus"
    REFUND = "refund"


class TransactionStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


# Credit Packages - USD pricing for global users
class CreditPackage(BaseModel):
    id: str
    name: str
    credits: int
    price: float  # INR for India
    currency: str = "inr"
    popular: bool = False


# Pricing in INR (Indian Rupees)
CREDIT_PACKAGES: List[CreditPackage] = [
    CreditPackage(id="starter", name="Starter", credits=10, price=49, currency="inr"),
    CreditPackage(id="popular", name="Popular", credits=25, price=99, currency="inr", popular=True),
    CreditPackage(id="pro", name="Pro", credits=60, price=199, currency="inr"),
    CreditPackage(id="ultimate", name="Ultimate", credits=200, price=499, currency="inr"),
]


# Response schemas
class CreditBalanceResponse(BaseModel):
    balance: int
    total_purchased: int
    total_used: int

    class Config:
        from_attributes = True


class TransactionResponse(BaseModel):
    id: UUID
    type: TransactionType
    amount: int
    balance_after: int
    price_paid: Optional[float] = None
    currency: Optional[str] = None
    status: TransactionStatus
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionHistoryResponse(BaseModel):
    transactions: List[TransactionResponse]
    total: int


# Request schemas
class CreateCheckoutRequest(BaseModel):
    package_id: str
    success_url: str
    cancel_url: str


class CreateCheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str


class VerifyPaymentRequest(BaseModel):
    session_id: str


class VerifyPaymentResponse(BaseModel):
    success: bool
    credits_added: int
    new_balance: int
    message: str


class PackagesResponse(BaseModel):
    packages: List[CreditPackage]
