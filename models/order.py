from pydantic import BaseModel, Field, validator, root_validator
from typing import Optional, List, Literal, Dict, Any, Union
from datetime import datetime, timedelta
from bson import ObjectId
from models.common import PyObjectId

class Item(BaseModel):
    title: str
    description: Optional[str] = None
    quantity: int = 1
    price: float
    manageStock: bool = False
    stock: Optional[int] = None
    itemId: Optional[str] = None  # Reference to a product if applicable
    taxRate: Optional[float] = 0  # Individual item tax rate
    unit: Optional[str] = None  # e.g., "hour", "piece", "kg"
    
    @validator('quantity', 'stock')
    def validate_positive_numbers(cls, v, values):
        if v is not None and v < 0:
            raise ValueError("Value must be positive")
        return v
    
    @validator('price', 'taxRate')
    def validate_non_negative_numbers(cls, v):
        if v is not None and v < 0:
            raise ValueError("Value cannot be negative")
        return v

class Recipient(BaseModel):
    wallet: str
    amount: float
    bonus: Optional[float] = 0
    deduction: Optional[float] = 0
    email: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    notes: Optional[str] = None
    
    @validator('wallet')
    def wallet_address_must_be_valid(cls, v):
        if not v.startswith('0x') or len(v) != 42:
            raise ValueError('Invalid wallet address format')
        return v.lower()
    
    @validator('amount', 'bonus', 'deduction')
    def validate_financial_values(cls, v):
        if v is not None and v < 0:
            raise ValueError("Financial values cannot be negative")
        return v

class PaymentDetails(BaseModel):
    txHash: Optional[str] = None
    paymentMethod: Optional[str] = None  # crypto, bank, cash, etc.
    tokenAddress: Optional[str] = None  # If paid in crypto token
    paymentDate: Optional[datetime] = None
    confirmedDate: Optional[datetime] = None
    amountPaid: Optional[float] = None
    status: str = "pending"  # pending, confirmed, failed
    notes: Optional[str] = None
    
    @validator('tokenAddress')
    def validate_token_address(cls, v):
        if v is not None:
            if not v.startswith('0x') or len(v) != 42:
                raise ValueError('Invalid token address format')
            return v.lower()
        return v

class OrderBase(BaseModel):
    orderNo: str
    owner: str  # User ID of the creator
    status: str = "pending"  # pending, paid, cancelled, expired, partially_paid
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class InvoiceCreate(OrderBase):
    clientName: str
    clientEmail: Optional[str] = None
    clientWallet: Optional[str] = None
    items: List[Item]
    subtotal: Optional[float] = None
    tax: Optional[float] = 0
    discount: Optional[float] = 0
    total: Optional[float] = None
    expirationDate: Optional[datetime] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    isVisible: bool = True
    currency: str = "USD"
    
    @root_validator
    def compute_totals(cls, values):
        if 'items' in values and values['items']:
            items = values['items']
            subtotal = sum(item.price * item.quantity for item in items)
            values['subtotal'] = subtotal
            
            tax = values.get('tax', 0)
            discount = values.get('discount', 0)
            
            total = subtotal + tax - discount
            values['total'] = total
        
        if 'expirationDate' not in values or values['expirationDate'] is None:
            # Default expiration of 30 days
            values['expirationDate'] = datetime.utcnow() + timedelta(days=30)
            
        if 'clientWallet' in values and values['clientWallet']:
            if not values['clientWallet'].startswith('0x') or len(values['clientWallet']) != 42:
                raise ValueError('Invalid client wallet address format')
            values['clientWallet'] = values['clientWallet'].lower()
            
        return values

class PayrollCreate(OrderBase):
    payrollType: str  # regular, bonus, commission
    paymentCycle: str  # weekly, biweekly, monthly
    recipients: List[Recipient]
    netPay: Optional[float] = None
    grossPay: Optional[float] = None
    notes: Optional[str] = None
    currency: str = "USD"
    paymentDate: Optional[datetime] = None
    
    @root_validator
    def compute_pay_totals(cls, values):
        if 'recipients' in values and values['recipients']:
            recipients = values['recipients']
            gross = sum(recipient.amount for recipient in recipients)
            net = sum(recipient.amount + recipient.bonus - recipient.deduction for recipient in recipients)
            
            values['grossPay'] = gross
            values['netPay'] = net
            values['total'] = net  # Set total equal to netPay for consistency
            
        if 'paymentDate' not in values or values['paymentDate'] is None:
            # Default payment date of 7 days
            values['paymentDate'] = datetime.utcnow() + timedelta(days=7)
            
        return values

class OrderInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    orderNo: str
    owner: str
    type: str  # invoice or payroll
    status: str
    # Common fields for both types
    total: float
    currency: str = "USD"
    payments: List[PaymentDetails] = Field(default_factory=list)
    # Invoice specific fields
    clientName: Optional[str] = None
    clientEmail: Optional[str] = None
    clientWallet: Optional[str] = None
    items: Optional[List[Item]] = None
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    discount: Optional[float] = None
    expirationDate: Optional[datetime] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    isVisible: Optional[bool] = None
    # Payroll specific fields
    payrollType: Optional[str] = None
    paymentCycle: Optional[str] = None
    recipients: Optional[List[Recipient]] = None
    netPay: Optional[float] = None
    grossPay: Optional[float] = None
    paymentDate: Optional[datetime] = None
    # Timestamps
    created_at: datetime
    updated_at: datetime
    paid_at: Optional[datetime] = None
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    # Common fields
    currency: Optional[str] = None
    notes: Optional[str] = None
    # Invoice specific fields
    clientName: Optional[str] = None
    clientEmail: Optional[str] = None
    clientWallet: Optional[str] = None
    items: Optional[List[Item]] = None
    tax: Optional[float] = None
    discount: Optional[float] = None
    expirationDate: Optional[datetime] = None
    terms: Optional[str] = None
    isVisible: Optional[bool] = None
    # Payroll specific fields
    payrollType: Optional[str] = None
    paymentCycle: Optional[str] = None
    recipients: Optional[List[Recipient]] = None
    paymentDate: Optional[datetime] = None
    
    class Config:
        arbitrary_types_allowed = True
        
    @validator('clientWallet')
    def validate_client_wallet(cls, v):
        if v is not None:
            if not v.startswith('0x') or len(v) != 42:
                raise ValueError('Invalid client wallet address format')
            return v.lower()
        return v
        
    @root_validator
    def update_totals(cls, values):
        if 'items' in values and values['items'] is not None:
            items = values['items']
            subtotal = sum(item.price * item.quantity for item in items)
            values['subtotal'] = subtotal
            
            # If we have tax/discount info, calculate the new total
            if 'tax' in values or 'discount' in values:
                tax = values.get('tax', 0)
                discount = values.get('discount', 0)
                values['total'] = subtotal + tax - discount
                
        if 'recipients' in values and values['recipients'] is not None:
            recipients = values['recipients']
            gross = sum(recipient.amount for recipient in recipients)
            net = sum(recipient.amount + recipient.bonus - recipient.deduction for recipient in recipients)
            
            values['grossPay'] = gross
            values['netPay'] = net
            values['total'] = net
            
        return values

class PaymentCreate(BaseModel):
    txHash: Optional[str] = None
    paymentMethod: str
    tokenAddress: Optional[str] = None
    amountPaid: float
    notes: Optional[str] = None
    
    @validator('tokenAddress')
    def validate_token_address(cls, v):
        if v is not None:
            if not v.startswith('0x') or len(v) != 42:
                raise ValueError('Invalid token address format')
            return v.lower()
        return v
        
    @validator('amountPaid')
    def validate_amount_paid(cls, v):
        if v <= 0:
            raise ValueError("Payment amount must be greater than zero")
        return v

class OrderResponse(BaseModel):
    id: str
    orderNo: str
    owner: str
    type: str
    status: str
    total: float
    currency: str
    # Common fields
    created_at: datetime
    updated_at: datetime
    paid_at: Optional[datetime] = None
    payments: List[PaymentDetails] = []
    # Type-specific fields included conditionally
    clientName: Optional[str] = None
    clientEmail: Optional[str] = None
    clientWallet: Optional[str] = None
    items: Optional[List[Item]] = None
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    discount: Optional[float] = None
    expirationDate: Optional[datetime] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    isVisible: Optional[bool] = None
    payrollType: Optional[str] = None
    paymentCycle: Optional[str] = None
    recipients: Optional[List[Recipient]] = None
    netPay: Optional[float] = None
    grossPay: Optional[float] = None
    paymentDate: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class OrderSummary(BaseModel):
    id: str
    orderNo: str
    type: str
    status: str
    total: float
    currency: str
    created_at: datetime
    due_date: Optional[datetime] = None  # Either expirationDate or paymentDate
    client_or_type: str  # Either clientName or payrollType
    
    class Config:
        orm_mode = True

class OrderStats(BaseModel):
    total_orders: int = 0
    total_invoices: int = 0
    total_payrolls: int = 0
    pending_amount: float = 0
    paid_amount: float = 0
    overdue_amount: float = 0
    pending_count: int = 0
    paid_count: int = 0
    overdue_count: int = 0

class OrderFilter(BaseModel):
    type: Optional[str] = None
    status: Optional[str] = None
    owner: Optional[str] = None
    clientName: Optional[str] = None
    payrollType: Optional[str] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    currency: Optional[str] = None
    is_overdue: Optional[bool] = None