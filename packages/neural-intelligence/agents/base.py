"""
Base Neural Agent class - extends uAgents framework
"""

import asyncio
import logging
from typing import Any, Dict, Optional, Callable
from datetime import datetime

from uagents import Agent, Context, Model
from uagents.setup import fund_agent_if_low
import redis.asyncio as redis
import asyncpg


class AgentMessage(Model):
    """Base message model for inter-agent communication"""
    message_id: str
    sender: str
    recipient: str
    message_type: str
    payload: Dict[str, Any]
    timestamp: datetime
    priority: int = 5  # 1-10, 10 is highest


class AgentResponse(Model):
    """Base response model"""
    request_id: str
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    agent_id: str
    timestamp: datetime


class NeuralAgent:
    """
    Base class for all Neural Intelligence System agents
    Extends Fetch.ai uAgent with NinjaPay-specific functionality
    """

    def __init__(
        self,
        name: str,
        seed: str,
        port: int,
        endpoint: Optional[list[str]] = None,
        mailbox: Optional[str] = None,
        log_level: str = "INFO",
    ):
        """
        Initialize Neural Agent

        Args:
            name: Agent name
            seed: Seed phrase for deterministic address generation
            port: Port for agent HTTP server
            endpoint: List of endpoint URLs
            mailbox: Mailbox key for Agentverse (optional)
            log_level: Logging level
        """
        self.name = name
        self.log_level = log_level
        self.logger = self._setup_logger()

        # Initialize uAgent
        if endpoint is None:
            endpoint = [f"http://localhost:{port}/submit"]

        self.agent = Agent(
            name=name,
            seed=seed,
            port=port,
            endpoint=endpoint,
            mailbox=mailbox,
        )

        # Fund agent if on testnet
        fund_agent_if_low(self.agent.wallet.address())

        # Database connections (initialized in startup)
        self.redis: Optional[redis.Redis] = None
        self.pg_pool: Optional[asyncpg.Pool] = None

        # Agent state
        self.is_running = False
        self.message_handlers: Dict[str, Callable] = {}

        # Register base event handlers
        self._register_base_handlers()

        self.logger.info(
            f"Neural Agent '{name}' initialized",
            extra={"address": self.agent.address}
        )

    def _setup_logger(self) -> logging.Logger:
        """Setup structured logger"""
        logger = logging.getLogger(f"neural.{self.name}")
        logger.setLevel(getattr(logging, self.log_level.upper()))

        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '{"time":"%(asctime)s","agent":"%(name)s","level":"%(levelname)s","message":"%(message)s"}'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    def _register_base_handlers(self):
        """Register base event handlers"""

        @self.agent.on_event("startup")
        async def startup(ctx: Context):
            """Agent startup handler"""
            self.logger.info(f"Agent {self.name} starting up...")
            await self._on_startup(ctx)
            self.is_running = True
            self.logger.info(
                f"Agent {self.name} is ready",
                extra={"address": ctx.agent.address}
            )

        @self.agent.on_event("shutdown")
        async def shutdown(ctx: Context):
            """Agent shutdown handler"""
            self.logger.info(f"Agent {self.name} shutting down...")
            await self._on_shutdown(ctx)
            self.is_running = False
            self.logger.info(f"Agent {self.name} stopped")

        @self.agent.on_message(model=AgentMessage)
        async def handle_agent_message(ctx: Context, sender: str, msg: AgentMessage):
            """Handle messages from other agents"""
            self.logger.info(
                f"Received message from {sender}",
                extra={"message_type": msg.message_type, "message_id": msg.message_id}
            )

            handler = self.message_handlers.get(msg.message_type)
            if handler:
                try:
                    response = await handler(ctx, msg)
                    await ctx.send(sender, response)
                except Exception as e:
                    self.logger.error(
                        f"Error handling message: {e}",
                        extra={"message_type": msg.message_type}
                    )
                    error_response = AgentResponse(
                        request_id=msg.message_id,
                        success=False,
                        error=str(e),
                        agent_id=self.name,
                        timestamp=datetime.utcnow()
                    )
                    await ctx.send(sender, error_response)
            else:
                self.logger.warning(
                    f"No handler for message type: {msg.message_type}"
                )

    async def _on_startup(self, ctx: Context):
        """
        Agent startup logic - override in subclasses
        Initialize database connections, load models, etc.
        """
        # Initialize Redis connection
        import os
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis = await redis.from_url(redis_url, decode_responses=True)

        # Initialize PostgreSQL connection pool
        database_url = os.getenv("DATABASE_URL")
        if database_url:
            self.pg_pool = await asyncpg.create_pool(database_url, min_size=2, max_size=10)

        self.logger.info("Database connections established")

    async def _on_shutdown(self, ctx: Context):
        """
        Agent shutdown logic - override in subclasses
        Close connections, save state, etc.
        """
        # Close Redis connection
        if self.redis:
            await self.redis.close()

        # Close PostgreSQL connection pool
        if self.pg_pool:
            await self.pg_pool.close()

        self.logger.info("Database connections closed")

    def register_message_handler(self, message_type: str, handler: Callable):
        """
        Register a handler for a specific message type

        Args:
            message_type: Type of message to handle
            handler: Async function that handles the message
        """
        self.message_handlers[message_type] = handler
        self.logger.info(f"Registered handler for message type: {message_type}")

    async def publish_event(self, event_type: str, data: Dict[str, Any]):
        """
        Publish an event to Redis pub/sub

        Args:
            event_type: Type of event
            data: Event data
        """
        if self.redis:
            channel = f"neural:{event_type}"
            message = {
                "agent": self.name,
                "event_type": event_type,
                "data": data,
                "timestamp": datetime.utcnow().isoformat()
            }
            await self.redis.publish(channel, str(message))
            self.logger.debug(f"Published event to {channel}")

    async def subscribe_to_events(self, event_types: list[str], callback: Callable):
        """
        Subscribe to Redis pub/sub events

        Args:
            event_types: List of event types to subscribe to
            callback: Async function to call when event is received
        """
        if self.redis:
            pubsub = self.redis.pubsub()
            channels = [f"neural:{et}" for et in event_types]
            await pubsub.subscribe(*channels)

            async def listen():
                async for message in pubsub.listen():
                    if message["type"] == "message":
                        await callback(message["channel"], message["data"])

            # Run in background
            asyncio.create_task(listen())
            self.logger.info(f"Subscribed to events: {event_types}")

    async def query_database(self, query: str, *args) -> list:
        """
        Execute a read-only database query

        Args:
            query: SQL query
            *args: Query parameters

        Returns:
            List of result rows
        """
        if not self.pg_pool:
            raise RuntimeError("Database pool not initialized")

        async with self.pg_pool.acquire() as conn:
            results = await conn.fetch(query, *args)
            return [dict(row) for row in results]

    async def cache_get(self, key: str) -> Optional[str]:
        """Get value from Redis cache"""
        if self.redis:
            return await self.redis.get(f"neural:{self.name}:{key}")
        return None

    async def cache_set(self, key: str, value: str, ttl: int = 3600):
        """Set value in Redis cache with TTL"""
        if self.redis:
            await self.redis.setex(f"neural:{self.name}:{key}", ttl, value)

    def run(self):
        """Start the agent"""
        self.logger.info(f"Starting agent {self.name}...")
        self.agent.run()
