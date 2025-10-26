"""
Neural Intelligence System - Base Agent Infrastructure
"""

from .base import NeuralAgent, AgentMessage, AgentResponse
from .protocols import (
    TransactionAnalysisRequest,
    TransactionAnalysisResponse,
    ComplianceCheckRequest,
    ComplianceCheckResponse,
    FraudAnalysisRequest,
    FraudAnalysisResponse,
    TreasuryOptimizationRequest,
    TreasuryOptimizationResponse,
    GrowthSuggestionRequest,
    GrowthSuggestionResponse,
    SupportQueryRequest,
    SupportQueryResponse,
)

__all__ = [
    "NeuralAgent",
    "AgentMessage",
    "AgentResponse",
    "TransactionAnalysisRequest",
    "TransactionAnalysisResponse",
    "ComplianceCheckRequest",
    "ComplianceCheckResponse",
    "FraudAnalysisRequest",
    "FraudAnalysisResponse",
    "TreasuryOptimizationRequest",
    "TreasuryOptimizationResponse",
    "GrowthSuggestionRequest",
    "GrowthSuggestionResponse",
    "SupportQueryRequest",
    "SupportQueryResponse",
]
