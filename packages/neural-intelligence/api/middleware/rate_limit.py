"""Rate limiting middleware"""

import os
import time
from fastapi import Request, HTTPException, status
from typing import Dict
import asyncio

# Simple in-memory rate limiting
# In production, use Redis
rate_limit_store: Dict[str, list] = {}
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = int(os.getenv("API_RATE_LIMIT", 100))


async def rate_limit_middleware(request: Request, call_next):
    """
    Rate limiting middleware
    Limits requests per client IP
    """
    client_ip = request.client.host if request.client else "unknown"

    # Skip rate limiting for health checks
    if request.url.path.startswith("/health"):
        return await call_next(request)

    current_time = time.time()

    # Initialize or clean up old requests
    if client_ip not in rate_limit_store:
        rate_limit_store[client_ip] = []

    # Remove requests older than the window
    rate_limit_store[client_ip] = [
        req_time for req_time in rate_limit_store[client_ip]
        if current_time - req_time < RATE_LIMIT_WINDOW
    ]

    # Check if limit exceeded
    if len(rate_limit_store[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Max {RATE_LIMIT_MAX_REQUESTS} requests per {RATE_LIMIT_WINDOW} seconds."
        )

    # Add current request
    rate_limit_store[client_ip].append(current_time)

    # Process request
    response = await call_next(request)

    # Add rate limit headers
    response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT_MAX_REQUESTS)
    response.headers["X-RateLimit-Remaining"] = str(
        RATE_LIMIT_MAX_REQUESTS - len(rate_limit_store[client_ip])
    )
    response.headers["X-RateLimit-Reset"] = str(int(current_time + RATE_LIMIT_WINDOW))

    return response
