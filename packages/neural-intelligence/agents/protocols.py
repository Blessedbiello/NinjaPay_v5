"""
Message protocols for inter-agent communication
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field


# Transaction Analysis
class TransactionAnalysisRequest(BaseModel):
    """Request to analyze a transaction"""
    transaction_id: str
    sender: str
    recipient: str
    amount_commitment: str  # Pedersen commitment
    encrypted_amount: Optional[bytes] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime


class TransactionAnalysisResponse(BaseModel):
    """Response from transaction analysis"""
    transaction_id: str
    risk_score: float  # 0-1
    flags: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    confidence: float
    analyzed_by: str
    timestamp: datetime


# Compliance Checks
class ComplianceCheckRequest(BaseModel):
    """Request compliance check"""
    entity_type: str  # "merchant" or "transaction"
    entity_id: str
    check_types: List[str]  # ["aml", "kyc", "sanctions"]
    data: Dict[str, Any]
    priority: int = 5


class ComplianceCheckResponse(BaseModel):
    """Compliance check result"""
    entity_id: str
    passed: bool
    risk_level: str  # "low", "medium", "high", "critical"
    violations: List[Dict[str, Any]] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    reviewed_by: str
    timestamp: datetime


# Fraud Analysis
class FraudAnalysisRequest(BaseModel):
    """Request fraud analysis"""
    transaction_id: str
    user_id: str
    amount_commitment: str
    transaction_pattern: Dict[str, Any]
    historical_data: Optional[Dict[str, Any]] = None
    real_time: bool = True


class FraudAnalysisResponse(BaseModel):
    """Fraud analysis result"""
    transaction_id: str
    fraud_probability: float  # 0-1
    fraud_type: Optional[str] = None
    confidence: float
    factors: List[Dict[str, Any]] = Field(default_factory=list)
    action_recommended: str  # "approve", "review", "block"
    timestamp: datetime


# Treasury Optimization
class TreasuryOptimizationRequest(BaseModel):
    """Request treasury optimization suggestions"""
    merchant_id: str
    current_liquidity: Dict[str, float]
    upcoming_payments: List[Dict[str, Any]]
    time_horizon: str  # "1d", "7d", "30d"
    optimization_goal: str  # "cost", "speed", "balance"


class TreasuryOptimizationResponse(BaseModel):
    """Treasury optimization suggestions"""
    merchant_id: str
    recommendations: List[Dict[str, Any]]
    estimated_savings: float
    risk_assessment: str
    routing_strategy: Dict[str, Any]
    timestamp: datetime


# Growth Suggestions
class GrowthSuggestionRequest(BaseModel):
    """Request growth suggestions for merchant"""
    merchant_id: str
    metrics: Dict[str, Any]  # transactions, revenue, customers, etc.
    timeframe: str  # "7d", "30d", "90d"
    goals: List[str]  # ["increase_revenue", "reduce_churn", etc.]


class GrowthSuggestionResponse(BaseModel):
    """Growth suggestions for merchant"""
    merchant_id: str
    suggestions: List[Dict[str, Any]]
    predicted_impact: Dict[str, float]
    priority_ranking: List[str]
    implementation_difficulty: Dict[str, str]
    timestamp: datetime


# Support Queries
class SupportQueryRequest(BaseModel):
    """Support query from user or merchant"""
    query_id: str
    user_id: str
    query_text: str
    query_type: Optional[str] = None  # "transaction", "account", "general"
    context: Dict[str, Any] = Field(default_factory=dict)
    urgency: str = "normal"  # "low", "normal", "high", "critical"


class SupportQueryResponse(BaseModel):
    """Support query response"""
    query_id: str
    answer: str
    confidence: float
    sources: List[str] = Field(default_factory=list)
    escalate: bool = False
    suggested_actions: List[str] = Field(default_factory=list)
    timestamp: datetime


# Agent Health Status
class AgentHealthStatus(BaseModel):
    """Agent health and status"""
    agent_name: str
    agent_address: str
    status: str  # "online", "degraded", "offline"
    uptime_seconds: float
    messages_processed: int
    average_response_time_ms: float
    last_error: Optional[str] = None
    capabilities: List[str]
    timestamp: datetime


# Cross-Agent Coordination
class CoordinationRequest(BaseModel):
    """Request coordination between agents"""
    coordinator: str
    participants: List[str]
    task_type: str
    task_data: Dict[str, Any]
    deadline: Optional[datetime] = None


class CoordinationResponse(BaseModel):
    """Response to coordination request"""
    task_id: str
    status: str  # "accepted", "rejected", "completed"
    result: Optional[Dict[str, Any]] = None
    contributor: str
    timestamp: datetime


# Inter-Agent Query Protocols
class RiskScoreQuery(BaseModel):
    """Query for merchant/transaction risk score"""
    query_id: str
    entity_type: str  # "merchant" or "transaction"
    entity_id: str
    requesting_agent: str
    context: Dict[str, Any] = Field(default_factory=dict)


class RiskScoreResponse(BaseModel):
    """Risk score response"""
    query_id: str
    entity_id: str
    risk_score: float  # 0-1
    risk_level: str  # "low", "medium", "high", "critical"
    factors: List[str] = Field(default_factory=list)
    confidence: float
    responding_agent: str
    timestamp: datetime


class FraudScoreQuery(BaseModel):
    """Query for fraud probability"""
    query_id: str
    transaction_id: str
    user_id: str
    requesting_agent: str
    include_factors: bool = True


class FraudScoreResponse(BaseModel):
    """Fraud score response"""
    query_id: str
    transaction_id: str
    fraud_probability: float  # 0-1
    fraud_type: Optional[str] = None
    factors: List[Dict[str, Any]] = Field(default_factory=list)
    recommendation: str  # "approve", "review", "block"
    confidence: float
    responding_agent: str
    timestamp: datetime


class MerchantProfileQuery(BaseModel):
    """Query for merchant profile/analytics"""
    query_id: str
    merchant_id: str
    requesting_agent: str
    fields_requested: List[str]  # ["risk", "fraud_history", "growth_metrics", "support_tickets"]


class MerchantProfileResponse(BaseModel):
    """Merchant profile response"""
    query_id: str
    merchant_id: str
    profile_data: Dict[str, Any]
    data_sources: List[str]
    responding_agent: str
    timestamp: datetime


class AgentConsultation(BaseModel):
    """Request consultation from another agent"""
    consultation_id: str
    requesting_agent: str
    target_agent: str
    question: str
    context: Dict[str, Any] = Field(default_factory=dict)
    urgency: str = "normal"


class AgentConsultationResponse(BaseModel):
    """Response to agent consultation"""
    consultation_id: str
    answer: str
    reasoning: str
    confidence: float
    data: Dict[str, Any] = Field(default_factory=dict)
    responding_agent: str
    timestamp: datetime
