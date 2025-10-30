"""
TreasuryAgent - Liquidity Optimization and Routing
Optimizes cash flow routing and liquidity management
"""

import os
import json
from typing import Dict, Any, List
from datetime import datetime, timedelta

from uagents import Context
from agents.base import NeuralAgent, AgentResponse
from agents.protocols import (
    TreasuryOptimizationRequest,
    TreasuryOptimizationResponse,
    RiskScoreQuery,
    RiskScoreResponse,
    FraudScoreQuery,
    FraudScoreResponse,
)
from knowledge import get_knowledge_base
import uuid

L1_TX_COST = 0.0001  # Approximate Solana L1 fee in USDC
L2_TX_COST = 0.02    # Approximate MagicBlock L2 flat fee


class TreasuryAgent(NeuralAgent):
    """
    Treasury optimization agent

    Capabilities:
    - L1 vs L2 routing optimization
    - Liquidity forecasting
    - Cost-benefit analysis
    - Capital efficiency recommendations
    """

    def __init__(self):
        super().__init__(
            name="TreasuryAgent",
            seed=os.getenv(
                "TREASURY_AGENT_SEED",
                os.getenv("AGENT_SEED", "treasury_agent_seed_phrase")
            ),
            port=int(os.getenv("TREASURY_AGENT_PORT", 8101)),
            endpoint=[f"http://localhost:{os.getenv('TREASURY_AGENT_PORT', 8101)}/submit"],
            mailbox=os.getenv("AGENT_MAILBOX_KEY"),
            log_level=os.getenv("LOG_LEVEL", "INFO"),
        )

        self.knowledge_base = None
        self.register_message_handler("treasury_optimization", self.handle_optimization)
        self.optimizations_performed = 0
        self.total_savings_estimated = 0.0

        # Store other agent addresses for inter-agent communication
        self.compliance_agent_address = os.getenv(
            "COMPLIANCE_AGENT_ADDRESS",
            "agent1qf9uehs3x52awalgl3sp0uwu2pnmxww3vqfevnjjn8zlgc7gyzhgvacsy4g"
        )
        self.fraud_agent_address = os.getenv(
            "FRAUD_AGENT_ADDRESS",
            "agent1qv4s8msvuz509vdy44hcke7uve9tttg4phq87aukcfy50sww0stecgrn48y"
        )

    async def _on_startup(self, ctx: Context):
        """Initialize agent"""
        await super()._on_startup(ctx)

        try:
            self.knowledge_base = get_knowledge_base()
            self.logger.info("MeTTa knowledge base loaded")
        except Exception as e:
            self.logger.error(f"Failed to load MeTTa: {e}")

        await self.subscribe_to_events(
            ["payment.scheduled", "liquidity.low"],
            self.handle_event
        )

        self.logger.info("TreasuryAgent ready")

    async def handle_event(self, channel: str, data: str):
        """Handle treasury events"""
        try:
            event_data = json.loads(data)
            if event_data.get("event_type") == "liquidity.low":
                merchant_id = event_data["data"]["merchant_id"]
                await self.optimize_liquidity(merchant_id)
        except Exception as e:
            self.logger.error(f"Error handling event: {e}")

    async def handle_optimization(self, ctx: Context, msg) -> AgentResponse:
        """Handle optimization request"""
        try:
            request = TreasuryOptimizationRequest(**msg.payload)
            result = await self.optimize_treasury(request.dict())

            self.optimizations_performed += 1
            return AgentResponse(
                request_id=msg.message_id,
                success=True,
                data=result,
                agent_id=self.name,
                timestamp=datetime.utcnow()
            )
        except Exception as e:
            self.logger.error(f"Error in optimization: {e}", exc_info=True)
            return AgentResponse(
                request_id=msg.message_id,
                success=False,
                error=str(e),
                agent_id=self.name,
                timestamp=datetime.utcnow()
            )

    async def optimize_treasury(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize treasury operations"""
        merchant_id = request_data["merchant_id"]
        current_liquidity = request_data["current_liquidity"]
        upcoming_payments = request_data["upcoming_payments"]
        time_horizon = request_data.get("time_horizon", "7d")
        optimization_goal = request_data.get("optimization_goal", "balance")

        self.logger.info(f"Optimizing treasury for merchant {merchant_id}")

        # Analyze current state
        liquidity_health = await self.analyze_liquidity_health(
            merchant_id,
            current_liquidity
        )

        # Generate routing recommendations
        routing_strategy = await self.optimize_routing(
            upcoming_payments,
            optimization_goal
        )

        # Calculate cost savings
        estimated_savings = await self.calculate_savings(routing_strategy)

        # Generate recommendations
        recommendations = await self.generate_recommendations(
            liquidity_health,
            routing_strategy,
            optimization_goal
        )

        self.total_savings_estimated += estimated_savings

        return {
            "merchant_id": merchant_id,
            "liquidity_health": liquidity_health,
            "routing_strategy": routing_strategy,
            "recommendations": recommendations,
            "estimated_savings": round(estimated_savings, 2),
            "risk_assessment": self.assess_risk(liquidity_health),
            "timestamp": datetime.utcnow().isoformat()
        }

    async def analyze_liquidity_health(
        self,
        merchant_id: str,
        current_liquidity: Dict[str, float]
    ) -> Dict[str, Any]:
        """Analyze liquidity health"""
        total_balance = sum(current_liquidity.values())
        liquid_balance = current_liquidity.get("available", 0)

        # Get merchant type
        merchant_type = "merchant"  # Default

        # Check health using MeTTa
        is_healthy = False
        if self.knowledge_base and total_balance > 0:
            try:
                is_healthy = self.knowledge_base.check_liquidity_health(
                    merchant_type,
                    liquid_balance,
                    total_balance
                )
            except Exception as e:
                self.logger.warning(f"MeTTa health check failed: {e}")

        liquidity_ratio = liquid_balance / total_balance if total_balance > 0 else 0

        return {
            "total_balance": round(total_balance, 2),
            "liquid_balance": round(liquid_balance, 2),
            "liquidity_ratio": round(liquidity_ratio, 3),
            "is_healthy": bool(is_healthy) or liquidity_ratio > 0.10,
            "status": "healthy" if liquidity_ratio > 0.15 else "low" if liquidity_ratio > 0.05 else "critical"
        }

    async def optimize_routing(
        self,
        upcoming_payments: List[Dict[str, Any]],
        goal: str
    ) -> Dict[str, Any]:
        """Optimize payment routing (L1 vs L2)"""
        l1_payments = []
        l2_payments = []

        for payment in upcoming_payments:
            amount = payment.get("amount", 0)
            urgency = payment.get("urgency", 5)

            route = None
            if self.knowledge_base:
                try:
                    route = self.knowledge_base.recommend_routing(amount, urgency)
                except Exception as exc:
                    self.logger.warning(f"MeTTa routing failed, using fallback: {exc}")

            if route not in {"L1", "L2"}:
                route = self._fallback_route(amount, urgency, goal)

            if route.upper() == "L1":
                l1_payments.append(payment)
            else:
                l2_payments.append(payment)

        return {
            "l1_count": len(l1_payments),
            "l2_count": len(l2_payments),
            "l1_total": sum(p.get("amount", 0) for p in l1_payments),
            "l2_total": sum(p.get("amount", 0) for p in l2_payments),
            "optimization_goal": goal,
            "routing_breakdown": {
                "solana_l1": len(l1_payments),
                "magicblock_l2": len(l2_payments)
            }
        }

    async def calculate_savings(self, routing_strategy: Dict[str, Any]) -> float:
        """Calculate estimated cost savings"""
        l1_count = routing_strategy["l1_count"]
        l2_count = routing_strategy["l2_count"]

        total_count = l1_count + l2_count
        actual_cost = (l1_count * L1_TX_COST) + (l2_count * L2_TX_COST)
        all_l1_cost = total_count * L1_TX_COST
        all_l2_cost = total_count * L2_TX_COST
        baseline_cost = max(all_l1_cost, all_l2_cost)

        savings = baseline_cost - actual_cost
        return max(savings, 0.0)

    async def generate_recommendations(
        self,
        liquidity_health: Dict[str, Any],
        routing_strategy: Dict[str, Any],
        goal: str
    ) -> List[Dict[str, Any]]:
        """Generate treasury recommendations"""
        recommendations = []

        if liquidity_health["status"] == "critical":
            recommendations.append({
                "priority": "high",
                "action": "increase_liquidity",
                "description": "Liquidity critically low. Consider adding funds.",
                "impact": "Prevent payment failures"
            })

        if routing_strategy["l2_count"] > routing_strategy["l1_count"]:
            recommendations.append({
                "priority": "medium",
                "action": "optimize_batching",
                "description": f"Batch {routing_strategy['l2_count']} L2 payments for better efficiency",
                "impact": "Reduce transaction costs"
            })

        if goal == "cost":
            recommendations.append({
                "priority": "low",
                "action": "delay_non_urgent",
                "description": "Delay non-urgent payments to batch for lower costs",
                "impact": "Maximize cost savings"
            })

        return recommendations

    def assess_risk(self, liquidity_health: Dict[str, Any]) -> str:
        """Assess treasury risk"""
        if liquidity_health["status"] == "critical":
            return "high"
        elif liquidity_health["status"] == "low":
            return "medium"
        else:
            return "low"

    def _fallback_route(self, amount: float, urgency: int, goal: str) -> str:
        """
        Provide deterministic routing when MeTTa recommendations are unavailable.

        Prefers L2 for speed-sensitive or low-value payments that benefit from batching,
        otherwise defaults to L1 for lower fees on larger amounts.
        """
        if goal == "speed":
            return "L2" if urgency >= 5 else "L1"

        if goal == "cost":
            return "L2" if amount < 50 and urgency >= 3 else "L1"

        # Balanced goal: urgent or micro payments -> L2, otherwise L1
        if urgency >= 7 or amount < 25:
            return "L2"
        return "L1"

    async def optimize_liquidity(self, merchant_id: str):
        """Optimize liquidity for a merchant"""
        self.logger.info(f"Optimizing liquidity for {merchant_id}")
        # Trigger optimization analysis
        await self.publish_event("treasury.optimization_needed", {
            "merchant_id": merchant_id,
            "reason": "low_liquidity"
        })

    async def handle_api_request(self, message_type: str, data: Dict) -> Dict:
        """Handle API request"""
        if message_type == "treasury_optimization":
            return await self.optimize_treasury(data)
        return {"error": "Unknown message type"}

    async def get_metrics(self) -> Dict[str, Any]:
        """Get agent metrics"""
        return {
            "optimizations_performed": self.optimizations_performed,
            "total_savings_estimated": round(self.total_savings_estimated, 2),
        }


if __name__ == "__main__":
    agent = TreasuryAgent()
    agent.run()
