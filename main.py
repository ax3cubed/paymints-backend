from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi import FastAPI

import uvicorn
import os
from dotenv import load_dotenv
import logging
import structlog

# Import routers
from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.orders import router as orders_router
from routes.payments import router as payments_router

# Import database connection
from database import init_db, close_db

# Load environment variables
load_dotenv()

# Configure logging
structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)

logger = structlog.get_logger()

app = FastAPI(
    title="Paymint API",
    description="Payment processing API with invoicing, payroll, and blockchain integration",
    version="1.0.0",
    swagger_ui_parameters={"syntaxHighlight": {"theme": "obsidian"}},
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    logger.info("Starting up Paymint API")
    await init_db()


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Paymint API")
    await close_db()


# Exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(users_router, prefix="/users", tags=["Users"])
app.include_router(orders_router, prefix="/orders", tags=["Orders"])
app.include_router(payments_router, prefix="/payments", tags=["Payments"])

# Mount static files
app.mount("/dist", StaticFiles(directory="dist"), name="dist")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/uploads2", StaticFiles(directory="uploads2"), name="uploads2")


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    return {"message": "Welcome to Paymint API"}


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENVIRONMENT", "development") == "development",
    )
