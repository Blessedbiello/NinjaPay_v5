"""
Agent Manager - Manages lifecycle of all Neural Intelligence agents
"""

import asyncio
import logging
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger("neural.agent_manager")


class AgentManager:
    """Manages all Neural Intelligence agents"""

    def __init__(self):
        self.agents: Dict[str, any] = {}
        self.agent_tasks: Dict[str, asyncio.Task] = {}
        self.is_running = False

    async def start(self):
        """Start all agents"""
        logger.info("Starting all agents...")

        # Import agents (lazy import to avoid circular dependencies)
        from agents.compliance.agent import ComplianceAgent
        from agents.fraud.agent import FraudAgent
        from agents.treasury.agent import TreasuryAgent
        from agents.growth.agent import GrowthAgent
        from agents.support.agent import SupportAgent

        # Initialize agents
        self.agents = {
            "compliance": ComplianceAgent(),
            "fraud": FraudAgent(),
            "treasury": TreasuryAgent(),
            "growth": GrowthAgent(),
            "support": SupportAgent(),
        }

        # Start each agent in a separate task
        for name, agent in self.agents.items():
            task = asyncio.create_task(self._run_agent(name, agent))
            self.agent_tasks[name] = task
            logger.info(f"Started {name} agent")

        self.is_running = True
        logger.info("All agents started successfully")

    async def stop(self):
        """Stop all agents"""
        logger.info("Stopping all agents...")

        # Signal agents to stop gracefully
        for name, agent in self.agents.items():
            if hasattr(agent, "agent") and hasattr(agent.agent, "stop"):
                try:
                    await asyncio.to_thread(agent.agent.stop)
                    logger.info(f"Sent stop signal to {name} agent")
                except Exception as exc:
                    logger.warning(
                        "Failed to stop agent cleanly",
                        extra={"agent": name, "error": str(exc)}
                    )

        # Cancel all agent tasks
        for name, task in self.agent_tasks.items():
            if not task.done():
                task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                logger.info(f"Stopped {name} agent")
            except Exception as exc:
                logger.error(f"Error stopping agent {name}: {exc}", exc_info=True)

        self.agents.clear()
        self.agent_tasks.clear()
        self.is_running = False
        logger.info("All agents stopped")

    async def _run_agent(self, name: str, agent):
        """Run a single agent"""
        try:
            # Agents have their own run() method from uAgents framework
            await asyncio.to_thread(agent.run)
        except asyncio.CancelledError:
            logger.info(f"Agent {name} cancelled")
            raise
        except Exception as e:
            logger.error(f"Error running agent {name}: {e}", exc_info=True)
            raise

    async def get_agent_status(self) -> Dict[str, Dict]:
        """Get status of all agents"""
        status = {}
        for name, agent in self.agents.items():
            status[name] = {
                "name": agent.name,
                "address": agent.agent.address,
                "running": agent.is_running,
                "uptime": self._get_uptime(agent),
            }
        return status

    def _get_uptime(self, agent) -> Optional[float]:
        """Calculate agent uptime in seconds"""
        # This would be tracked by the agent itself
        # For now, return None
        return None

    async def send_to_agent(
        self,
        agent_name: str,
        message_type: str,
        data: Dict
    ) -> Dict:
        """
        Send a message to a specific agent and wait for response

        Args:
            agent_name: Name of the agent
            message_type: Type of message
            data: Message data

        Returns:
            Agent response
        """
        if agent_name not in self.agents:
            raise ValueError(f"Agent {agent_name} not found")

        agent = self.agents[agent_name]

        # This is a simplified version
        # In reality, we'd use the uAgents messaging protocol
        # For now, we'll call the agent's handler directly

        response = await agent.handle_api_request(message_type, data)
        return response

    async def broadcast_to_agents(
        self,
        message_type: str,
        data: Dict,
        target_agents: Optional[List[str]] = None
    ) -> Dict[str, Dict]:
        """
        Broadcast a message to multiple agents

        Args:
            message_type: Type of message
            data: Message data
            target_agents: List of agent names (None = all agents)

        Returns:
            Dictionary of agent responses
        """
        targets = target_agents or list(self.agents.keys())
        responses = {}

        tasks = []
        for agent_name in targets:
            if agent_name in self.agents:
                task = self.send_to_agent(agent_name, message_type, data)
                tasks.append((agent_name, task))

        results = await asyncio.gather(*[t for _, t in tasks], return_exceptions=True)

        for (agent_name, _), result in zip(tasks, results):
            if isinstance(result, Exception):
                responses[agent_name] = {
                    "success": False,
                    "error": str(result)
                }
            else:
                responses[agent_name] = result

        return responses
