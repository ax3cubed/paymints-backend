from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from models.payment import PaymentCreate, PaymentUpdate, PaymentResponse
from models.common import PaginatedResponse
from database import get_db
from middleware.auth import get_current_user, admin_required
from utils.helpers import generate_payment_number, check_owner_or_admin
from services.email import send_payment_receipt
from bson import ObjectId
import structlog
from datetime import datetime

router = APIRouter()
logger = structlog.get_logger()

@router.post("/", response_model=PaymentResponse)
async def create_payment(
    payment: PaymentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new payment"""
    db = get_db()
    
    # Generate payment number if not provided
    if not payment.paymentNo:
        payment.paymentNo = generate_payment_number()
    
    # Check if order exists
    order = await db.orders.find_one({"orderNo": payment.orderRef})
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referenced order not found"
        )
    
    # Check if user has permission to create payment for this order
    if not check_owner_or_admin(current_user, order["owner"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Create payment document
    payment_dict = payment.dict()
    
    # Insert into database
    result = await db.payments.insert_one(payment_dict)
    
    # Get created payment
    created_payment = await db.payments.find_one({"_id": result.inserted_id})
    
    # If payment status is completed, mark order as paid
    if created_payment["status"] == "completed":
        await db.orders.update_one(
            {"orderNo": payment.orderRef},
            {
                "$set": {
                    "status": "paid",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Send payment receipt email
        if order.get("type") == "invoice" and order.get("clientName"):
            # In a real app, you'd get the client's email from a clients collection
            # This is a simplified example
            logger.info(
                "Would send payment receipt email here",
                payment_id=str(result.inserted_id),
                order_no=order["orderNo"]
            )
            # await send_payment_receipt(
            #     email_to="client@example.com",
            #     payment_data=created_payment,
            #     order_data=order
            # )
    
    # Convert ObjectId to string
    created_payment["id"] = str(created_payment.pop("_id"))
    
    return created_payment

@router.get("/", response_model=PaginatedResponse)
async def get_payments(
    order_ref: Optional[str] = None,
    status: Optional[str] = None,
    chain: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get list of payments with pagination and filters"""
    db = get_db()
    
    # Build query
    query = {}
    
    # Filter by order reference
    if order_ref:
        query["orderRef"] = order_ref
    
    # Filter by status
    if status:
        query["status"] = status
    
    # Filter by chain
    if chain:
        query["chain"] = chain
    
    # Non-admin users can only see payments for their orders
    if not current_user.get("is_admin"):
        # Get all orders owned by the user
        user_orders = await db.orders.find(
            {"owner": str(current_user["_id"])},
            {"orderNo": 1}
        ).to_list(length=1000)
        
        user_order_nos = [order["orderNo"] for order in user_orders]
        
        # Add filter for user's orders
        if user_order_nos:
            query["orderRef"] = {"$in": user_order_nos}
        else:
            # If user has no orders, return empty result
            return {
                "total": 0,
                "page": page,
                "page_size": page_size,
                "data": []
            }
    
    # Count total documents
    total = await db.payments.count_documents(query)
    
    # Pagination
    skip = (page - 1) * page_size
    
    # Get payments
    cursor = db.payments.find(query).sort("created_at", -1).skip(skip).limit(page_size)
    payments = await cursor.to_list(length=page_size)
    
    # Convert ObjectId to string
    for payment in payments:
        payment["id"] = str(payment.pop("_id"))
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "data": payments
    }

@router.get("/{payment_no}", response_model=PaymentResponse)
async def get_payment(
    payment_no: str,
    current_user: dict = Depends(get_current_user)
):
    """Get payment by payment number"""
    db = get_db()
    
    # Get payment
    payment = await db.payments.find_one({"paymentNo": payment_no})
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Check if user has permission to view this payment
    if not current_user.get("is_admin"):
        # Get the order
        order = await db.orders.find_one({"orderNo": payment["orderRef"]})
        
        if not order or order["owner"] != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    # Convert ObjectId to string
    payment["id"] = str(payment.pop("_id"))
    
    return payment

@router.put("/{payment_no}", response_model=PaymentResponse)
async def update_payment(
    payment_no: str,
    payment_update: PaymentUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update payment"""
    db = get_db()
    
    # Get payment
    payment = await db.payments.find_one({"paymentNo": payment_no})
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Check if user has permission to update this payment
    if not current_user.get("is_admin"):
        # Get the order
        order = await db.orders.find_one({"orderNo": payment["orderRef"]})
        
        if not order or order["owner"] != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    # Update payment
    update_data = payment_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    # Check if status is being updated to completed
    status_to_completed = (
        "status" in update_data and 
        update_data["status"] == "completed" and 
        payment["status"] != "completed"
    )
    
    if update_data:
        await db.payments.update_one(
            {"paymentNo": payment_no},
            {"$set": update_data}
        )
    
    # If payment status is updated to completed, mark order as paid
    if status_to_completed:
        await db.orders.update_one(
            {"orderNo": payment["orderRef"]},
            {
                "$set": {
                    "status": "paid",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Get the order for email
        order = await db.orders.find_one({"orderNo": payment["orderRef"]})
        
        # Send payment receipt email
        if order and order.get("type") == "invoice" and order.get("clientName"):
            # In a real app, you'd get the client's email from a clients collection
            logger.info(
                "Would send payment receipt email here",
                payment_no=payment_no,
                order_no=order["orderNo"]
            )
    
    # Get updated payment
    updated_payment = await db.payments.find_one({"paymentNo": payment_no})
    
    # Convert ObjectId to string
    updated_payment["id"] = str(updated_payment.pop("_id"))
    
    return updated_payment

@router.delete("/{payment_no}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment(
    payment_no: str,
    current_user: dict = Depends(admin_required)
):
    """Delete payment (admin only)"""
    db = get_db()
    
    # Get payment
    payment = await db.payments.find_one({"paymentNo": payment_no})
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Delete payment
    await db.payments.delete_one({"paymentNo": payment_no})
    
    return None