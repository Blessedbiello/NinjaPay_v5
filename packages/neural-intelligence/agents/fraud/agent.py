"""
FraudAgent - Anomaly Detection and Fraud Prevention
Uses MeTTa semantic reasoning and ML models for fraud detection
"""

import os
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json

from uagents import Context
from agents.base import NeuralAgent, AgentResponse
from agents.protocols import (
    FraudAnalysisRequest,
    FraudAnalysisResponse,
    FraudScoreQuery,
    FraudScoreResponse,
)
from knowledge import get_knowledge_base
import uuid

# ML imports (optional - graceful degradation if not available)
try:
    import numpy as np
    from sklearn.ensemble import IsolationForest
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False


class FraudAgent(NeuralAgent):
    """
    Fraud detection agent using MeTTa reasoning and ML models

    Capabilities:
    - Semantic pattern matching via MeTTa
    - ML-based anomaly scoring
    - Multi-dimensional fraud classification
    - Real-time transaction blocking/flagging
    """

    def __init__(self):
        super().__init__(
            name="FraudAgent",
            seed=os.getenv(
                "FRAUD_AGENT_SEED",
                os.getenv("AGENT_SEED", "fraud_agent_seed_phrase")
            ),
            port=int(os.getenv("FRAUD_AGENT_PORT", 8102)),
            endpoint=[f"http://localhost:{os.getenv('FRAUD_AGENT_PORT', 8102)}/submit"],
            mailbox=os.getenv("AGENT_MAILBOX_KEY"),
            log_level=os.getenv("LOG_LEVEL", "INFO"),
        )

        # MeTTa knowledge base
        self.knowledge_base = None

        # ML model for anomaly detection
        self.anomaly_model = None
        self.model_trained = False

        # Register message handlers
        self.register_message_handler("fraud_analysis", self.handle_fraud_analysis)

        # Register inter-agent query handler
        @self.agent.on_message(model=FraudScoreQuery)
        async def handle_fraud_query(ctx: Context, sender: str, msg: FraudScoreQuery):
            """Handle fraud score queries from other agents"""
            self.logger.info(f"Received fraud query from {sender} for transaction {msg.transaction_id}")
            response = await self.get_fraud_score(msg.transaction_id, msg.user_id, msg.include_factors)
            await ctx.send(sender, response)

        # Performance metrics
        self.analyses_performed = 0
        self.fraud_detected = 0
        self.false_positives = 0
        self.blocked_count = 0

        # Fraud detection threshold
        self.threshold = float(os.getenv("FRAUD_DETECTION_THRESHOLD", 0.75))

    async def _on_startup(self, ctx: Context):
        """Initialize agent on startup"""
        await super()._on_startup(ctx)

        # Initialize MeTTa knowledge base
        try:
            self.knowledge_base = get_knowledge_base()
            self.logger.info("MeTTa knowledge base loaded")
        except Exception as e:
            self.logger.error(f"Failed to load MeTTa: {e}")

        # Initialize ML model if available
        if ML_AVAILABLE:
            self.anomaly_model = IsolationForest(
                contamination=0.1,  # Expect 10% anomalies
                random_state=42
            )
            self.logger.info("ML anomaly detection model initialized")
        else:
            self.logger.warning("ML libraries not available, using rule-based detection only")

        # Subscribe to transaction events
        await self.subscribe_to_events(
            ["transaction.created", "transaction.completed"],
            self.handle_event
        )

        # Start background model training
        if ML_AVAILABLE:
            asyncio.create_task(self.train_anomaly_model())

        self.logger.info("FraudAgent ready for detection")

    async def handle_event(self, channel: str, data: str):
        """Handle events from Redis pub/sub"""
        try:
            event_data = json.loads(data)
            event_type = event_data.get("event_type")

            if event_type == "transaction.created":
                # Automatically analyze for fraud
                result = await self.analyze_fraud(event_data["data"])

                # Alert if high fraud probability
                if result["fraud_probability"] > self.threshold:
                    await self.publish_event("fraud.detected", {
                        "transaction_id": event_data["data"]["transaction_id"],
                        "fraud_probability": result["fraud_probability"],
                        "fraud_type": result["fraud_type"],
                        "action_recommended": result["action_recommended"]
                    })

        except Exception as e:
            self.logger.error(f"Error handling event: {e}")

    async def handle_fraud_analysis(
        self,
        ctx: Context,
        msg
    ) -> AgentResponse:
        """Handle fraud analysis request"""
        try:
            request = FraudAnalysisRequest(**msg.payload)
            result = await self.analyze_fraud(request.dict())

            response = AgentResponse(
                request_id=msg.message_id,
                success=True,
                data=result,
                agent_id=self.name,
                timestamp=datetime.utcnow()
            )

            self.analyses_performed += 1
            if result["fraud_probability"] > self.threshold:
                self.fraud_detected += 1

            return response

        except Exception as e:
            self.logger.error(f"Error in fraud analysis: {e}", exc_info=True)
            return AgentResponse(
                request_id=msg.message_id,
                success=False,
                error=str(e),
                agent_id=self.name,
                timestamp=datetime.utcnow()
            )

    async def analyze_fraud(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Comprehensive fraud analysis

        Args:
            transaction_data: Transaction details

        Returns:
            Fraud analysis result
        """
        tx_id = transaction_data.get("transaction_id")
        user_id = transaction_data.get("user_id")
        amount_commitment = transaction_data.get("amount_commitment")
        pattern = transaction_data.get("transaction_pattern", {})

        self.logger.info(f"Analyzing fraud for transaction {tx_id}")

        # Extract features
        features = await self.extract_features(transaction_data)

        # Calculate fraud probability using multiple methods
        metta_probability = await self.calculate_metta_probability(features)
        ml_probability = await self.calculate_ml_probability(features)

        # Weighted ensemble
        fraud_probability = (metta_probability * 0.6) + (ml_probability * 0.4)

        # Classify fraud type
        fraud_type = await self.classify_fraud_type(features, fraud_probability)

        # Determine action
        action_recommended = self.get_recommended_action(fraud_probability)

        # Extract fraud factors
        fraud_factors = await self.extract_fraud_factors(features, fraud_probability)

        # Calculate confidence
        confidence = self.calculate_confidence(metta_probability, ml_probability)

        result = {
            "transaction_id": tx_id,
            "fraud_probability": round(fraud_probability, 3),
            "fraud_type": fraud_type,
            "confidence": round(confidence, 3),
            "factors": fraud_factors,
            "action_recommended": action_recommended,
            "metta_score": round(metta_probability, 3),
            "ml_score": round(ml_probability, 3),
            "timestamp": datetime.utcnow().isoformat()
        }

        # Cache result
        await self.cache_set(f"fraud:{tx_id}", json.dumps(result), ttl=3600)

        return result

    async def extract_features(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract features for fraud detection"""
        user_id = transaction_data.get("user_id")
        estimated_amount = transaction_data.get("estimated_amount", 1000.0)

        # Get transaction history
        tx_history = await self.get_transaction_history(user_id, hours=24)

        # Get user profile
        user_profile = await self.get_user_profile(user_id)

        # Calculate average transaction amount
        if user_profile and user_profile.get("avg_tx_amount"):
            avg_amount = user_profile["avg_tx_amount"]
        else:
            avg_amount = 500.0  # Default

        # Extract temporal features
        current_hour = datetime.utcnow().hour
        current_day = datetime.utcnow().weekday()

        # Device/location features (from transaction pattern)
        pattern = transaction_data.get("transaction_pattern", {})
        new_device = pattern.get("new_device", False)
        new_location = pattern.get("new_location", False)

        features = {
            "amount": estimated_amount,
            "avg_amount": avg_amount,
            "tx_count_24h": len(tx_history),
            "hour": current_hour,
            "day_of_week": current_day,
            "new_device": new_device,
            "new_location": new_location,
            "amount_deviation": abs(estimated_amount - avg_amount) / max(avg_amount, 1),
            "is_round_number": (estimated_amount % 100 == 0) and estimated_amount > 100,
            "velocity": len(tx_history) / 24.0,  # Transactions per hour
        }

        # Add historical context
        if tx_history:
            last_created_at = tx_history[0].get("created_at")
            if isinstance(last_created_at, str):
                last_created_dt = datetime.fromisoformat(last_created_at)
            else:
                last_created_dt = last_created_at

            if isinstance(last_created_dt, datetime):
                features["time_since_last_tx"] = (
                    datetime.utcnow() - last_created_dt
                ).total_seconds() / 60  # Minutes

        return features

    async def calculate_metta_probability(self, features: Dict[str, Any]) -> float:
        """Calculate fraud probability using MeTTa knowledge graph"""
        if not self.knowledge_base:
            return self._fallback_probability(features)

        try:
            probability = self.knowledge_base.calculate_fraud_probability(
                features["amount"],
                features["tx_count_24h"],
                features["hour"],
                features["new_device"],
                features["avg_amount"]
            )
            return float(probability)
        except Exception as e:
            self.logger.warning(f"MeTTa query failed: {e}, using fallback")
            return self._fallback_probability(features)

    def _fallback_probability(self, features: Dict[str, Any]) -> float:
        """Fallback fraud probability calculation"""
        score = 0.0

        # Amount anomaly
        if features["is_round_number"]:
            score += 0.3
        if features["amount_deviation"] > 3.0:
            score += 0.5

        # Velocity
        if features["tx_count_24h"] > 20:
            score += 0.7
        elif features["tx_count_24h"] > 10:
            score += 0.4

        # Time anomaly
        if features["hour"] < 4 or features["hour"] > 23:
            score += 0.4

        # Device/location
        if features["new_device"] and features["amount"] > 1000:
            score += 0.5

        return min(score / 1.5, 1.0)  # Normalize

    async def calculate_ml_probability(self, features: Dict[str, Any]) -> float:
        """Calculate fraud probability using ML model"""
        if not ML_AVAILABLE or not self.model_trained:
            return 0.5  # Neutral score if ML not available

        try:
            # Convert features to array
            feature_vector = np.array([[
                features["amount"],
                features["avg_amount"],
                features["tx_count_24h"],
                features["hour"],
                features["amount_deviation"],
                1.0 if features["new_device"] else 0.0,
                1.0 if features["is_round_number"] else 0.0,
                features["velocity"],
            ]])

            # Predict anomaly score
            anomaly_score = self.anomaly_model.score_samples(feature_vector)[0]

            # Convert to probability (0-1 range)
            # More negative score = more anomalous
            probability = 1 / (1 + np.exp(anomaly_score))

            return float(probability)

        except Exception as e:
            self.logger.error(f"ML prediction error: {e}")
            return 0.5

    async def classify_fraud_type(
        self,
        features: Dict[str, Any],
        probability: float
    ) -> Optional[str]:
        """Classify the type of fraud"""
        if probability < 0.5:
            return None

        if self.knowledge_base:
            try:
                fraud_type = self.knowledge_base.classify_fraud_type(
                    features["tx_count_24h"],
                    features.get("time_since_last_tx", 60),
                    features["new_device"],
                    features["amount"]
                )
                return str(fraud_type)
            except Exception as e:
                self.logger.warning(f"MeTTa classification failed: {e}")

        # Fallback classification
        if features["tx_count_24h"] > 5 and features["amount"] < 50:
            return "card_testing"
        elif features["new_device"] and features["amount_deviation"] > 4:
            return "account_takeover"
        elif features["is_round_number"] and features["amount"] > 1000:
            return "manual_fraud"
        elif features["tx_count_24h"] > 15:
            return "automated_fraud"
        else:
            return "suspicious_activity"

    def get_recommended_action(self, fraud_probability: float) -> str:
        """Determine recommended action"""
        if self.knowledge_base:
            try:
                return self.knowledge_base.get_fraud_action(fraud_probability)
            except Exception:
                pass

        # Fallback
        if fraud_probability > 0.85:
            self.blocked_count += 1
            return "block"
        elif fraud_probability > 0.65:
            return "challenge"  # Require MFA
        elif fraud_probability > 0.45:
            return "monitor"
        else:
            return "approve"

    async def extract_fraud_factors(
        self,
        features: Dict[str, Any],
        probability: float
    ) -> List[Dict[str, Any]]:
        """Extract factors contributing to fraud score"""
        factors = []

        if features["amount_deviation"] > 3.0:
            factors.append({
                "factor": "unusual_amount",
                "weight": 0.5,
                "description": f"Amount deviates significantly from user's average"
            })

        if features["tx_count_24h"] > 15:
            factors.append({
                "factor": "high_velocity",
                "weight": 0.7,
                "description": f"{features['tx_count_24h']} transactions in 24 hours"
            })

        if features["new_device"]:
            factors.append({
                "factor": "new_device",
                "weight": 0.5,
                "description": "Transaction from new device"
            })

        if features["hour"] < 4:
            factors.append({
                "factor": "unusual_time",
                "weight": 0.4,
                "description": f"Transaction at {features['hour']}:00 (unusual hour)"
            })

        if features["is_round_number"]:
            factors.append({
                "factor": "round_number",
                "weight": 0.3,
                "description": "Round number amount (common in fraud)"
            })

        return factors

    def calculate_confidence(self, metta_score: float, ml_score: float) -> float:
        """Calculate confidence in prediction"""
        # Higher confidence when both models agree
        agreement = 1 - abs(metta_score - ml_score)
        base_confidence = 0.7
        return min(base_confidence + (agreement * 0.3), 1.0)

    async def train_anomaly_model(self):
        """Train anomaly detection model on historical data"""
        if not ML_AVAILABLE:
            return

        self.logger.info("Training anomaly detection model...")

        try:
            # Fetch historical transaction data
            query = """
                SELECT
                    id,
                    sender,
                    created_at
                FROM transactions
                WHERE created_at > NOW() - INTERVAL '30 days'
                LIMIT 10000
            """
            transactions = await self.query_database(query)

            if len(transactions) < 100:
                self.logger.warning("Insufficient data for model training")
                return

            # Extract features from historical data
            feature_vectors = []
            for tx in transactions:
                # Simplified feature extraction for training
                created_at = tx.get("created_at")
                if isinstance(created_at, str):
                    created_dt = datetime.fromisoformat(created_at)
                else:
                    created_dt = created_at

                hour = created_dt.hour if isinstance(created_dt, datetime) else 0

                feature_vectors.append([
                    1000.0,  # Placeholder amount
                    500.0,   # Placeholder avg
                    5,       # Placeholder count
                    hour,
                    1.0,     # Placeholder deviation
                    0,       # Not new device
                    0,       # Not round
                    0.2,     # Placeholder velocity
                ])

            X = np.array(feature_vectors)

            # Train model
            self.anomaly_model.fit(X)
            self.model_trained = True

            self.logger.info(f"Anomaly model trained on {len(X)} samples")

        except Exception as e:
            self.logger.error(f"Model training failed: {e}")

    async def report_false_positive(self, transaction_id: str):
        """Record false positive for model improvement"""
        self.false_positives += 1
        self.logger.info(f"False positive reported for {transaction_id}")
        # In production, retrain model with feedback

    # Database helpers

    async def get_transaction_history(
        self,
        user_id: str,
        hours: int = 24
    ) -> List[Dict]:
        """Get recent transaction history"""
        try:
            cutoff = datetime.utcnow() - timedelta(hours=hours)
            query = """
                SELECT id, created_at
                FROM transactions
                WHERE user_id = $1 AND created_at > $2
                ORDER BY created_at DESC
            """
            return await self.query_database(query, user_id, cutoff)
        except Exception as e:
            self.logger.error(f"Error fetching history: {e}")
            return []

    async def get_user_profile(self, user_id: str) -> Optional[Dict]:
        """Get user profile with statistics"""
        # In production, calculate from aggregated data
        return {
            "user_id": user_id,
            "avg_tx_amount": 500.0,
            "total_transactions": 100
        }

    async def handle_api_request(self, message_type: str, data: Dict) -> Dict:
        """Handle API request"""
        if message_type == "fraud_analysis":
            return await self.analyze_fraud(data)
        return {"error": "Unknown message type"}

    async def get_fraud_score(
        self,
        transaction_id: str,
        user_id: str,
        include_factors: bool = True
    ) -> FraudScoreResponse:
        """
        Get fraud score for inter-agent queries
        Enables other agents to query fraud risk without full analysis
        """
        self.logger.info(f"Computing fraud score for transaction {transaction_id}")

        try:
            # Build minimal transaction data for analysis
            transaction_data = {
                "transaction_id": transaction_id,
                "user_id": user_id,
                "amount_commitment": "simulated_commitment",  # Would be real in production
                "transaction_pattern": {
                    "new_device": False,
                    "new_location": False,
                    "unusual_time": False
                }
            }

            # Perform fraud analysis
            result = await self.analyze_fraud(transaction_data)

            # Build response with factors if requested
            factors = []
            if include_factors and "factors" in result:
                factors = result["factors"]

            return FraudScoreResponse(
                query_id=str(uuid.uuid4()),
                transaction_id=transaction_id,
                fraud_probability=result.get("fraud_probability", 0.5),
                fraud_type=result.get("fraud_type"),
                factors=factors if include_factors else [],
                recommendation=result.get("action_recommended", "review"),
                confidence=result.get("confidence", 0.7),
                responding_agent=self.name,
                timestamp=datetime.utcnow()
            )

        except Exception as e:
            self.logger.error(f"Error computing fraud score: {e}")
            return FraudScoreResponse(
                query_id=str(uuid.uuid4()),
                transaction_id=transaction_id,
                fraud_probability=0.5,
                fraud_type="unknown",
                factors=[{"error": str(e)}] if include_factors else [],
                recommendation="review",
                confidence=0.0,
                responding_agent=self.name,
                timestamp=datetime.utcnow()
            )

    async def get_metrics(self) -> Dict[str, Any]:
        """Get agent performance metrics"""
        return {
            "analyses_performed": self.analyses_performed,
            "fraud_detected": self.fraud_detected,
            "false_positives": self.false_positives,
            "blocked_count": self.blocked_count,
            "model_trained": self.model_trained,
        }


if __name__ == "__main__":
    agent = FraudAgent()
    agent.run()
