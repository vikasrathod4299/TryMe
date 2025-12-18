from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.config.database import get_db
from app.middlewares.dependencies import get_current_user
from app.user.model import User
from app.credits.service import CreditService
from app.credits.serializer import (
    CreditBalanceResponse,
    VerifyPaymentResponse,
    TransactionHistoryResponse,
    TransactionResponse,
    PackagesResponse,
    CREDIT_PACKAGES
)

router = APIRouter(prefix="/credits", tags=["Credits"])


# Razorpay request schemas
class CreateOrderRequest(BaseModel):
    package_id: str


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str
    package: dict


class VerifyRazorpayRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.get("/balance", response_model=CreditBalanceResponse)
def get_credit_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's credit balance"""
    user_credits = CreditService.get_or_create_user_credits(db, current_user.id)
    return CreditBalanceResponse(
        balance=user_credits.balance,
        total_purchased=user_credits.total_purchased,
        total_used=user_credits.total_used
    )


@router.get("/packages", response_model=PackagesResponse)
def get_credit_packages():
    """Get available credit packages for purchase"""
    return PackagesResponse(packages=CREDIT_PACKAGES)


@router.post("/create-order", response_model=CreateOrderResponse)
def create_razorpay_order(
    request: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a Razorpay order for purchasing credits"""
    try:
        print(f"Creating order for user {current_user.id}, package {request.package_id}")
        result = CreditService.create_razorpay_order(
            db=db,
            user_id=current_user.id,
            package_id=request.package_id,
        )
        print(f"Order created: {result}")
        return CreateOrderResponse(**result)
    except ValueError as e:
        print(f"ValueError: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")


@router.post("/verify-payment", response_model=VerifyPaymentResponse)
def verify_razorpay_payment(
    request: VerifyRazorpayRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Verify a Razorpay payment and add credits to user's account"""
    result = CreditService.verify_razorpay_payment(
        db=db,
        user_id=current_user.id,
        razorpay_order_id=request.razorpay_order_id,
        razorpay_payment_id=request.razorpay_payment_id,
        razorpay_signature=request.razorpay_signature
    )
    return VerifyPaymentResponse(**result)


@router.get("/history", response_model=TransactionHistoryResponse)
def get_transaction_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's credit transaction history"""
    transactions = CreditService.get_transaction_history(db, current_user.id, limit)
    return TransactionHistoryResponse(
        transactions=[
            TransactionResponse(
                id=t.id,
                type=t.type,
                amount=t.amount,
                balance_after=t.balance_after,
                price_paid=t.price_paid,
                currency=t.currency,
                status=t.status,
                description=t.description,
                created_at=t.created_at
            )
            for t in transactions
        ],
        total=len(transactions)
    )


@router.get("/check")
def check_credits(
    required: int = 1,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check if user has sufficient credits for an operation"""
    has_credits = CreditService.has_sufficient_credits(db, current_user.id, required)
    balance = CreditService.get_balance(db, current_user.id)
    return {
        "has_sufficient_credits": has_credits,
        "balance": balance,
        "required": required
    }
