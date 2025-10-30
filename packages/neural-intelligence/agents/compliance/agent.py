"""
ComplianceAgent - AML/KYC/Sanctions Monitoring
Monitors transactions for regulatory compliance using MeTTa knowledge graphs
"""

import os
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from uagents import Context
from agents.base import NeuralAgent, AgentResponse
from agents.protocols import (
    ComplianceCheckRequest,
    ComplianceCheckResponse,
    RiskScoreQuery,
    RiskScoreResponse,
)
from knowledge import get_knowledge_base
import uuid


class ComplianceAgent(NeuralAgent):
    """
    AML/KYC/Sanctions compliance monitoring agent

    Capabilities:
    - Real-time transaction compliance checking
    - MeTTa-powered rule evaluation
    - Risk scoring based on 50+ compliance rules
    - Automated SAR/CTR reporting recommendations
    """

    def __init__(self):
        super().__init__(
            name="ComplianceAgent",
            seed=os.getenv(
                "COMPLIANCE_AGENT_SEED",
                os.getenv("AGENT_SEED", "compliance_agent_seed_phrase")
            ),
            port=int(os.getenv("COMPLIANCE_AGENT_PORT", 8100)),
            endpoint=[f"http://localhost:{os.getenv('COMPLIANCE_AGENT_PORT', 8100)}/submit"],
            mailbox=os.getenv("AGENT_MAILBOX_KEY"),
            log_level=os.getenv("LOG_LEVEL", "INFO"),
        )

        # MeTTa knowledge base
        self.knowledge_base = None

        # Register message handlers
        self.register_message_handler("compliance_check", self.handle_compliance_check)

        # Register inter-agent query handler
        @self.agent.on_message(model=RiskScoreQuery)
        async def handle_risk_query(ctx: Context, sender: str, msg: RiskScoreQuery):
            """Handle risk score queries from other agents"""
            self.logger.info(f"Received risk query from {sender} for {msg.entity_id}")
            response = await self.get_risk_score(msg.entity_type, msg.entity_id, msg.context)
            await ctx.send(sender, response)

        # Performance metrics
        self.checks_performed = 0
        self.high_risk_flags = 0
        self.blocked_transactions = 0

    async def _on_startup(self, ctx: Context):
        """Initialize agent on startup"""
        await super()._on_startup(ctx)

        # Initialize MeTTa knowledge base
        try:
            self.knowledge_base = get_knowledge_base()
            self.logger.info("MeTTa knowledge base loaded")
        except Exception as e:
            self.logger.error(f"Failed to load MeTTa knowledge base: {e}")
            self.logger.info("Falling back to rule-based compliance checking")

        # Subscribe to transaction events
        await self.subscribe_to_events(
            ["transaction.created", "merchant.signup"],
            self.handle_event
        )

        self.logger.info("ComplianceAgent ready for monitoring")

    async def handle_event(self, channel: str, data: str):
        """Handle events from Redis pub/sub"""
        import json
        try:
            event_data = json.loads(data)
            event_type = event_data.get("event_type")

            if event_type == "transaction.created":
                # Automatically check transaction compliance
                await self.check_transaction_compliance(event_data["data"])
            elif event_type == "merchant.signup":
                # Perform KYC check on new merchant
                await self.check_merchant_kyc(event_data["data"])

        except Exception as e:
            self.logger.error(f"Error handling event: {e}")

    async def handle_compliance_check(
        self,
        ctx: Context,
        msg
    ) -> AgentResponse:
        """Handle compliance check request from API"""
        try:
            request = ComplianceCheckRequest(**msg.payload)

            if request.entity_type == "transaction":
                result = await self.check_transaction_compliance(request.data)
            elif request.entity_type == "merchant":
                result = await self.check_merchant_kyc(request.data)
            else:
                result = {
                    "passed": False,
                    "error": f"Unknown entity type: {request.entity_type}"
                }

            response = AgentResponse(
                request_id=msg.message_id,
                success=True,
                data=result,
                agent_id=self.name,
                timestamp=datetime.utcnow()
            )

            self.checks_performed += 1
            return response

        except Exception as e:
            self.logger.error(f"Error in compliance check: {e}", exc_info=True)
            return AgentResponse(
                request_id=msg.message_id,
                success=False,
                error=str(e),
                agent_id=self.name,
                timestamp=datetime.utcnow()
            )

    async def check_transaction_compliance(
        self,
        transaction_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Check transaction for AML/KYC compliance

        Args:
            transaction_data: Transaction details

        Returns:
            Compliance check result
        """
        tx_id = transaction_data.get("transaction_id")
        sender = transaction_data.get("sender")
        recipient = transaction_data.get("recipient")
        amount_commitment = transaction_data.get("amount_commitment")

        self.logger.info(f"Checking compliance for transaction {tx_id}")

        # Get user KYC data
        sender_kyc = await self.get_user_kyc_status(sender)
        recipient_kyc = await self.get_user_kyc_status(recipient)

        # Get transaction history
        tx_history = await self.get_transaction_history(sender, hours=24)

        # Estimate amount (from commitment or metadata)
        estimated_amount = transaction_data.get("estimated_amount", 0)
        if not estimated_amount:
            # In production, this would analyze the Pedersen commitment
            # For now, use a placeholder
            estimated_amount = 1000.0

        # Calculate compliance risk score using MeTTa
        risk_score = await self.calculate_compliance_risk(
            sender_kyc,
            estimated_amount,
            len(tx_history),
            transaction_data.get("country", "US")
        )

        # Determine required action
        action = await self.get_required_action(risk_score)

        # Check for specific violations
        violations = await self.check_violations(
            sender_kyc,
            recipient_kyc,
            estimated_amount,
            tx_history,
            transaction_data
        )

        # Generate recommendations
        recommendations = await self.generate_recommendations(
            risk_score,
            violations,
            sender_kyc,
            estimated_amount
        )

        # Determine if passed
        passed = action in ["approve", "enhanced_monitoring"]
        risk_level = self.risk_score_to_level(risk_score)

        if risk_level in ["high", "critical"]:
            self.high_risk_flags += 1
            if action == "block":
                self.blocked_transactions += 1

        # Publish event if high risk
        if risk_score > 0.7:
            await self.publish_event("compliance.high_risk", {
                "transaction_id": tx_id,
                "risk_score": risk_score,
                "action": action,
                "violations": violations
            })

        result = {
            "transaction_id": tx_id,
            "passed": passed,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "action": action,
            "violations": violations,
            "recommendations": recommendations,
            "reviewed_by": self.name,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Cache result
        await self.cache_set(f"compliance:{tx_id}", str(result), ttl=3600)

        return result

    async def calculate_compliance_risk(
        self,
        kyc_status: str,
        amount: float,
        tx_count: int,
        country: str
    ) -> float:
        """Calculate compliance risk score using MeTTa knowledge base"""
        if self.knowledge_base:
            try:
                risk_score = self.knowledge_base.check_compliance_risk(
                    kyc_status,
                    amount,
                    tx_count,
                    country
                )
                return float(risk_score)
            except Exception as e:
                self.logger.warning(f"MeTTa query failed: {e}, using fallback")

        # Fallback rule-based scoring
        return self._fallback_risk_calculation(kyc_status, amount, tx_count, country)

    def _fallback_risk_calculation(
        self,
        kyc_status: str,
        amount: float,
        tx_count: int,
        country: str
    ) -> float:
        """Fallback compliance risk calculation"""
        risk_score = 0.0

        # KYC status score
        kyc_scores = {
            "not_verified": 0.8,
            "pending": 0.5,
            "verified": 0.2,
            "enhanced": 0.1
        }
        risk_score += kyc_scores.get(kyc_status, 0.9) * 0.3

        # Amount score
        if amount > 10000:
            risk_score += 0.9 * 0.3
        elif amount > 5000:
            risk_score += 0.6 * 0.3
        else:
            risk_score += 0.2 * 0.3

        # Velocity score
        if tx_count > 50:
            risk_score += 0.8 * 0.3
        elif tx_count > 20:
            risk_score += 0.5 * 0.3
        else:
            risk_score += 0.1 * 0.3

        # Country score
        high_risk_countries = ["KP", "IR", "SY", "CU"]
        if country in high_risk_countries:
            risk_score += 1.0 * 0.1
        else:
            risk_score += 0.0 * 0.1

        return min(risk_score, 1.0)

    async def get_required_action(self, risk_score: float) -> str:
        """Determine required action based on risk score"""
        if self.knowledge_base:
            try:
                return self.knowledge_base.get_required_action(risk_score)
            except Exception as e:
                self.logger.warning(f"MeTTa query failed: {e}")

        # Fallback
        if risk_score > 0.8:
            return "block"
        elif risk_score > 0.6:
            return "manual_review"
        elif risk_score > 0.4:
            return "enhanced_monitoring"
        else:
            return "approve"

    async def check_violations(
        self,
        sender_kyc: str,
        recipient_kyc: str,
        amount: float,
        tx_history: List[Dict],
        transaction_data: Dict
    ) -> List[Dict[str, Any]]:
        """Check for specific compliance violations"""
        violations = []

        # Check KYC limits
        if self.knowledge_base:
            try:
                kyc_compliant = self.knowledge_base.check_kyc_compliant(sender_kyc, amount)
                if not kyc_compliant:
                    violations.append({
                        "type": "kyc_limit_exceeded",
                        "severity": "high",
                        "description": f"Amount exceeds limit for KYC level: {sender_kyc}"
                    })
            except Exception as e:
                self.logger.warning(f"KYC check failed: {e}")

        # Check for structuring (multiple transactions below threshold)
        if len(tx_history) >= 3:
            recent_amounts = [tx.get("estimated_amount", 0) for tx in tx_history[:3]]
            if all(amt < 5000 for amt in recent_amounts) and sum(recent_amounts) > 10000:
                violations.append({
                    "type": "structuring",
                    "severity": "critical",
                    "description": "Multiple transactions below threshold totaling over $10,000"
                })

        # Check velocity
        if len(tx_history) > 20:
            violations.append({
                "type": "excessive_velocity",
                "severity": "medium",
                "description": f"{len(tx_history)} transactions in 24 hours"
            })

        # Check for CTR requirement
        if amount > 10000:
            violations.append({
                "type": "ctr_required",
                "severity": "info",
                "description": "Currency Transaction Report required for amount > $10,000"
            })

        return violations

    async def generate_recommendations(
        self,
        risk_score: float,
        violations: List[Dict],
        kyc_status: str,
        amount: float
    ) -> List[str]:
        """Generate compliance recommendations"""
        recommendations = []

        if risk_score > 0.6:
            recommendations.append("Consider filing SAR (Suspicious Activity Report)")

        if kyc_status in ["not_verified", "pending"]:
            recommendations.append("Complete KYC verification before processing high-value transactions")

        if amount > 50000:
            recommendations.append("Enhanced Due Diligence (EDD) recommended")

        for violation in violations:
            if violation["type"] == "structuring":
                recommendations.append("Investigate for potential money laundering activity")
            elif violation["type"] == "ctr_required":
                recommendations.append("File CTR within 15 days")

        return recommendations

    async def check_merchant_kyc(self, merchant_data: Dict[str, Any]) -> Dict[str, Any]:
        """Check merchant KYC compliance"""
        merchant_id = merchant_data.get("merchant_id")

        self.logger.info(f"Checking KYC for merchant {merchant_id}")

        # Get merchant details from database
        merchant = await self.get_merchant_details(merchant_id)

        if not merchant:
            return {
                "passed": False,
                "risk_level": "unknown",
                "violations": [{"type": "merchant_not_found", "severity": "critical"}]
            }

        kyc_status = merchant.get("kyc_status", "pending")
        business_type = merchant.get("business_type", "unknown")
        monthly_volume = merchant.get("monthly_volume", 0)

        # Calculate risk
        risk_score = 0.3 if kyc_status == "verified" else 0.7

        # High-risk business types
        high_risk_types = ["gambling", "crypto_exchange", "adult_content"]
        if business_type in high_risk_types:
            risk_score += 0.2

        violations = []
        if kyc_status != "verified":
            violations.append({
                "type": "kyc_incomplete",
                "severity": "high",
                "description": "Merchant KYC verification not completed"
            })

        return {
            "merchant_id": merchant_id,
            "passed": kyc_status == "verified",
            "risk_level": self.risk_score_to_level(risk_score),
            "risk_score": risk_score,
            "violations": violations,
            "recommendations": ["Complete KYC verification"] if violations else [],
            "reviewed_by": self.name,
            "timestamp": datetime.utcnow().isoformat()
        }

    # Helper methods for database queries

    async def get_user_kyc_status(self, user_address: str) -> str:
        """Get user KYC status from database"""
        try:
            query = "SELECT kyc_status FROM users WHERE wallet_address = $1"
            results = await self.query_database(query, user_address)
            if results:
                # Map database status to our KYC levels
                db_status = results[0].get("kyc_status", "not_verified")
                return db_status
            return "not_verified"
        except Exception as e:
            self.logger.error(f"Error fetching KYC status: {e}")
            return "not_verified"

    async def get_transaction_history(self, user_address: str, hours: int = 24) -> List[Dict]:
        """Get recent transaction history for user"""
        try:
            cutoff = datetime.utcnow() - timedelta(hours=hours)
            query = """
                SELECT id, sender, recipient, created_at
                FROM transactions
                WHERE (sender = $1 OR recipient = $1)
                AND created_at > $2
                ORDER BY created_at DESC
            """
            results = await self.query_database(query, user_address, cutoff)
            return results
        except Exception as e:
            self.logger.error(f"Error fetching transaction history: {e}")
            return []

    async def get_merchant_details(self, merchant_id: str) -> Optional[Dict]:
        """Get merchant details from database"""
        try:
            query = """
                SELECT id, kyc_status, business_name, email
                FROM merchants
                WHERE id = $1
            """
            results = await self.query_database(query, merchant_id)
            return results[0] if results else None
        except Exception as e:
            self.logger.error(f"Error fetching merchant: {e}")
            return None

    @staticmethod
    def risk_score_to_level(risk_score: float) -> str:
        """Convert risk score to risk level"""
        if risk_score > 0.8:
            return "critical"
        elif risk_score > 0.6:
            return "high"
        elif risk_score > 0.4:
            return "medium"
        else:
            return "low"

    async def handle_api_request(self, message_type: str, data: Dict) -> Dict:
        """Handle API request (called by agent manager)"""
        if message_type == "compliance_check":
            request = ComplianceCheckRequest(**data)

            if request.entity_type == "transaction":
                return await self.check_transaction_compliance(request.data)
            elif request.entity_type == "merchant":
                return await self.check_merchant_kyc(request.data)

        return {"error": "Unknown message type"}

    async def get_risk_score(
        self,
        entity_type: str,
        entity_id: str,
        context: Dict[str, Any]
    ) -> RiskScoreResponse:
        """
        Get risk score for inter-agent queries
        This enables other agents to ask ComplianceAgent about risk assessment
        """
        self.logger.info(f"Computing risk score for {entity_type} {entity_id}")

        try:
            if entity_type == "transaction":
                # Get transaction details
                transaction_data = context.get("transaction_data", {})
                result = await self.check_transaction_compliance(transaction_data)

                return RiskScoreResponse(
                    query_id=context.get("query_id", str(uuid.uuid4())),
                    entity_id=entity_id,
                    risk_score=result.get("risk_score", 0.5),
                    risk_level=result.get("risk_level", "medium"),
                    factors=result.get("violations", []),
                    confidence=0.85,
                    responding_agent=self.name,
                    timestamp=datetime.utcnow()
                )

            elif entity_type == "merchant":
                # Get merchant KYC status
                merchant_data = context.get("merchant_data", {})
                result = await self.check_merchant_kyc(merchant_data)

                return RiskScoreResponse(
                    query_id=context.get("query_id", str(uuid.uuid4())),
                    entity_id=entity_id,
                    risk_score=result.get("risk_score", 0.5),
                    risk_level=result.get("risk_level", "medium"),
                    factors=[v.get("rule") for v in result.get("violations", [])],
                    confidence=0.90,
                    responding_agent=self.name,
                    timestamp=datetime.utcnow()
                )

            else:
                # Unknown entity type
                return RiskScoreResponse(
                    query_id=context.get("query_id", str(uuid.uuid4())),
                    entity_id=entity_id,
                    risk_score=0.5,
                    risk_level="unknown",
                    factors=["Unknown entity type"],
                    confidence=0.0,
                    responding_agent=self.name,
                    timestamp=datetime.utcnow()
                )

        except Exception as e:
            self.logger.error(f"Error computing risk score: {e}")
            return RiskScoreResponse(
                query_id=context.get("query_id", str(uuid.uuid4())),
                entity_id=entity_id,
                risk_score=0.5,
                risk_level="error",
                factors=[f"Error: {str(e)}"],
                confidence=0.0,
                responding_agent=self.name,
                timestamp=datetime.utcnow()
            )

    async def get_metrics(self) -> Dict[str, Any]:
        """Get agent performance metrics"""
        return {
            "checks_performed": self.checks_performed,
            "high_risk_flags": self.high_risk_flags,
            "blocked_transactions": self.blocked_transactions,
            "uptime": self.is_running,
        }


# Entry point for running agent standalone
if __name__ == "__main__":
    agent = ComplianceAgent()
    agent.run()
