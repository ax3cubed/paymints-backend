import motor.motor_asyncio
from config import settings
import structlog

logger = structlog.get_logger()

# MongoDB client
client = None
db = None

async def init_db():
    """Initialize database connection"""
    global client, db
    
    try:
        # Create MongoDB client
        client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
        db = client[settings.MONGODB_DB_NAME]
        
        # Verify connection
        await client.admin.command('ping')
        logger.info("Connected to MongoDB", database=settings.MONGODB_DB_NAME)
        
        # Create indexes
        await create_indexes()
        
        return db
    except Exception as e:
        logger.error("Failed to connect to MongoDB", error=str(e))
        raise

async def close_db():
    """Close database connection"""
    global client
    if client:
        client.close()
        logger.info("Closed MongoDB connection")

async def create_indexes():
    """Create database indexes"""
    # Users collection indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await db.users.create_index("wallet_address", unique=True)
    
    # Orders collection indexes
    await db.orders.create_index("orderNo", unique=True)
    await db.orders.create_index("status")
    await db.orders.create_index("owner")
    
    # Payments collection indexes
    await db.payments.create_index("paymentNo", unique=True)
    await db.payments.create_index("orderRef")
    await db.payments.create_index("status")
    
    logger.info("Created database indexes")

def get_db():
    """Get database instance"""
    return db