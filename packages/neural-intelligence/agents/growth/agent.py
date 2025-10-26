"""
GrowthAgent - Merchant Analytics and Growth Optimization
Provides merchant performance analytics and growth recommendations
"""

import os
import json
from typing import Dict, Any, List
from datetime import datetime, timedelta

from uagents import Context
from agents.base import NeuralAgent, AgentResponse
from agents.protocols import GrowthSuggestionRequest, GrowthSuggestionResponse
from knowledge import get_knowledge_base


class GrowthAgent(NeuralAgent):
    """
    Growth optimization agent for merchants

    Capabilities:
    - Performance metric analysis
    - Pricing optimization
    - Churn prediction
    - Revenue forecasting
    """

    def __init__(self):
        super().__init__(
            name="GrowthAgent",
            seed=os.getenv("AGENT_SEED", "growth_agent_seed_phrase"),
            port=int(os.getenv("GROWTH_AGENT_PORT", 8103)),
            endpoint=[f"http://localhost:{os.getenv('GROWTH_AGENT_PORT', 8103)}/submit"],
            mailbox=os.getenv("AGENT_MAILBOX_KEY"),
            log_level=os.getenv("LOG_LEVEL", "INFO"),
        )

        self.knowledge_base = None
        self.register_message_handler("growth_suggestion", self.handle_growth_suggestion)
        self.suggestions_generated = 0

    async def _on_startup(self, ctx: Context):
        """Initialize agent"""
        await super()._on_startup(ctx)

        try:
            self.knowledge_base = get_knowledge_base()
        except Exception as e:
            self.logger.error(f"Failed to load MeTTa: {e}")

        await self.subscribe_to_events(["merchant.milestone"], self.handle_event)
        self.logger.info("GrowthAgent ready")

    async def handle_event(self, channel: str, data: str):
        """Handle growth events"""
        try:
            event_data = json.loads(data)
            self.logger.info(f"Merchant milestone: {event_data}")
        except Exception as e:
            self.logger.error(f"Error handling event: {e}")

    async def handle_growth_suggestion(self, ctx: Context, msg) -> AgentResponse:
        """Handle growth suggestion request"""
        try:
            request = GrowthSuggestionRequest(**msg.payload)
            result = await self.generate_growth_suggestions(request.dict())

            self.suggestions_generated += 1
            return AgentResponse(
                request_id=msg.message_id,
                success=True,
                data=result,
                agent_id=self.name,
                timestamp=datetime.utcnow()
            )
        except Exception as e:
            self.logger.error(f"Error generating suggestions: {e}", exc_info=True)
            return AgentResponse(
                request_id=msg.message_id,
                success=False,
                error=str(e),
                agent_id=self.name,
                timestamp=datetime.utcnow()
            )

    async def generate_growth_suggestions(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate growth suggestions for merchant"""
        merchant_id = request_data["merchant_id"]
        metrics = request_data["metrics"]
        timeframe = request_data.get("timeframe", "30d")
        goals = request_data.get("goals", ["increase_revenue"])

        self.logger.info(f"Generating growth suggestions for {merchant_id}")

        # Analyze current performance
        performance_analysis = await self.analyze_performance(metrics, timeframe)

        # Generate goal-specific suggestions
        suggestions = await self.generate_suggestions_for_goals(
            goals,
            metrics,
            performance_analysis
        )

        # Predict impact
        predicted_impact = await self.predict_impact(suggestions, metrics)

        # Rank by priority
        priority_ranking = self.rank_suggestions(suggestions, predicted_impact)

        # Assess implementation difficulty
        implementation_difficulty = self.assess_difficulty(suggestions)

        return {
            "merchant_id": merchant_id,
            "performance_analysis": performance_analysis,
            "suggestions": suggestions,
            "predicted_impact": predicted_impact,
            "priority_ranking": priority_ranking,
            "implementation_difficulty": implementation_difficulty,
            "timeframe_analyzed": timeframe,
            "timestamp": datetime.utcnow().isoformat()
        }

    async def analyze_performance(
        self,
        metrics: Dict[str, Any],
        timeframe: str
    ) -> Dict[str, Any]:
        """Analyze merchant performance metrics"""
        transactions = metrics.get("transactions", 0)
        revenue = metrics.get("revenue", 0)
        customers = metrics.get("customers", 0)
        prev_revenue = metrics.get("previous_revenue", 0)

        # Calculate growth rate
        growth_rate = 0
        if prev_revenue > 0:
            growth_rate = ((revenue - prev_revenue) / prev_revenue) * 100

        # Check if growth is healthy using MeTTa
        is_healthy_growth = False
        if self.knowledge_base and prev_revenue > 0:
            try:
                is_healthy_growth = self.knowledge_base.healthy_growth(revenue, prev_revenue)
            except Exception:
                is_healthy_growth = 0.05 <= growth_rate <= 0.50

        # Calculate churn risk
        avg_tx_frequency = 7  # days
        days_since_last = metrics.get("days_since_last_transaction", 0)
        churn_risk = 0.2
        if self.knowledge_base:
            try:
                churn_risk = self.knowledge_base.churn_risk(days_since_last, avg_tx_frequency)
            except Exception:
                if days_since_last > avg_tx_frequency * 3:
                    churn_risk = 0.8

        return {
            "transactions_count": transactions,
            "total_revenue": round(revenue, 2),
            "unique_customers": customers,
            "growth_rate_pct": round(growth_rate, 2),
            "is_healthy_growth": bool(is_healthy_growth),
            "churn_risk": round(churn_risk, 2),
            "avg_transaction_value": round(revenue / transactions, 2) if transactions > 0 else 0
        }

    async def generate_suggestions_for_goals(
        self,
        goals: List[str],
        metrics: Dict[str, Any],
        performance: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate suggestions based on goals"""
        suggestions = []

        for goal in goals:
            if goal == "increase_revenue":
                suggestions.extend(await self.suggest_revenue_increase(metrics, performance))
            elif goal == "reduce_churn":
                suggestions.extend(await self.suggest_churn_reduction(metrics, performance))
            elif goal == "improve_conversion":
                suggestions.extend(await self.suggest_conversion_improvement(metrics, performance))

        return suggestions

    async def suggest_revenue_increase(
        self,
        metrics: Dict[str, Any],
        performance: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Suggest ways to increase revenue"""
        suggestions = []

        avg_tx_value = performance["avg_transaction_value"]

        if avg_tx_value < 100:
            suggestions.append({
                "type": "pricing_optimization",
                "title": "Optimize Pricing Strategy",
                "description": "Consider increasing prices by 10-15% or offering premium tiers",
                "expected_impact": "15-20% revenue increase",
                "category": "revenue"
            })

        suggestions.append({
            "type": "payment_links",
            "title": "Expand Payment Link Usage",
            "description": "Create payment links for frequently purchased items",
            "expected_impact": "10-15% conversion increase",
            "category": "revenue"
        })

        if metrics.get("customers", 0) > 100:
            suggestions.append({
                "type": "loyalty_program",
                "title": "Implement Loyalty Rewards",
                "description": "Offer cashback or discounts for repeat customers",
                "expected_impact": "20-30% repeat purchase increase",
                "category": "revenue"
            })

        return suggestions

    async def suggest_churn_reduction(
        self,
        metrics: Dict[str, Any],
        performance: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Suggest ways to reduce churn"""
        suggestions = []

        if performance["churn_risk"] > 0.5:
            suggestions.append({
                "type": "re_engagement",
                "title": "Re-engagement Campaign",
                "description": "Send personalized offers to inactive customers",
                "expected_impact": "25% churn reduction",
                "category": "retention"
            })

        suggestions.append({
            "type": "customer_support",
            "title": "Improve Customer Support",
            "description": "Enable faster response times and proactive outreach",
            "expected_impact": "15% satisfaction increase",
            "category": "retention"
        })

        return suggestions

    async def suggest_conversion_improvement(
        self,
        metrics: Dict[str, Any],
        performance: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Suggest ways to improve conversion"""
        return [{
            "type": "checkout_optimization",
            "title": "Optimize Checkout Flow",
            "description": "Reduce checkout steps and enable one-click payments",
            "expected_impact": "10-15% conversion increase",
            "category": "conversion"
        }]

    async def predict_impact(
        self,
        suggestions: List[Dict[str, Any]],
        metrics: Dict[str, Any]
    ) -> Dict[str, float]:
        """Predict impact of suggestions"""
        current_revenue = metrics.get("revenue", 0)

        impact = {}
        for suggestion in suggestions:
            # Parse expected impact
            impact_str = suggestion.get("expected_impact", "0%")
            if "%" in impact_str:
                pct = float(impact_str.split("-")[0].replace("%", "").strip())
                impact[suggestion["type"]] = round(current_revenue * (pct / 100), 2)
            else:
                impact[suggestion["type"]] = 0

        return impact

    def rank_suggestions(
        self,
        suggestions: List[Dict[str, Any]],
        predicted_impact: Dict[str, float]
    ) -> List[str]:
        """Rank suggestions by predicted impact"""
        ranked = sorted(
            suggestions,
            key=lambda s: predicted_impact.get(s["type"], 0),
            reverse=True
        )
        return [s["type"] for s in ranked]

    def assess_difficulty(
        self,
        suggestions: List[Dict[str, Any]]
    ) -> Dict[str, str]:
        """Assess implementation difficulty"""
        difficulty_map = {
            "payment_links": "easy",
            "pricing_optimization": "easy",
            "re_engagement": "medium",
            "loyalty_program": "medium",
            "checkout_optimization": "hard",
            "customer_support": "medium"
        }

        return {
            s["type"]: difficulty_map.get(s["type"], "medium")
            for s in suggestions
        }

    async def handle_api_request(self, message_type: str, data: Dict) -> Dict:
        """Handle API request"""
        if message_type == "growth_suggestion":
            return await self.generate_growth_suggestions(data)
        return {"error": "Unknown message type"}

    async def get_metrics(self) -> Dict[str, Any]:
        """Get agent metrics"""
        return {
            "suggestions_generated": self.suggestions_generated,
        }


if __name__ == "__main__":
    agent = GrowthAgent()
    agent.run()
