import random
import string
import uuid
from typing import List, Dict, Any
import structlog
from models.order import Item, Recipient

logger = structlog.get_logger()

def generate_7_char_username() -> str:
    """Generate a random 7-character username"""
    chars = string.ascii_lowercase + string.digits
    return ''.join(random.choice(chars) for _ in range(7))

def generate_order_number() -> str:
    """Generate a unique order number"""
    # Format: ORD-{first 8 chars of UUID4}
    return f"ORD-{str(uuid.uuid4())[:8].upper()}"

def generate_payment_number() -> str:
    """Generate a unique payment number"""
    # Format: PAY-{first 8 chars of UUID4}
    return f"PAY-{str(uuid.uuid4())[:8].upper()}"

def compute_invoice_totals(items: List[Item], tax_rate: float = 0) -> Dict[str, float]:
    """Calculate invoice totals"""
    if not items:
        return {"subtotal": 0, "tax": 0, "total": 0}
    
    subtotal = sum(item.price * item.quantity for item in items)
    tax = subtotal * tax_rate / 100 if tax_rate else 0
    total = subtotal + tax
    
    return {
        "subtotal": round(subtotal, 2),
        "tax": round(tax, 2),
        "total": round(total, 2)
    }

def compute_recipient_net_pay(recipients: List[Recipient]) -> Dict[str, float]:
    """Calculate payroll totals"""
    if not recipients:
        return {"grossPay": 0, "netPay": 0}
    
    gross_pay = sum(recipient.amount for recipient in recipients)
    net_pay = sum(recipient.amount + recipient.bonus - recipient.deduction for recipient in recipients)
    
    return {
        "grossPay": round(gross_pay, 2),
        "netPay": round(net_pay, 2)
    }

def check_owner_or_admin(user: Dict[str, Any], owner_id: str) -> bool:
    """Check if user is owner or admin"""
    user_id = str(user.get("_id"))
    is_admin = user.get("is_admin", False)
    
    return user_id == owner_id or is_admin