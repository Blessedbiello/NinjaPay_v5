/**
 * Neural Intelligence System - TypeScript Types
 * Complete type definitions for all agents and API endpoints
 */

// ============================================
// Core Types
// ============================================

export interface NeuralIntelligenceConfig {
  apiUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}

export interface AgentStatus {
  name: string;
  address: string;
  running: boolean;
  uptime: number | null;
}

export interface AgentHealth {
  status: 'healthy' | 'degraded' | 'offline';
  timestamp: string;
  agents: Record<string, AgentStatus>;
}

// ============================================
// Compliance Types
// ============================================

export interface ComplianceCheckRequest {
  entity_type: 'transaction' | 'merchant';
  entity_id: string;
  check_types: ('aml' | 'kyc' | 'sanctions')[];
  data: Record<string, any>;
  priority?: number;
}

export interface ComplianceViolation {
  type: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface ComplianceCheckResponse {
  entity_id: string;
  passed: boolean;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  action: 'approve' | 'enhanced_monitoring' | 'manual_review' | 'block';
  violations: ComplianceViolation[];
  recommendations: string[];
  reviewed_by: string;
  timestamp: string;
}

// ============================================
// Fraud Detection Types
// ============================================

export interface FraudAnalysisRequest {
  transaction_id: string;
  user_id: string;
  amount_commitment: string;
  transaction_pattern: {
    new_device?: boolean;
    new_location?: boolean;
    time_of_day?: number;
    [key: string]: any;
  };
  historical_data?: Record<string, any>;
  real_time?: boolean;
}

export interface FraudFactor {
  factor: string;
  weight: number;
  description: string;
}

export interface FraudAnalysisResponse {
  transaction_id: string;
  fraud_probability: number;
  fraud_type: string | null;
  confidence: number;
  factors: FraudFactor[];
  action_recommended: 'approve' | 'monitor' | 'challenge' | 'block';
  metta_score?: number;
  ml_score?: number;
  timestamp: string;
}

// ============================================
// Treasury Optimization Types
// ============================================

export interface TreasuryOptimizationRequest {
  merchant_id: string;
  current_liquidity: Record<string, number>;
  upcoming_payments: Array<{
    amount: number;
    urgency: number;
    recipient?: string;
    [key: string]: any;
  }>;
  time_horizon: '1d' | '7d' | '30d';
  optimization_goal: 'cost' | 'speed' | 'balance';
}

export interface LiquidityHealth {
  total_balance: number;
  liquid_balance: number;
  liquidity_ratio: number;
  is_healthy: boolean;
  status: 'healthy' | 'low' | 'critical';
}

export interface RoutingStrategy {
  l1_count: number;
  l2_count: number;
  l1_total: number;
  l2_total: number;
  optimization_goal: string;
  routing_breakdown: {
    solana_l1: number;
    magicblock_l2: number;
  };
}

export interface TreasuryRecommendation {
  priority: 'low' | 'medium' | 'high';
  action: string;
  description: string;
  impact: string;
}

export interface TreasuryOptimizationResponse {
  merchant_id: string;
  liquidity_health: LiquidityHealth;
  routing_strategy: RoutingStrategy;
  recommendations: TreasuryRecommendation[];
  estimated_savings: number;
  risk_assessment: 'low' | 'medium' | 'high';
  timestamp: string;
}

// ============================================
// Growth Analytics Types
// ============================================

export interface GrowthSuggestionRequest {
  merchant_id: string;
  metrics: {
    transactions: number;
    revenue: number;
    customers: number;
    previous_revenue?: number;
    days_since_last_transaction?: number;
    [key: string]: any;
  };
  timeframe: '7d' | '30d' | '90d';
  goals: ('increase_revenue' | 'reduce_churn' | 'improve_conversion')[];
}

export interface PerformanceAnalysis {
  transactions_count: number;
  total_revenue: number;
  unique_customers: number;
  growth_rate_pct: number;
  is_healthy_growth: boolean;
  churn_risk: number;
  avg_transaction_value: number;
}

export interface GrowthSuggestion {
  type: string;
  title: string;
  description: string;
  expected_impact: string;
  category: 'revenue' | 'retention' | 'conversion';
}

export interface GrowthSuggestionResponse {
  merchant_id: string;
  performance_analysis: PerformanceAnalysis;
  suggestions: GrowthSuggestion[];
  predicted_impact: Record<string, number>;
  priority_ranking: string[];
  implementation_difficulty: Record<string, 'easy' | 'medium' | 'hard'>;
  timeframe_analyzed: string;
  timestamp: string;
}

// ============================================
// Support Types
// ============================================

export interface SupportQueryRequest {
  query_id: string;
  user_id: string;
  query_text: string;
  query_type?: 'transaction' | 'account' | 'general';
  context?: Record<string, any>;
  urgency?: 'low' | 'normal' | 'high' | 'critical';
}

export interface SupportQueryResponse {
  query_id: string;
  answer: string;
  confidence: number;
  sources: string[];
  escalate: boolean;
  suggested_actions: string[];
  timestamp: string;
}

// ============================================
// WebSocket Types
// ============================================

export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: number;
}

export interface AgentEvent {
  type: 'agent_event';
  event_type: string;
  data: Record<string, any>;
  timestamp: number;
}

export type WebSocketCallback = (message: AgentEvent) => void;

// ============================================
// Error Types
// ============================================

export class NeuralIntelligenceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'NeuralIntelligenceError';
  }
}
