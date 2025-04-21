from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from typing import List, Optional
from models.order import InvoiceCreate, PayrollCreate, OrderUpdate, OrderResponse
from models.common import PaginatedResponse
from database import get_db
from middleware.auth import get_current_user, admin_required
from utils.helpers import generate_order_number, compute_invoice_totals, compute_recipient_net_pay, check_owner_or_admin
from bson import ObjectId
import structlog
from datetime import datetime

router = APIRouter()
logger = structlog.get_logger()

@router.post("/invoice", response_model=OrderResponse)
async def create_invoice(
    invoice: InvoiceCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new invoice"""
    db = get_db()
    
    # Generate order number if not provided
    if not invoice.orderNo:
        invoice.orderNo = generate_order_number()
    
    # Set owner to current user
    invoice.owner = str(current_user["_id"])
    
    # Calculate totals
    totals = compute_invoice_totals(invoice.items, invoice.tax)
    
    # Create invoice document
    invoice_dict = invoice.dict()
    invoice_dict.update({
        "type": "invoice",
        "subtotal": totals["subtotal"],
        "total": totals["total"]
    })
    
    # Insert into database
    result = await db.orders.insert_one(invoice_dict)
    
    # Get created invoice
    created_invoice = await db.orders.find_one({"_id": result.inserted_id})
    
    # Convert ObjectId to string
    created_invoice["id"] = str(created_invoice.pop("_id"))
    
    return created_invoice

@router.post("/payroll", response_model=OrderResponse)
async def create_payroll(
    payroll: PayrollCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new payroll"""
    db = get_db()
    
    # Generate order number if not provided
    if not payroll.orderNo:
        payroll.orderNo = generate_order_number()
    
    # Set owner to current user
    payroll.owner = str(current_user["_id"])
    
    # Calculate totals
    totals = compute_recipient_net_pay(payroll.recipients)
    
    # Create payroll document
    payroll_dict = payroll.dict()
    payroll_dict.update({
        "type": "payroll",
        "grossPay": totals["grossPay"],
        "netPay": totals["netPay"],
        "total": totals["netPay"]  # Set total to netPay for consistency
    })
    
    # Insert into database
    result = await db.orders.insert_one(payroll_dict)
    
    # Get created payroll
    created_payroll = await db.orders.find_one({"_id": result.inserted_id})
    
    # Convert ObjectId to string
    created_payroll["id"] = str(created_payroll.pop("_id"))
    
    return created_payroll

@router.get("/", response_model=PaginatedResponse)
async def get_orders(
    type: Optional[str] = None,
    status: Optional[str] = None,
    owner: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get list of orders with pagination and filters"""
    db = get_db()
    
    # Build query
    query = {}
    
    # Filter by type
    if type:
        query["type"] = type
    
    # Filter by status
    if status:
        query["status"] = status
    
    # Filter by owner
    if owner:
        query["owner"] = owner
    elif not current_user.get("is_admin"):
        # Non-admin users can only see their own orders
        query["owner"] = str(current_user["_id"])
    
    # Count total documents
    total = await db.orders.count_documents(query)
    
    # Pagination
    skip = (page - 1) * page_size
    
    # Get orders
    cursor = db.orders.find(query).sort("created_at", -1).skip(skip).limit(page_size)
    orders = await cursor.to_list(length=page_size)
    
    # Convert ObjectId to string
    for order in orders:
        order["id"] = str(order.pop("_id"))
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "data": orders
    }

@router.get("/{order_no}", response_model=OrderResponse)
async def get_order(
    order_no: str,
    current_user: dict = Depends(get_current_user)
):
    """Get order by order number"""
    db = get_db()
    
    # Get order
    order = await db.orders.find_one({"orderNo": order_no})
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if user has permission to view this order
    if not check_owner_or_admin(current_user, order["owner"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Convert ObjectId to string
    order["id"] = str(order.pop("_id"))
    
    return order

@router.put("/{order_no}", response_model=OrderResponse)
async def update_order(
    order_no: str,
    order_update: OrderUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update order"""
    db = get_db()
    
    # Get order
    order = await db.orders.find_one({"orderNo": order_no})
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if user has permission to update this order
    if not check_owner_or_admin(current_user, order["owner"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if order is already paid
    if order["status"] == "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update a paid order"
        )
    
    # Update order
    update_data = order_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    # Recalculate totals if items or tax are updated
    if order["type"] == "invoice" and (update_data.get("items") or "tax" in update_data):
        items = update_data.get("items", order.get("items", []))
        tax = update_data.get("tax", order.get("tax", 0))
        
        totals = compute_invoice_totals(items, tax)
        update_data.update({
            "subtotal": totals["subtotal"],
            "total": totals["total"]
        })
    
    # Recalculate totals if recipients are updated
    if order["type"] == "payroll" and update_data.get("recipients"):
        recipients = update_data.get("recipients")
        
        totals = compute_recipient_net_pay(recipients)
        update_data.update({
            "grossPay": totals["grossPay"],
            "netPay": totals["netPay"],
            "total": totals["netPay"]
        })
    
    if update_data:
        await db.orders.update_one(
            {"orderNo": order_no},
            {"$set": update_data}
        )
    
    # Get updated order
    updated_order = await db.orders.find_one({"orderNo": order_no})
    
    # Convert ObjectId to string
    updated_order["id"] = str(updated_order.pop("_id"))
    
    return updated_order

@router.delete("/{order_no}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_no: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete order"""
    db = get_db()
    
    # Get order
    order = await db.orders.find_one({"orderNo": order_no})
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if user has permission to delete this order
    if not check_owner_or_admin(current_user, order["owner"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if order is already paid
    if order["status"] == "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a paid order"
        )
    
    # Delete order
    await db.orders.delete_one({"orderNo": order_no})
    
    return None

@router.post("/{order_no}/pay", response_model=OrderResponse)
async def mark_order_as_paid(
    order_no: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark order as paid"""
    db = get_db()
    
    # Get order
    order = await db.orders.find_one({"orderNo": order_no})
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if user has permission to update this order
    if not check_owner_or_admin(current_user, order["owner"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if order is already paid
    if order["status"] == "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already paid"
        )
    
    # Update order status
    await db.orders.update_one(
        {"orderNo": order_no},
        {
            "$set": {
                "status": "paid",
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # If this is an invoice with items that manage stock, reduce stock
    if order["type"] == "invoice" and "items" in order:
        for item in order["items"]:
            if item.get("manageStock") and item.get("stock") is not None:
                # This is a simplified example - in a real app, you'd have a products collection
                # and would update the stock there
                logger.info(
                    "Stock reduction would happen here",
                    item=item["title"],
                    quantity=item["quantity"]
                )
    
    # Get updated order
    updated_order = await db.orders.find_one({"orderNo": order_no})
    
    # Convert ObjectId to string
    updated_order["id"] = str(updated_order.pop("_id"))
    
    return updated_order