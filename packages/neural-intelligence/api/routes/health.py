"""Health check endpoints"""

from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "Neural Intelligence System"
    }


@router.get("/ready")
async def readiness_check():
    """Readiness check - are all agents ready?"""
    # In a full implementation, check if all agents are initialized
    return {
        "ready": True,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/live")
async def liveness_check():
    """Liveness check - is the service alive?"""
    return {
        "alive": True,
        "timestamp": datetime.utcnow().isoformat()
    }
