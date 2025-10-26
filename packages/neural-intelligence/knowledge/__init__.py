"""
MeTTa Knowledge Graph Interface
Provides Python wrapper for querying MeTTa knowledge graphs
"""

import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import logging

try:
    from hyperon import MeTTa, Environment
    METTA_AVAILABLE = True
except ImportError:
    METTA_AVAILABLE = False
    logging.warning("MeTTa (hyperon) not available. Install with: pip install hyperon")


logger = logging.getLogger("neural.knowledge")


class MeTTaKnowledgeBase:
    """Interface to MeTTa knowledge graphs"""

    def __init__(self, knowledge_dir: Optional[str] = None):
        """
        Initialize MeTTa knowledge base

        Args:
            knowledge_dir: Directory containing .metta files
        """
        if not METTA_AVAILABLE:
            raise RuntimeError("MeTTa (hyperon) is not installed")

        self.knowledge_dir = knowledge_dir or os.path.join(
            Path(__file__).parent
        )

        # Initialize MeTTa runtime
        self.metta = MeTTa()
        self.env = Environment()

        # Load knowledge graphs
        self._load_knowledge_graphs()

        logger.info(f"MeTTa knowledge base initialized from {self.knowledge_dir}")

    def _load_knowledge_graphs(self):
        """Load all .metta files from knowledge directory"""
        knowledge_files = [
            "compliance_rules.metta",
            "fraud_patterns.metta",
            "financial_ontology.metta",
        ]

        for filename in knowledge_files:
            filepath = os.path.join(self.knowledge_dir, filename)
            if os.path.exists(filepath):
                try:
                    with open(filepath, 'r') as f:
                        content = f.read()
                        self.metta.run(content)
                    logger.info(f"Loaded knowledge graph: {filename}")
                except Exception as e:
                    logger.error(f"Error loading {filename}: {e}")
            else:
                logger.warning(f"Knowledge file not found: {filepath}")

    def query(self, query_str: str) -> List[Any]:
        """
        Execute MeTTa query

        Args:
            query_str: MeTTa query string

        Returns:
            List of results
        """
        try:
            result = self.metta.run(query_str)
            return result
        except Exception as e:
            logger.error(f"Error executing query '{query_str}': {e}")
            return []

    # Compliance queries
    def check_compliance_risk(
        self,
        kyc_level: str,
        amount: float,
        tx_count: int,
        country: str
    ) -> float:
        """Calculate compliance risk score"""
        query = f'!(compliance-risk-score "{kyc_level}" {amount} {tx_count} "{country}")'
        result = self.query(query)
        return float(result[0]) if result else 0.5

    def get_required_action(self, risk_score: float) -> str:
        """Get required compliance action"""
        query = f'!(required-action {risk_score})'
        result = self.query(query)
        return str(result[0]) if result else "review"

    def check_kyc_compliant(self, kyc_level: str, amount: float) -> bool:
        """Check if transaction is KYC compliant"""
        query = f'!(kyc-compliant "{kyc_level}" {amount})'
        result = self.query(query)
        return bool(result[0]) if result else False

    # Fraud queries
    def calculate_fraud_probability(
        self,
        amount: float,
        tx_count: int,
        hour: int,
        new_device: bool,
        avg_amount: float
    ) -> float:
        """Calculate fraud probability"""
        new_dev = "True" if new_device else "False"
        query = f'!(fraud-probability {amount} {tx_count} {hour} {new_dev} {avg_amount})'
        result = self.query(query)
        return float(result[0]) if result else 0.0

    def classify_fraud_type(
        self,
        tx_count: int,
        time_diff: float,
        new_device: bool,
        amount: float
    ) -> str:
        """Classify type of fraud"""
        new_dev = "True" if new_device else "False"
        query = f'!(classify-fraud-type {tx_count} {time_diff} {new_dev} {amount})'
        result = self.query(query)
        return str(result[0]) if result else "unknown"

    def get_fraud_action(self, probability: float) -> str:
        """Get recommended action for fraud probability"""
        query = f'!(fraud-action {probability})'
        result = self.query(query)
        return str(result[0]) if result else "review"

    # Financial ontology queries
    def get_trust_level(self, reputation: float) -> str:
        """Get trust level from reputation score"""
        query = f'!(trust-level {reputation})'
        result = self.query(query)
        return str(result[0]) if result else "fair"

    def recommend_routing(self, amount: float, urgency: int) -> str:
        """Recommend transaction routing (L1 vs L2)"""
        query = f'!(recommend-routing {amount} {urgency})'
        result = self.query(query)
        return str(result[0]) if result else "L1"

    def check_liquidity_health(
        self,
        entity_type: str,
        liquid: float,
        total: float
    ) -> bool:
        """Check if liquidity is healthy"""
        query = f'!(liquidity-healthy "{entity_type}" {liquid} {total})'
        result = self.query(query)
        return bool(result[0]) if result else True


# Global knowledge base instance
_knowledge_base: Optional[MeTTaKnowledgeBase] = None


def get_knowledge_base() -> MeTTaKnowledgeBase:
    """Get or create global knowledge base instance"""
    global _knowledge_base
    if _knowledge_base is None:
        _knowledge_base = MeTTaKnowledgeBase()
    return _knowledge_base
