import razorpay
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.credits.model import UserCredits, CreditTransaction, TransactionType, TransactionStatus
from app.credits.serializer import CREDIT_PACKAGES, CreditPackage
from app.config.settings import settings

# Initialize Razorpay client
razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


class CreditService:
    """Service for managing user credits and payments"""
    
    @staticmethod
    def get_package_by_id(package_id: str) -> Optional[CreditPackage]:
        """Get a credit package by ID"""
        for package in CREDIT_PACKAGES:
            if package.id == package_id:
                return package
        return None
    
    @staticmethod
    def get_or_create_user_credits(db: Session, user_id: UUID) -> UserCredits:
        """Get user's credit balance, create if doesn't exist"""
        user_credits = db.query(UserCredits).filter(UserCredits.user_id == user_id).first()
        
        if not user_credits:
            # Create new credit record with free credits
            user_credits = UserCredits(
                user_id=user_id,
                balance=settings.FREE_CREDITS_ON_SIGNUP,
                total_purchased=0,
                total_used=0
            )
            db.add(user_credits)
            db.flush()
            
            # Record the bonus transaction
            transaction = CreditTransaction(
                user_id=user_id,
                type=TransactionType.BONUS,
                amount=settings.FREE_CREDITS_ON_SIGNUP,
                balance_after=settings.FREE_CREDITS_ON_SIGNUP,
                description="Welcome bonus - free credits on signup"
            )
            db.add(transaction)
            db.commit()
            db.refresh(user_credits)
        
        return user_credits
    
    @staticmethod
    def get_balance(db: Session, user_id: UUID) -> int:
        """Get user's current credit balance"""
        user_credits = CreditService.get_or_create_user_credits(db, user_id)
        return user_credits.balance
    
    @staticmethod
    def has_sufficient_credits(db: Session, user_id: UUID, required: int = 1) -> bool:
        """Check if user has sufficient credits"""
        balance = CreditService.get_balance(db, user_id)
        return balance >= required
    
    @staticmethod
    def deduct_credit(db: Session, user_id: UUID, amount: int = 1, description: str = "Image generation") -> bool:
        """Deduct credits from user's balance"""
        user_credits = CreditService.get_or_create_user_credits(db, user_id)
        
        if user_credits.balance < amount:
            return False
        
        user_credits.balance -= amount
        user_credits.total_used += amount
        
        # Record transaction
        transaction = CreditTransaction(
            user_id=user_id,
            type=TransactionType.USAGE,
            amount=-amount,
            balance_after=user_credits.balance,
            description=description
        )
        db.add(transaction)
        db.commit()
        
        return True
    
    @staticmethod
    def add_credits(
        db: Session, 
        user_id: UUID, 
        amount: int, 
        transaction_type: TransactionType = TransactionType.PURCHASE,
        razorpay_order_id: str = None,
        razorpay_payment_id: str = None,
        price_paid: float = None,
        description: str = None
    ) -> UserCredits:
        """Add credits to user's balance"""
        user_credits = CreditService.get_or_create_user_credits(db, user_id)
        
        user_credits.balance += amount
        if transaction_type == TransactionType.PURCHASE:
            user_credits.total_purchased += amount
        
        # Record transaction
        transaction = CreditTransaction(
            user_id=user_id,
            type=transaction_type,
            amount=amount,
            balance_after=user_credits.balance,
            stripe_session_id=razorpay_order_id,  # Reusing field for razorpay order id
            stripe_payment_id=razorpay_payment_id,  # Reusing field for razorpay payment id
            price_paid=price_paid,
            description=description or f"Added {amount} credits"
        )
        db.add(transaction)
        db.commit()
        db.refresh(user_credits)
        
        return user_credits
    
    @staticmethod
    def create_razorpay_order(
        db: Session,
        user_id: UUID,
        package_id: str,
    ) -> dict:
        """Create a Razorpay order for purchasing credits"""
        package = CreditService.get_package_by_id(package_id)
        if not package:
            raise ValueError(f"Invalid package ID: {package_id}")
        
        # Create Razorpay order
        # Amount is in paise (1 INR = 100 paise)
        # Use short user_id (first 8 chars) to keep receipt under 40 chars
        short_user_id = str(user_id).split('-')[0]
        order_data = {
            "amount": int(package.price * 100),
            "currency": "INR",
            "receipt": f"cr_{short_user_id}_{package_id}",
            "notes": {
                "user_id": str(user_id),
                "package_id": package_id,
                "credits": str(package.credits),
            }
        }
        
        order = razorpay_client.order.create(data=order_data)
        
        # Record pending transaction
        transaction = CreditTransaction(
            user_id=user_id,
            type=TransactionType.PURCHASE,
            amount=package.credits,
            balance_after=CreditService.get_balance(db, user_id),
            stripe_session_id=order["id"],  # Using stripe_session_id for razorpay order_id
            price_paid=package.price,
            currency=package.currency,
            status=TransactionStatus.PENDING,
            description=f"Purchase: {package.name} package"
        )
        db.add(transaction)
        db.commit()
        
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": settings.RAZORPAY_KEY_ID,
            "package": {
                "id": package.id,
                "name": package.name,
                "credits": package.credits,
                "price": package.price,
            }
        }
    
    @staticmethod
    def verify_razorpay_payment(
        db: Session, 
        user_id: UUID,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str
    ) -> dict:
        """Verify Razorpay payment and add credits"""
        try:
            # Verify signature
            params_dict = {
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            }
            
            razorpay_client.utility.verify_payment_signature(params_dict)
            
            # Get the pending transaction
            pending_transaction = db.query(CreditTransaction).filter(
                CreditTransaction.stripe_session_id == razorpay_order_id,
                CreditTransaction.status == TransactionStatus.PENDING
            ).first()
            
            if not pending_transaction:
                return {
                    "success": False,
                    "credits_added": 0,
                    "new_balance": CreditService.get_balance(db, user_id),
                    "message": "Order not found"
                }
            
            # Check if already processed
            if pending_transaction.status == TransactionStatus.COMPLETED:
                return {
                    "success": True,
                    "credits_added": 0,
                    "new_balance": CreditService.get_balance(db, user_id),
                    "message": "Payment already processed"
                }
            
            # Update transaction
            pending_transaction.status = TransactionStatus.COMPLETED
            pending_transaction.stripe_payment_id = razorpay_payment_id
            
            # Add credits
            credits_to_add = pending_transaction.amount
            user_credits = CreditService.get_or_create_user_credits(db, user_id)
            user_credits.balance += credits_to_add
            user_credits.total_purchased += credits_to_add
            
            # Update balance_after in transaction
            pending_transaction.balance_after = user_credits.balance
            
            db.commit()
            
            return {
                "success": True,
                "credits_added": credits_to_add,
                "new_balance": user_credits.balance,
                "message": f"Successfully added {credits_to_add} credits"
            }
            
        except razorpay.errors.SignatureVerificationError:
            return {
                "success": False,
                "credits_added": 0,
                "new_balance": CreditService.get_balance(db, user_id),
                "message": "Payment verification failed - invalid signature"
            }
        except Exception as e:
            return {
                "success": False,
                "credits_added": 0,
                "new_balance": CreditService.get_balance(db, user_id),
                "message": f"Error: {str(e)}"
            }
    
    @staticmethod
    def get_transaction_history(db: Session, user_id: UUID, limit: int = 50) -> list:
        """Get user's transaction history"""
        transactions = db.query(CreditTransaction).filter(
            CreditTransaction.user_id == user_id
        ).order_by(CreditTransaction.created_at.desc()).limit(limit).all()
        
        return transactions
