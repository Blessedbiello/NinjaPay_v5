/**
 * Neural Intelligence System - Usage Examples
 * Comprehensive examples for all agents
 */

import { createClient, createWebSocketClient } from './index';

// ============================================
// Setup
// ============================================

const neural = createClient({
  apiUrl: 'http://localhost:8003',
  apiKey: process.env.NEURAL_API_KEY,
  timeout: 30000,
});

// ============================================
// Example 1: Fraud Detection
// ============================================

async function example1_FraudDetection() {
  console.log('=== Example 1: Fraud Detection ===\n');

  // Analyze a transaction for fraud
  const fraudResult = await neural.analyzeFraud({
    transaction_id: 'tx_example_001',
    user_id: 'user_12345',
    amount_commitment: '0xabc123...',
    transaction_pattern: {
      new_device: true,
      new_location: false,
      time_of_day: 3, // 3 AM - unusual time
    },
    real_time: true,
  });

  console.log('Fraud Probability:', fraudResult.fraud_probability);
  console.log('Fraud Type:', fraudResult.fraud_type);
  console.log('Action:', fraudResult.action_recommended);
  console.log('Confidence:', fraudResult.confidence);
  console.log('Factors:', fraudResult.factors);

  if (fraudResult.action_recommended === 'block') {
    console.log('\n⚠️  Transaction should be BLOCKED');
  } else if (fraudResult.action_recommended === 'challenge') {
    console.log('\n🔐 Require additional verification (MFA)');
  }

  console.log('\n');
}

// ============================================
// Example 2: Compliance Check
// ============================================

async function example2_ComplianceCheck() {
  console.log('=== Example 2: Compliance Check ===\n');

  // Check transaction compliance
  const complianceResult = await neural.checkCompliance({
    entity_type: 'transaction',
    entity_id: 'tx_example_002',
    check_types: ['aml', 'kyc', 'sanctions'],
    data: {
      sender: '0xabc...',
      recipient: '0xdef...',
      estimated_amount: 15000, // $15,000
      sender_kyc_status: 'verified',
      sender_country: 'US',
    },
    priority: 8,
  });

  console.log('Passed:', complianceResult.passed);
  console.log('Risk Score:', complianceResult.risk_score);
  console.log('Risk Level:', complianceResult.risk_level);
  console.log('Action Required:', complianceResult.action);

  if (complianceResult.violations.length > 0) {
    console.log('\nViolations:');
    complianceResult.violations.forEach((v) => {
      console.log(`  - [${v.severity}] ${v.type}: ${v.description}`);
    });
  }

  if (complianceResult.recommendations.length > 0) {
    console.log('\nRecommendations:');
    complianceResult.recommendations.forEach((r) => console.log(`  - ${r}`));
  }

  console.log('\n');
}

// ============================================
// Example 3: Treasury Optimization
// ============================================

async function example3_TreasuryOptimization() {
  console.log('=== Example 3: Treasury Optimization ===\n');

  // Get treasury recommendations
  const treasuryResult = await neural.optimizeTreasury({
    merchant_id: 'merchant_789',
    current_liquidity: {
      available: 50000,
      locked: 10000,
      pending: 5000,
    },
    upcoming_payments: [
      { amount: 100, urgency: 3 },
      { amount: 500, urgency: 9 }, // Urgent
      { amount: 250, urgency: 5 },
      { amount: 1000, urgency: 2 },
    ],
    time_horizon: '7d',
    optimization_goal: 'cost', // Minimize costs
  });

  console.log('Liquidity Status:', treasuryResult.liquidity_health.status);
  console.log('Liquidity Ratio:', treasuryResult.liquidity_health.liquidity_ratio);
  console.log('Is Healthy:', treasuryResult.liquidity_health.is_healthy);

  console.log('\nRouting Strategy:');
  console.log('  - L1 (Solana):', treasuryResult.routing_strategy.l1_count, 'payments');
  console.log('  - L2 (MagicBlock):', treasuryResult.routing_strategy.l2_count, 'payments');
  console.log('  - Estimated Savings: $', treasuryResult.estimated_savings);

  console.log('\nRecommendations:');
  treasuryResult.recommendations.forEach((r) => {
    console.log(`  - [${r.priority}] ${r.action}: ${r.description}`);
  });

  console.log('\n');
}

// ============================================
// Example 4: Growth Analytics
// ============================================

async function example4_GrowthAnalytics() {
  console.log('=== Example 4: Growth Analytics ===\n');

  // Get growth suggestions
  const growthResult = await neural.getGrowthSuggestions({
    merchant_id: 'merchant_456',
    metrics: {
      transactions: 350,
      revenue: 45000,
      customers: 120,
      previous_revenue: 38000,
      days_since_last_transaction: 2,
    },
    timeframe: '30d',
    goals: ['increase_revenue', 'reduce_churn'],
  });

  console.log('Performance Analysis:');
  console.log('  - Transactions:', growthResult.performance_analysis.transactions_count);
  console.log('  - Revenue: $', growthResult.performance_analysis.total_revenue);
  console.log('  - Growth Rate:', growthResult.performance_analysis.growth_rate_pct, '%');
  console.log('  - Churn Risk:', growthResult.performance_analysis.churn_risk);
  console.log('  - Healthy Growth:', growthResult.performance_analysis.is_healthy_growth);

  console.log('\nTop Suggestions:');
  growthResult.priority_ranking.slice(0, 3).forEach((type) => {
    const suggestion = growthResult.suggestions.find((s) => s.type === type);
    if (suggestion) {
      console.log(`  - ${suggestion.title}`);
      console.log(`    ${suggestion.description}`);
      console.log(`    Expected Impact: ${suggestion.expected_impact}`);
      console.log(
        `    Difficulty: ${growthResult.implementation_difficulty[type]}`
      );
    }
  });

  console.log('\n');
}

// ============================================
// Example 5: Customer Support
// ============================================

async function example5_CustomerSupport() {
  console.log('=== Example 5: Customer Support ===\n');

  // Ask support question
  const supportResult = await neural.submitSupportQuery({
    query_id: 'query_12345',
    user_id: 'user_98765',
    query_text: 'What are your transaction fees and how long does confirmation take?',
    query_type: 'general',
    urgency: 'normal',
  });

  console.log('Answer:', supportResult.answer);
  console.log('Confidence:', supportResult.confidence);
  console.log('Sources:', supportResult.sources);
  console.log('Escalate to Human:', supportResult.escalate);

  if (supportResult.suggested_actions.length > 0) {
    console.log('\nSuggested Actions:');
    supportResult.suggested_actions.forEach((action) =>
      console.log(`  - ${action}`)
    );
  }

  console.log('\n');
}

// ============================================
// Example 6: Real-time Events (WebSocket)
// ============================================

async function example6_RealtimeEvents() {
  console.log('=== Example 6: Real-time Events ===\n');

  // Create WebSocket client
  const ws = createWebSocketClient({
    url: 'ws://localhost:8003/ws/agents',
    clientId: 'merchant_123',
    reconnect: true,
    debug: true,
  });

  // Connect
  await ws.connect();
  console.log('Connected to WebSocket\n');

  // Subscribe to fraud and compliance agents
  ws.subscribeToAgents(['fraud', 'compliance']);

  // Listen for fraud detection events
  ws.on('fraud.detected', (event) => {
    console.log('🚨 FRAUD ALERT:', event.data);
  });

  // Listen for compliance alerts
  ws.on('compliance.high_risk', (event) => {
    console.log('⚠️  COMPLIANCE ALERT:', event.data);
  });

  // Listen to all events
  ws.on('*', (event) => {
    console.log('Event:', event.event_type, '-', event.data);
  });

  // Keep connection alive for 30 seconds
  console.log('Listening for events for 30 seconds...\n');
  await new Promise((resolve) => setTimeout(resolve, 30000));

  // Disconnect
  ws.disconnect();
  console.log('Disconnected from WebSocket\n');
}

// ============================================
// Example 7: Batch Operations
// ============================================

async function example7_BatchOperations() {
  console.log('=== Example 7: Batch Operations ===\n');

  // Broadcast to multiple agents
  const results = await neural.broadcastToAgents(
    'analyze_merchant',
    {
      merchant_id: 'merchant_999',
      transaction_id: 'tx_999',
    },
    ['fraud', 'compliance', 'growth']
  );

  console.log('Batch Results:');
  console.log('  - Fraud:', results.results.fraud?.success ? '✓' : '✗');
  console.log('  - Compliance:', results.results.compliance?.success ? '✓' : '✗');
  console.log('  - Growth:', results.results.growth?.success ? '✓' : '✗');

  console.log('\n');
}

// ============================================
// Example 8: Error Handling
// ============================================

async function example8_ErrorHandling() {
  console.log('=== Example 8: Error Handling ===\n');

  try {
    // This will fail - invalid transaction ID
    await neural.checkTransactionFraud('invalid_tx', 'user_123', '0x...');
  } catch (error: any) {
    console.log('Error caught:', error.message);
    console.log('Status Code:', error.statusCode);
    console.log('Details:', error.details);
  }

  console.log('\n');
}

// ============================================
// Run All Examples
// ============================================

async function runAllExamples() {
  try {
    // Test connection
    const isOnline = await neural.ping();
    if (!isOnline) {
      console.error('❌ Neural Intelligence System is offline');
      return;
    }

    console.log('✅ Connected to Neural Intelligence System\n');
    console.log('='.repeat(60));
    console.log('\n');

    // Run examples
    await example1_FraudDetection();
    await example2_ComplianceCheck();
    await example3_TreasuryOptimization();
    await example4_GrowthAnalytics();
    await example5_CustomerSupport();
    // await example6_RealtimeEvents(); // Uncomment to test WebSocket
    await example7_BatchOperations();
    await example8_ErrorHandling();

    console.log('='.repeat(60));
    console.log('\n✅ All examples completed successfully!\n');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export examples
export {
  example1_FraudDetection,
  example2_ComplianceCheck,
  example3_TreasuryOptimization,
  example4_GrowthAnalytics,
  example5_CustomerSupport,
  example6_RealtimeEvents,
  example7_BatchOperations,
  example8_ErrorHandling,
  runAllExamples,
};

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}
