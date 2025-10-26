/**
 * Neural Intelligence System - REST Client
 * Complete TypeScript client for all agent APIs
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  NeuralIntelligenceConfig,
  NeuralIntelligenceError,
  AgentHealth,
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
} from './types';

export class NeuralIntelligenceClient {
  private client: AxiosInstance;
  private config: Required<NeuralIntelligenceConfig>;

  constructor(config: NeuralIntelligenceConfig) {
    this.config = {
      apiUrl: config.apiUrl,
      apiKey: config.apiKey || '',
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
    };

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey }),
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        throw this.handleError(error);
      }
    );
  }

  private handleError(error: AxiosError): NeuralIntelligenceError {
    if (error.response) {
      const data = error.response.data as any;
      return new NeuralIntelligenceError(
        data.error || data.detail || 'API request failed',
        error.response.status,
        data
      );
    } else if (error.request) {
      return new NeuralIntelligenceError(
        'No response from server',
        0,
        { originalError: error.message }
      );
    } else {
      return new NeuralIntelligenceError(
        error.message || 'Unknown error',
        0
      );
    }
  }

  // ============================================
  // Health & Status
  // ============================================

  async getHealth(): Promise<AgentHealth> {
    const response = await this.client.get('/health');
    return response.data;
  }

  async getAgentStatus(): Promise<Record<string, any>> {
    const response = await this.client.get('/api/neural/agents/status');
    return response.data;
  }

  // ============================================
  // Compliance Agent
  // ============================================

  async checkCompliance(
    request: ComplianceCheckRequest
  ): Promise<ComplianceCheckResponse> {
    const response = await this.client.post(
      '/api/neural/compliance/check',
      request
    );
    return response.data;
  }

  async checkTransactionCompliance(
    transactionId: string,
    data: Record<string, any>
  ): Promise<ComplianceCheckResponse> {
    return this.checkCompliance({
      entity_type: 'transaction',
      entity_id: transactionId,
      check_types: ['aml', 'kyc'],
      data,
    });
  }

  async checkMerchantCompliance(
    merchantId: string,
    data: Record<string, any>
  ): Promise<ComplianceCheckResponse> {
    return this.checkCompliance({
      entity_type: 'merchant',
      entity_id: merchantId,
      check_types: ['kyc', 'sanctions'],
      data,
    });
  }

  // ============================================
  // Fraud Agent
  // ============================================

  async analyzeFraud(
    request: FraudAnalysisRequest
  ): Promise<FraudAnalysisResponse> {
    const response = await this.client.post(
      '/api/neural/fraud/analyze',
      request
    );
    return response.data;
  }

  async checkTransactionFraud(
    transactionId: string,
    userId: string,
    amountCommitment: string,
    pattern: Record<string, any> = {}
  ): Promise<FraudAnalysisResponse> {
    return this.analyzeFraud({
      transaction_id: transactionId,
      user_id: userId,
      amount_commitment: amountCommitment,
      transaction_pattern: pattern,
      real_time: true,
    });
  }

  // ============================================
  // Treasury Agent
  // ============================================

  async optimizeTreasury(
    request: TreasuryOptimizationRequest
  ): Promise<TreasuryOptimizationResponse> {
    const response = await this.client.post(
      '/api/neural/treasury/optimize',
      request
    );
    return response.data;
  }

  async getMerchantTreasuryRecommendations(
    merchantId: string,
    currentLiquidity: Record<string, number>,
    upcomingPayments: any[] = [],
    goal: 'cost' | 'speed' | 'balance' = 'balance'
  ): Promise<TreasuryOptimizationResponse> {
    return this.optimizeTreasury({
      merchant_id: merchantId,
      current_liquidity: currentLiquidity,
      upcoming_payments: upcomingPayments,
      time_horizon: '7d',
      optimization_goal: goal,
    });
  }

  // ============================================
  // Growth Agent
  // ============================================

  async getGrowthSuggestions(
    request: GrowthSuggestionRequest
  ): Promise<GrowthSuggestionResponse> {
    const response = await this.client.post(
      '/api/neural/growth/suggest',
      request
    );
    return response.data;
  }

  async getMerchantGrowthAnalysis(
    merchantId: string,
    metrics: Record<string, any>,
    goals: string[] = ['increase_revenue']
  ): Promise<GrowthSuggestionResponse> {
    return this.getGrowthSuggestions({
      merchant_id: merchantId,
      metrics,
      timeframe: '30d',
      goals: goals as any,
    });
  }

  // ============================================
  // Support Agent
  // ============================================

  async submitSupportQuery(
    request: SupportQueryRequest
  ): Promise<SupportQueryResponse> {
    const response = await this.client.post(
      '/api/neural/support/chat',
      request
    );
    return response.data;
  }

  async askSupport(
    userId: string,
    query: string,
    urgency: 'low' | 'normal' | 'high' | 'critical' = 'normal'
  ): Promise<SupportQueryResponse> {
    return this.submitSupportQuery({
      query_id: `query_${Date.now()}`,
      user_id: userId,
      query_text: query,
      urgency,
    });
  }

  // ============================================
  // Batch Operations
  // ============================================

  async broadcastToAgents(
    messageType: string,
    data: Record<string, any>,
    targetAgents?: string[]
  ): Promise<Record<string, any>> {
    const response = await this.client.post('/api/neural/agents/broadcast', {
      message_type: messageType,
      data,
      target_agents: targetAgents,
    });
    return response.data;
  }

  // ============================================
  // Utility Methods
  // ============================================

  async ping(): Promise<boolean> {
    try {
      await this.getHealth();
      return true;
    } catch {
      return false;
    }
  }

  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.client.defaults.headers['X-API-Key'] = apiKey;
  }

  setTimeout(timeout: number): void {
    this.config.timeout = timeout;
    this.client.defaults.timeout = timeout;
  }
}

// Export convenience factory function
export function createClient(
  config: NeuralIntelligenceConfig
): NeuralIntelligenceClient {
  return new NeuralIntelligenceClient(config);
}
