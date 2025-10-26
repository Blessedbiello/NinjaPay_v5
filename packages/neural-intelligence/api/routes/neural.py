"""Neural Intelligence API routes"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from datetime import datetime
from pydantic import BaseModel

from ..agent_manager import AgentManager

router = APIRouter()


# Request/Response Models
class FraudAnalysisRequest(BaseModel):
    transaction_id: str
    user_id: str
    amount_commitment: str
    transaction_pattern: Dict[str, Any]


class ComplianceCheckRequest(BaseModel):
    entity_type: str
    entity_id: str
    check_types: List[str]
    data: Dict[str, Any]


class TreasuryOptimizationRequest(BaseModel):
    merchant_id: str
    current_liquidity: Dict[str, float]
    upcoming_payments: List[Dict[str, Any]]
    time_horizon: str
    optimization_goal: str


class GrowthSuggestionRequest(BaseModel):
    merchant_id: str
    metrics: Dict[str, Any]
    timeframe: str
    goals: List[str]


class SupportQueryRequest(BaseModel):
    query_id: str
    user_id: str
    query_text: str
    query_type: str | None = None
    urgency: str = "normal"


# Dependency to get agent manager
def get_agent_manager() -> AgentManager:
    # This would normally be injected, but for now we'll create a singleton
    if not hasattr(get_agent_manager, "instance"):
        get_agent_manager.instance = AgentManager()
    return get_agent_manager.instance


@router.post("/fraud/analyze")
async def analyze_fraud(
    request: FraudAnalysisRequest,
    manager: AgentManager = Depends(get_agent_manager)
):
    """Analyze transaction for fraud"""
    try:
        result = await manager.send_to_agent(
            "fraud",
            "fraud_analysis",
            request.dict()
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compliance/check")
async def check_compliance(
    request: ComplianceCheckRequest,
    manager: AgentManager = Depends(get_agent_manager)
):
    """Check compliance for entity"""
    try:
        result = await manager.send_to_agent(
            "compliance",
            "compliance_check",
            request.dict()
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/treasury/optimize")
async def optimize_treasury(
    request: TreasuryOptimizationRequest,
    manager: AgentManager = Depends(get_agent_manager)
):
    """Get treasury optimization suggestions"""
    try:
        result = await manager.send_to_agent(
            "treasury",
            "treasury_optimization",
            request.dict()
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/growth/suggest")
async def suggest_growth(
    request: GrowthSuggestionRequest,
    manager: AgentManager = Depends(get_agent_manager)
):
    """Get growth suggestions for merchant"""
    try:
        result = await manager.send_to_agent(
            "growth",
            "growth_suggestion",
            request.dict()
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/support/chat")
async def support_chat(
    request: SupportQueryRequest,
    manager: AgentManager = Depends(get_agent_manager)
):
    """Handle support query"""
    try:
        result = await manager.send_to_agent(
            "support",
            "support_query",
            request.dict()
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents/status")
async def get_agents_status(
    manager: AgentManager = Depends(get_agent_manager)
):
    """Get status of all agents"""
    try:
        status = await manager.get_agent_status()
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "agents": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/agents/broadcast")
async def broadcast_to_agents(
    message_type: str,
    data: Dict[str, Any],
    target_agents: List[str] | None = None,
    manager: AgentManager = Depends(get_agent_manager)
):
    """Broadcast message to multiple agents"""
    try:
        results = await manager.broadcast_to_agents(message_type, data, target_agents)
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
