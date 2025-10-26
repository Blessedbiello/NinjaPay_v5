"""Authentication middleware"""

import os
from fastapi import Request, HTTPException, status, Header
from typing import Optional


async def verify_api_key(x_api_key: Optional[str] = Header(None)) -> str:
    """
    Verify API key from header

    Args:
        x_api_key: API key from X-API-Key header

    Returns:
        The validated API key

    Raises:
        HTTPException: If API key is invalid or missing
    """
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key. Provide X-API-Key header."
        )

    # In production, verify against database
    # For now, check against environment variable
    valid_api_key = os.getenv("NINJAPAY_API_KEY")

    if not valid_api_key or x_api_key != valid_api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key"
        )

    return x_api_key


async def verify_webhook_signature(
    request: Request,
    x_webhook_signature: Optional[str] = Header(None)
) -> bool:
    """
    Verify webhook signature from NinjaPay

    Args:
        request: FastAPI request object
        x_webhook_signature: Signature from X-Webhook-Signature header

    Returns:
        True if signature is valid

    Raises:
        HTTPException: If signature is invalid or missing
    """
    import hmac
    import hashlib

    if not x_webhook_signature:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing webhook signature"
        )

    # Get webhook secret
    webhook_secret = os.getenv("NINJAPAY_WEBHOOK_SECRET")
    if not webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook secret not configured"
        )

    # Get request body
    body = await request.body()

    # Calculate expected signature
    expected_signature = hmac.new(
        webhook_secret.encode(),
        body,
        hashlib.sha256
    ).hexdigest()

    # Compare signatures
    if not hmac.compare_digest(expected_signature, x_webhook_signature):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid webhook signature"
        )

    return True
