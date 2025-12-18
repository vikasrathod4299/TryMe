from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.config.BaseModel import BaseModel
import enum


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class TransactionType(str, enum.Enum):
    PURCHASE = "purchase"      # User bought credits
    USAGE = "usage"            # Credits used for generation
    BONUS = "bonus"            # Free credits (signup, promo)
    REFUND = "refund"          # Refunded credits


class UserCredits(BaseModel):
    """Tracks user's current credit balance"""
    __tablename__ = "user_credits"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    balance = Column(Integer, default=0, nullable=False)
    total_purchased = Column(Integer, default=0, nullable=False)
    total_used = Column(Integer, default=0, nullable=False)
    
    # Relationships
    user = relationship("User", backref="credits")
    
    def __repr__(self):
        return f"<UserCredits(user_id={self.user_id}, balance={self.balance})>"


class CreditTransaction(BaseModel):
    """Tracks all credit transactions"""
    __tablename__ = "credit_transactions"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    amount = Column(Integer, nullable=False)  # Positive for add, negative for deduct
    balance_after = Column(Integer, nullable=False)
    
    # Payment details (for purchases)
    stripe_payment_id = Column(String(255), nullable=True)
    stripe_session_id = Column(String(255), nullable=True)
    price_paid = Column(Float, nullable=True)  # In USD
    currency = Column(String(10), default="usd")
    status = Column(Enum(TransactionStatus), default=TransactionStatus.COMPLETED)
    
    # Description
    description = Column(String(500), nullable=True)
    
    # Relationships
    user = relationship("User", backref="credit_transactions")
    
    def __repr__(self):
        return f"<CreditTransaction(user_id={self.user_id}, type={self.type}, amount={self.amount})>"
