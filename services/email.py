from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from config import settings
from typing import List, Dict, Any
import structlog
from pathlib import Path
import aiofiles
import os

logger = structlog.get_logger()

# Email configuration
conf = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USER,
    MAIL_PASSWORD=settings.SMTP_PASSWORD,
    MAIL_FROM=settings.EMAILS_FROM_EMAIL,
    MAIL_PORT=settings.SMTP_PORT,
    MAIL_SERVER=settings.SMTP_HOST,
    MAIL_FROM_NAME=settings.EMAILS_FROM_NAME,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    TEMPLATE_FOLDER=Path("./templates/email")
)

async def send_email(
    email_to: List[str],
    subject: str,
    template_name: str,
    template_data: Dict[str, Any]
):
    """Send email using FastAPI-Mail"""
    try:
        # Create message
        message = MessageSchema(
            subject=subject,
            recipients=email_to,
            template_body=template_data,
            subtype="html"
        )
        
        # Create FastMail instance
        fm = FastMail(conf)
        
        # Send email
        await fm.send_message(message, template_name=template_name)
        
        logger.info(
            "Email sent successfully",
            recipients=email_to,
            subject=subject,
            template=template_name
        )
        
        return True
    except Exception as e:
        logger.error(
            "Failed to send email",
            error=str(e),
            recipients=email_to,
            subject=subject,
            template=template_name
        )
        return False

async def send_payment_receipt(
    email_to: str,
    payment_data: Dict[str, Any],
    order_data: Dict[str, Any]
):
    """Send payment receipt email"""
    subject = f"Payment Receipt - {payment_data['paymentNo']}"
    
    template_data = {
        "payment": payment_data,
        "order": order_data,
        "app_name": settings.APP_NAME
    }
    
    return await send_email(
        email_to=[email_to],
        subject=subject,
        template_name="payment_receipt.html",
        template_data=template_data
    )