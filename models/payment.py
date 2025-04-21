from pydantic import BaseModel, Field, validator, root_validator
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from bson import ObjectId
from models.common import PyObjectId

# Chain and network information
SUPPORTED_CHAINS = ["ethereum", "solana", "polygon", "arbitrum", "binance", "avalanche", "optimism", "base"]
CHAIN_EXPLORERS = {
    "ethereum": "https://etherscan.io",
    "solana": "https://solscan.io",
    "polygon": "https://polygonscan.com",
    "arbitrum": "https://arbiscan.io",
    "binance": "https://bscscan.com",
    "avalanche": "https://snowtrace.io",
    "optimism": "https://optimistic.etherscan.io",
    "base": "https://basescan.org"
}

class TransactionDetails(BaseModel):
    txHash: str
    blockNumber: Optional[int] = None
    blockTimestamp: Optional[datetime] = None
    confirmations: Optional[int] = None
    gasUsed: Optional[int] = None
    gasPrice: Optional[float] = None
    feeAmount: Optional[float] = None
    feeCurrency: Optional[str] = "ETH"
    
    @validator('txHash')
    def validate_tx_hash(cls, v):
        if not v.startswith('0x'):
            raise ValueError('Transaction hash must start with 0x')
        return v.lower()

class PaymentBase(BaseModel):
    paymentNo: str
    orderRef: str  # Reference to the order
    type: str  # invoice or payroll
    amount: float
    status: str = "pending"  # pending, completed, failed, processing, cancelled
    sender: str  # Wallet address
    recipient: str  # Wallet address
    mintAddress: Optional[str] = None  # Token address
    chain: str  # ethereum, solana, etc.
    network: Optional[str] = "mainnet"  # mainnet, testnet, etc.
    currency: str = "ETH"  # ETH, SOL, USDC, etc.
    comments: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('sender', 'recipient')
    def wallet_address_must_be_valid(cls, v, values):
        chain = values.get('chain', 'ethereum')
        
        if chain in ["ethereum", "polygon", "arbitrum", "binance", "optimism", "base"]:
            if not v.startswith('0x') or len(v) != 42:
                raise ValueError('Invalid wallet address format for EVM-compatible chain')
            return v.lower()
        elif chain == "solana":
            # Basic Solana address validation (should be 44 characters)
            if len(v) != 44:
                raise ValueError('Invalid Solana address format')
            return v
        else:
            # For other chains, just ensure there's something there
            if not v or len(v) < 5:
                raise ValueError('Invalid wallet address')
            return v
    
    @validator('mintAddress')
    def token_address_must_be_valid(cls, v, values):
        if v is None:
            return v
            
        chain = values.get('chain', 'ethereum')
        
        if chain in ["ethereum", "polygon", "arbitrum", "binance", "optimism", "base"]:
            if not v.startswith('0x') or len(v) != 42:
                raise ValueError('Invalid token address format for EVM-compatible chain')
            return v.lower()
        elif chain == "solana":
            # Basic Solana token address validation
            if len(v) != 44:
                raise ValueError('Invalid Solana token address format')
            return v
        else:
            # For other chains, just ensure there's something there
            if not v or len(v) < 5:
                raise ValueError('Invalid token address')
            return v
    
    @validator('chain')
    def chain_must_be_supported(cls, v):
        if v.lower() not in SUPPORTED_CHAINS:
            raise ValueError(f'Unsupported blockchain. Supported options: {", ".join(SUPPORTED_CHAINS)}')
        return v.lower()
    
    @validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v

class PaymentCreate(PaymentBase):
    transaction: Optional[TransactionDetails] = None
    
    @root_validator
    def set_defaults_based_on_chain(cls, values):
        chain = values.get('chain', 'ethereum').lower()
        
        # Set default currency based on chain if not specified
        if 'currency' not in values or not values['currency']:
            default_currencies = {
                "ethereum": "ETH", 
                "solana": "SOL",
                "polygon": "MATIC",
                "arbitrum": "ETH",
                "binance": "BNB",
                "avalanche": "AVAX",
                "optimism": "ETH",
                "base": "ETH"
            }
            values['currency'] = default_currencies.get(chain, "ETH")
            
        return values

class PaymentInDB(PaymentBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    transaction: Optional[TransactionDetails] = None
    processingAttempts: int = 0
    lastAttempt: Optional[datetime] = None
    completedAt: Optional[datetime] = None
    refundTxHash: Optional[str] = None
    orderAmount: Optional[float] = None  # Original order amount
    exchangeRate: Optional[float] = None  # Exchange rate at time of payment
    usdEquivalent: Optional[float] = None  # USD equivalent of payment amount
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class PaymentUpdate(BaseModel):
    status: Optional[str] = None
    comments: Optional[str] = None
    transaction: Optional[TransactionDetails] = None
    completedAt: Optional[datetime] = None
    refundTxHash: Optional[str] = None
    
    @validator('refundTxHash')
    def validate_refund_tx_hash(cls, v):
        if v is not None:
            if not v.startswith('0x'):
                raise ValueError('Refund transaction hash must start with 0x')
            return v.lower()
        return v
    
    class Config:
        arbitrary_types_allowed = True

class PaymentResponse(PaymentBase):
    id: str
    transaction: Optional[TransactionDetails] = None
    completedAt: Optional[datetime] = None
    refundTxHash: Optional[str] = None
    exchangeRate: Optional[float] = None
    usdEquivalent: Optional[float] = None
    
    @property
    def explorer_url(self) -> Optional[str]:
        if hasattr(self, 'transaction') and self.transaction and self.transaction.txHash:
            base_url = CHAIN_EXPLORERS.get(self.chain)
            if base_url:
                return f"{base_url}/tx/{self.transaction.txHash}"
        return None
    
    class Config:
        orm_mode = True

class PaymentSummary(BaseModel):
    id: str
    paymentNo: str
    orderRef: str
    type: str
    amount: float
    currency: str
    status: str
    created_at: datetime
    completedAt: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class PaymentStats(BaseModel):
    total_count: int = 0
    pending_count: int = 0
    completed_count: int = 0
    failed_count: int = 0
    total_volume: float = 0
    pending_volume: float = 0
    completed_volume: float = 0
    by_currency: Dict[str, float] = Field(default_factory=dict)
    by_chain: Dict[str, float] = Field(default_factory=dict)

class PaymentFilter(BaseModel):
    orderRef: Optional[str] = None
    status: Optional[str] = None
    sender: Optional[str] = None
    recipient: Optional[str] = None
    type: Optional[str] = None
    chain: Optional[str] = None
    currency: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    has_transaction: Optional[bool] = None

class BatchPaymentCreate(BaseModel):
    payments: List[PaymentCreate]
    description: Optional[str] = None
    
    @validator('payments')
    def validate_payments_list(cls, v):
        if not v or len(v) == 0:
            raise ValueError('Must include at least one payment')
        return v

class RefundCreate(BaseModel):
    paymentId: str
    refundTxHash: str
    reason: str
    amount: Optional[float] = None  # If different from original payment
    
    @validator('refundTxHash')
    def validate_refund_tx_hash(cls, v):
        if not v.startswith('0x'):
            raise ValueError('Refund transaction hash must start with 0x')
        return v.lower()