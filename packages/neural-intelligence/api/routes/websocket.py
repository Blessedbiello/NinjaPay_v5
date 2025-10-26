"""WebSocket routes for real-time communication"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import asyncio
import json
import logging

router = APIRouter()
logger = logging.getLogger("neural.websocket")


class ConnectionManager:
    """Manages WebSocket connections"""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        """Accept new WebSocket connection"""
        await websocket.accept()
        if client_id not in self.active_connections:
            self.active_connections[client_id] = set()
        self.active_connections[client_id].add(websocket)
        logger.info(f"Client {client_id} connected")

    def disconnect(self, websocket: WebSocket, client_id: str):
        """Remove WebSocket connection"""
        if client_id in self.active_connections:
            self.active_connections[client_id].discard(websocket)
            if not self.active_connections[client_id]:
                del self.active_connections[client_id]
        logger.info(f"Client {client_id} disconnected")

    async def send_personal_message(self, message: str, client_id: str):
        """Send message to specific client"""
        if client_id in self.active_connections:
            for connection in self.active_connections[client_id]:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Error sending to {client_id}: {e}")

    async def broadcast(self, message: str):
        """Broadcast message to all connected clients"""
        for client_connections in self.active_connections.values():
            for connection in client_connections:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Error broadcasting: {e}")


manager = ConnectionManager()


@router.websocket("/agents")
async def websocket_endpoint(websocket: WebSocket, client_id: str = "anonymous"):
    """WebSocket endpoint for real-time agent updates"""
    await manager.connect(websocket, client_id)

    try:
        while True:
            # Receive messages from client
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                message_type = message.get("type")

                if message_type == "subscribe":
                    # Subscribe to agent events
                    agents = message.get("agents", [])
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "subscribed",
                            "agents": agents,
                            "timestamp": asyncio.get_event_loop().time()
                        }),
                        client_id
                    )

                elif message_type == "ping":
                    # Heartbeat
                    await manager.send_personal_message(
                        json.dumps({"type": "pong"}),
                        client_id
                    )

                else:
                    # Echo unknown messages
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "error",
                            "message": f"Unknown message type: {message_type}"
                        }),
                        client_id
                    )

            except json.JSONDecodeError:
                await manager.send_personal_message(
                    json.dumps({
                        "type": "error",
                        "message": "Invalid JSON"
                    }),
                    client_id
                )

    except WebSocketDisconnect:
        manager.disconnect(websocket, client_id)


async def broadcast_agent_event(event_type: str, data: Dict):
    """Broadcast agent event to all connected WebSocket clients"""
    message = json.dumps({
        "type": "agent_event",
        "event_type": event_type,
        "data": data,
        "timestamp": asyncio.get_event_loop().time()
    })
    await manager.broadcast(message)
