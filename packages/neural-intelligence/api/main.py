"""
Neural Intelligence System - FastAPI Server
Main entry point for REST API and WebSocket communication
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import Dict

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from dotenv import load_dotenv

from .routes import neural, health, websocket
from .middleware import rate_limit, auth
from .agent_manager import AgentManager

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format='{"time":"%(asctime)s","service":"neural-api","level":"%(levelname)s","message":"%(message)s"}'
)
logger = logging.getLogger("neural-api")

# Initialize agent manager
agent_manager = AgentManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle management for FastAPI app"""
    # Startup
    logger.info("Starting Neural Intelligence System API...")
    await agent_manager.start()
    logger.info("All agents started successfully")

    yield

    # Shutdown
    logger.info("Shutting down Neural Intelligence System API...")
    await agent_manager.stop()
    logger.info("All agents stopped successfully")


# Create FastAPI app
app = FastAPI(
    title="Neural Intelligence System API",
    description="Decentralized Superintelligent Agent System for Commerce",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGIN", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting middleware
app.middleware("http")(rate_limit.rate_limit_middleware)

# Routes
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(neural.router, prefix="/api/neural", tags=["neural"])
app.include_router(websocket.router, prefix="/ws", tags=["websocket"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Neural Intelligence System",
        "version": "0.1.0",
        "status": "online",
        "agents": await agent_manager.get_agent_status(),
        "docs": "/docs",
    }


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "detail": str(exc) if os.getenv("NODE_ENV") == "development" else "An error occurred"
        }
    )


def main():
    """Run the FastAPI server"""
    port = int(os.getenv("NEURAL_API_PORT", 8003))
    host = os.getenv("NEURAL_API_HOST", "0.0.0.0")

    logger.info(f"Starting server on {host}:{port}")

    uvicorn.run(
        "api.main:app",
        host=host,
        port=port,
        reload=os.getenv("NODE_ENV") == "development",
        log_config=None,  # Use our custom logging
    )


if __name__ == "__main__":
    main()
