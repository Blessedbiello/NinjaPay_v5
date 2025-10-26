# @ninjapay/neural-intelligence

TypeScript SDK for the Neural Intelligence System - Decentralized AI Agent Network

## Installation

```bash
npm install @ninjapay/neural-intelligence
# or
yarn add @ninjapay/neural-intelligence
# or
pnpm add @ninjapay/neural-intelligence
```

## Quick Start

```typescript
import { createClient } from '@ninjapay/neural-intelligence';

// Create client
const neural = createClient({
  apiUrl: 'http://localhost:8003',
  apiKey: 'your-api-key', // Optional
  timeout: 30000,
});

// Check fraud
const fraudResult = await neural.analyzeFraud({
  transaction_id: 'tx_123',
  user_id: 'user_456',
  amount_commitment: '0xabc...',
  transaction_pattern: {
    new_device: false,
    time_of_day: 14,
  },
});

console.log('Fraud probability:', fraudResult.fraud_probability);
console.log('Action:', fraudResult.action_recommended);
```

## Features

- ✅ **Full TypeScript support** with complete type definitions
- ✅ **5 AI Agents**: Compliance, Fraud, Treasury, Growth, Support
- ✅ **REST API client** for all agent endpoints
- ✅ **WebSocket client** for real-time events
- ✅ **Error handling** with custom error types
- ✅ **Retries** and timeout configuration
- ✅ **Batch operations** for multi-agent coordination

## API Reference

### Compliance Agent

Check transactions and merchants for AML/KYC compliance:

```typescript
// Check transaction compliance
const complianceResult = await neural.checkTransactionCompliance(
  'tx_123',
  {
    sender: '0xabc...',
    recipient: '0xdef...',
    estimated_amount: 5000,
  }
);

if (!complianceResult.passed) {
  console.log('Violations:', complianceResult.violations);
  console.log('Action required:', complianceResult.action);
}

// Check merchant KYC
const merchantCheck = await neural.checkMerchantCompliance(
  'merchant_456',
  {
    business_name: 'Acme Corp',
    kyc_status: 'pending',
  }
);
```

### Fraud Agent

Detect and prevent fraudulent transactions:

```typescript
// Analyze transaction for fraud
const fraudAnalysis = await neural.checkTransactionFraud(
  'tx_789',
  'user_123',
  '0x...',  // amount commitment
  {
    new_device: true,
    new_location: false,
    time_of_day: 3, // 3 AM
  }
);

if (fraudAnalysis.fraud_probability > 0.75) {
  console.log('High fraud risk!');
  console.log('Type:', fraudAnalysis.fraud_type);
  console.log('Factors:', fraudAnalysis.factors);
}
```

### Treasury Agent

Optimize liquidity and payment routing:

```typescript
// Get treasury recommendations
const treasuryOpt = await neural.getMerchantTreasuryRecommendations(
  'merchant_123',
  {
    available: 10000,
    locked: 5000,
  },
  [
    { amount: 100, urgency: 5 },
    { amount: 500, urgency: 8 },
  ],
  'cost' // Optimize for cost
);

console.log('Savings:', treasuryOpt.estimated_savings);
console.log('Route via L2:', treasuryOpt.routing_strategy.l2_count);
console.log('Recommendations:', treasuryOpt.recommendations);
```

### Growth Agent

Get merchant performance insights and growth suggestions:

```typescript
// Get growth analysis
const growthAnalysis = await neural.getMerchantGrowthAnalysis(
  'merchant_456',
  {
    transactions: 150,
    revenue: 25000,
    customers: 80,
    previous_revenue: 20000,
  },
  ['increase_revenue', 'reduce_churn']
);

console.log('Growth rate:', growthAnalysis.performance_analysis.growth_rate_pct);
console.log('Suggestions:', growthAnalysis.suggestions);
console.log('Priority:', growthAnalysis.priority_ranking);
```

### Support Agent

Get AI-powered customer support:

```typescript
// Ask support question
const supportResponse = await neural.askSupport(
  'user_789',
  'What are your transaction fees?',
  'normal'
);

console.log('Answer:', supportResponse.answer);
console.log('Confidence:', supportResponse.confidence);

if (supportResponse.escalate) {
  console.log('Escalating to human support...');
}
```

## WebSocket Client

Real-time event streaming from agents:

```typescript
import { createWebSocketClient } from '@ninjapay/neural-intelligence';

// Create WebSocket client
const ws = createWebSocketClient({
  url: 'ws://localhost:8003/ws/agents',
  clientId: 'merchant_123',
  reconnect: true,
  debug: true,
});

// Connect
await ws.connect();

// Subscribe to specific agents
ws.subscribeToAgents(['fraud', 'compliance']);

// Listen to fraud detection events
ws.on('fraud.detected', (event) => {
  console.log('Fraud alert:', event.data);
});

// Listen to all events
ws.on('*', (event) => {
  console.log('Event:', event.event_type, event.data);
});

// Disconnect when done
ws.disconnect();
```

## Advanced Usage

### Batch Operations

Broadcast message to multiple agents:

```typescript
const results = await neural.broadcastToAgents(
  'analyze_merchant',
  { merchant_id: 'merchant_123' },
  ['fraud', 'compliance', 'growth']
);

console.log('Fraud analysis:', results.fraud);
console.log('Compliance check:', results.compliance);
console.log('Growth suggestions:', results.growth);
```

### Error Handling

```typescript
import { NeuralIntelligenceError } from '@ninjapay/neural-intelligence';

try {
  const result = await neural.analyzeFraud({...});
} catch (error) {
  if (error instanceof NeuralIntelligenceError) {
    console.error('API Error:', error.message);
    console.error('Status:', error.statusCode);
    console.error('Details:', error.details);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Configuration

```typescript
// Create client with custom config
const neural = createClient({
  apiUrl: process.env.NEURAL_API_URL || 'http://localhost:8003',
  apiKey: process.env.NEURAL_API_KEY,
  timeout: 60000, // 60 seconds
  retries: 5,
});

// Update API key later
neural.setApiKey('new-api-key');

// Update timeout
neural.setTimeout(120000); // 2 minutes

// Test connection
const isOnline = await neural.ping();
```

## Integration Examples

### Express.js Middleware

```typescript
import express from 'express';
import { createClient } from '@ninjapay/neural-intelligence';

const app = express();
const neural = createClient({ apiUrl: 'http://localhost:8003' });

// Fraud detection middleware
app.post('/payments', async (req, res, next) => {
  const { transactionId, userId, amountCommitment } = req.body;

  const fraudCheck = await neural.checkTransactionFraud(
    transactionId,
    userId,
    amountCommitment
  );

  if (fraudCheck.action_recommended === 'block') {
    return res.status(403).json({
      error: 'Transaction blocked due to fraud risk',
      details: fraudCheck,
    });
  }

  next();
});
```

### NestJS Service

```typescript
import { Injectable } from '@nestjs/common';
import { createClient, NeuralIntelligenceClient } from '@ninjapay/neural-intelligence';

@Injectable()
export class NeuralService {
  private client: NeuralIntelligenceClient;

  constructor() {
    this.client = createClient({
      apiUrl: process.env.NEURAL_API_URL,
      apiKey: process.env.NEURAL_API_KEY,
    });
  }

  async checkFraud(transactionId: string, userId: string, commitment: string) {
    return this.client.checkTransactionFraud(transactionId, userId, commitment);
  }

  async getGrowthInsights(merchantId: string, metrics: any) {
    return this.client.getMerchantGrowthAnalysis(merchantId, metrics);
  }
}
```

## TypeScript Types

All requests and responses are fully typed:

```typescript
import {
  FraudAnalysisRequest,
  FraudAnalysisResponse,
  ComplianceCheckResponse,
  TreasuryOptimizationRequest,
  // ... all other types
} from '@ninjapay/neural-intelligence';
```

## License

MIT

## Links

- [Documentation](https://github.com/ninjapay/ninjapay/tree/main/packages/neural-intelligence)
- [API Reference](https://github.com/ninjapay/ninjapay/tree/main/packages/neural-intelligence/README.md)
- [Examples](https://github.com/ninjapay/ninjapay/tree/main/packages/neural-intelligence/examples)

## Support

For issues and questions:
- GitHub Issues: https://github.com/ninjapay/ninjapay/issues
- Email: team@ninjapay.xyz
