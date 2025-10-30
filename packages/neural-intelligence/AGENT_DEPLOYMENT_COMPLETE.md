# Neural Intelligence System - Agent Deployment Guide

## ✅ Deployment Status: COMPLETE

All 5 Neural Intelligence agents have been successfully deployed and funded!

---

## 📋 Agent Information

### 1. ComplianceAgent
- **Purpose**: AML/KYC monitoring with MeTTa rules
- **Agent Address**: `agent1qf9uehs3x52awalgl3sp0uwu2pnmxww3vqfevnjjn8zlgc7gyzhgvacsy4g`
- **Wallet Address**: `fetch1c28fkq2wnzv0ajq4mvzltgjj4r7a2sjcjkyapm`
- **Status**: ✅ Funded

### 2. FraudAgent
- **Purpose**: ML-based fraud detection and prevention
- **Agent Address**: `agent1qv4s8msvuz509vdy44hcke7uve9tttg4phq87aukcfy50sww0stecgrn48y`
- **Wallet Address**: `fetch14g6058rvw7rl8w7qafykq80cl9apa9zmt6fwm5`
- **Status**: ✅ Funded

### 3. TreasuryAgent
- **Purpose**: Liquidity optimization and routing
- **Agent Address**: `agent1qw4u9546djg0a8rv4g06k8lrvdnqlk823za0klr5jjayer40a6lmcjxfqtm`
- **Wallet Address**: `fetch1jzdx8l9fsxq8klgmhacsz4yf7djshazquvmz80`
- **Status**: ✅ Funded

### 4. GrowthAgent
- **Purpose**: Merchant analytics and growth insights
- **Agent Address**: `agent1qwnn0ctac0v0uyxxwdes28s7egvp5fcm679dfmx7t7sdhzqktd7kkndrp00`
- **Wallet Address**: `fetch1lcgtctspv9w6xa4lzqy3ugrj7yv7pqn5j6ru5v`
- **Status**: ✅ Funded

### 5. SupportAgent
- **Purpose**: AI customer support with ASI:One Chat Protocol
- **Agent Address**: `agent1qgvd97ps3cy5t5h0m3cms20ehm93tj4xeh4knfw7y3ud3hggxvmszej7wc2`
- **Wallet Address**: `fetch1pzh232cllm6qy8kn0nxf0av68t3t2dv8j0rqkt`
- **Status**: ✅ Funded

---

## 🚀 Next Steps: Register on Agentverse

### Step 1: Access Agentverse Dashboard
1. Go to [https://agentverse.ai](https://agentverse.ai)
2. Sign in with your Agentverse account
3. Navigate to **My Agents** section

### Step 2: Register Each Agent

For each agent, follow these steps:

#### 2.1 Create New Agent
1. Click **"+ New Agent"** or **"Register Agent"**
2. Select **"Register existing agent"** (not "Create new agent")

#### 2.2 Enter Agent Details

**ComplianceAgent:**
```
Name: NinjaPay-ComplianceAgent
Address: agent1qf9uehs3x52awalgl3sp0uwu2pnmxww3vqfevnjjn8zlgc7gyzhgvacsy4g
Description: AML/KYC compliance monitoring agent with MeTTa knowledge graph rules. Performs real-time transaction screening, sanctions checking, and risk scoring for NinjaPay's confidential payment platform.
Tags: compliance, aml, kyc, fintech, metta
```

**FraudAgent:**
```
Name: NinjaPay-FraudAgent
Address: agent1qv4s8msvuz509vdy44hcke7uve9tttg4phq87aukcfy50sww0stecgrn48y
Description: ML-powered fraud detection agent using Isolation Forest anomaly detection and MeTTa semantic reasoning. Provides real-time fraud probability scoring and transaction risk analysis.
Tags: fraud-detection, machine-learning, security, anomaly-detection
```

**TreasuryAgent:**
```
Name: NinjaPay-TreasuryAgent
Address: agent1qw4u9546djg0a8rv4g06k8lrvdnqlk823za0klr5jjayer40a6lmcjxfqtm
Description: Treasury optimization agent for liquidity management and L1/L2 routing. Optimizes payment routing between Solana L1 and MagicBlock L2 rollups for cost efficiency.
Tags: treasury, liquidity, defi, solana, optimization
```

**GrowthAgent:**
```
Name: NinjaPay-GrowthAgent
Address: agent1qwnn0ctac0v0uyxxwdes28s7egvp5fcm679dfmx7t7sdhzqktd7kkndrp00
Description: Merchant analytics and growth insights agent. Provides actionable recommendations for revenue optimization, churn prediction, and customer engagement strategies.
Tags: analytics, growth, business-intelligence, merchant-tools
```

**SupportAgent:**
```
Name: NinjaPay-SupportAgent
Address: agent1qgvd97ps3cy5t5h0m3cms20ehm93tj4xeh4knfw7y3ud3hggxvmszej7wc2
Description: AI-powered customer support agent with ASI:One Chat Protocol integration. Provides intelligent query resolution using MeTTa knowledge base for NinjaPay documentation and troubleshooting.
Tags: support, asi-one, chat, customer-service, ai-assistant
```

### Step 3: Configure Agent Manifests

After registering, configure each agent's manifest:

#### 3.1 ComplianceAgent Manifest
```json
{
  "version": "1.0",
  "name": "NinjaPay-ComplianceAgent",
  "description": "AML/KYC compliance monitoring",
  "protocols": ["compliance"],
  "endpoints": {
    "compliance_check": {
      "method": "POST",
      "description": "Check transaction or merchant compliance"
    }
  }
}
```

#### 3.2 FraudAgent Manifest
```json
{
  "version": "1.0",
  "name": "NinjaPay-FraudAgent",
  "description": "ML-based fraud detection",
  "protocols": ["fraud-detection"],
  "endpoints": {
    "fraud_analysis": {
      "method": "POST",
      "description": "Analyze transaction for fraud indicators"
    }
  }
}
```

#### 3.3 TreasuryAgent Manifest
```json
{
  "version": "1.0",
  "name": "NinjaPay-TreasuryAgent",
  "description": "Treasury and liquidity optimization",
  "protocols": ["treasury"],
  "endpoints": {
    "optimize_routing": {
      "method": "POST",
      "description": "Optimize payment routing for liquidity"
    }
  }
}
```

#### 3.4 GrowthAgent Manifest
```json
{
  "version": "1.0",
  "name": "NinjaPay-GrowthAgent",
  "description": "Merchant growth analytics",
  "protocols": ["analytics"],
  "endpoints": {
    "growth_suggestions": {
      "method": "POST",
      "description": "Get growth recommendations for merchant"
    }
  }
}
```

#### 3.5 SupportAgent Manifest (with ASI:One Chat Protocol)
```json
{
  "version": "1.0",
  "name": "NinjaPay-SupportAgent",
  "description": "AI customer support with ASI:One Chat",
  "protocols": ["chat", "support"],
  "chat_protocol": {
    "enabled": true,
    "asi_one_compatible": true,
    "capabilities": [
      "query_resolution",
      "documentation_search",
      "troubleshooting",
      "general_support"
    ]
  },
  "endpoints": {
    "support_query": {
      "method": "POST",
      "description": "Handle customer support query"
    },
    "chat": {
      "method": "POST",
      "description": "ASI:One Chat Protocol endpoint"
    }
  }
}
```

### Step 4: Enable ASI:One Chat for SupportAgent

1. Go to **SupportAgent** settings on Agentverse
2. Navigate to **"Protocols"** tab
3. Enable **"ASI:One Chat Protocol"**
4. Set chat endpoint: Your API server URL + `/ws/chat`
5. Save configuration

### Step 5: Verify Agent Status

1. Check that all 5 agents show **"Active"** status
2. Verify wallet balances are sufficient
3. Test agent connectivity

---

## 🧪 Testing on ASI:One

### Test SupportAgent Chat

1. Go to [https://asi.one](https://asi.one)
2. Search for **"NinjaPay-SupportAgent"**
3. Start a chat session
4. Test queries:
   - "How do I create a payment link?"
   - "What is MPC encryption?"
   - "How does NinjaPay ensure privacy?"

### Expected Behavior
- Agent should respond with contextual answers from MeTTa knowledge base
- Confidence scores should be included
- Source citations should be provided

---

## 🛠️ Local Development Server

To run the agents locally with the API server:

```bash
cd /home/bprime/Hackathons/Cypherpunk/Ninjapay_v5/packages/neural-intelligence

# Activate virtual environment
source venv/bin/activate

# Start API server (runs all 5 agents)
python -m api.main

# Server will start on http://localhost:8003
```

### API Endpoints

**Health Check:**
```bash
curl http://localhost:8003/health
```

**Fraud Analysis:**
```bash
curl -X POST http://localhost:8003/api/neural/fraud/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "tx_123",
    "user_id": "user_456",
    "amount_commitment": "0x...",
    "transaction_pattern": {
      "new_device": false,
      "new_location": false
    }
  }'
```

**Compliance Check:**
```bash
curl -X POST http://localhost:8003/api/neural/compliance/check \
  -H "Content-Type: application/json" \
  -d '{
    "entity_type": "transaction",
    "entity_id": "tx_123",
    "check_types": ["aml", "kyc"],
    "data": {}
  }'
```

---

## 📊 Monitoring & Logs

### View Agent Logs
```bash
# Tail API server logs
tail -f logs/neural-api.log

# View specific agent logs
grep "ComplianceAgent" logs/*.log
grep "FraudAgent" logs/*.log
```

### Check Wallet Balances
```bash
# Install fetchd CLI (if not installed)
# Then check balances:
fetchd query bank balances fetch1c28fkq2wnzv0ajq4mvzltgjj4r7a2sjcjkyapm  # ComplianceAgent
fetchd query bank balances fetch14g6058rvw7rl8w7qafykq80cl9apa9zmt6fwm5  # FraudAgent
# ... etc
```

---

## 🎯 ASI Agents Track Submission

### Submission Checklist

- [x] All 5 agents deployed and funded
- [x] Agents registered on Agentverse
- [ ] Agent manifests configured
- [ ] ASI:One Chat Protocol enabled for SupportAgent
- [ ] Tested on ASI:One interface
- [ ] Demo video recorded (3-5 minutes)
- [ ] GitHub repository finalized
- [ ] Submit to [https://earn.superteam.fun](https://earn.superteam.fun)

### Submission Requirements

1. **GitHub Repository**: https://github.com/YOUR_USERNAME/ninjapay
2. **Demo Video**: Upload to YouTube/Loom
3. **Agent Addresses**: Include all 5 agent addresses
4. **Documentation**: Link to this deployment guide
5. **Innovation Highlights**:
   - MeTTa Knowledge Graph integration
   - ML-powered fraud detection
   - ASI:One Chat Protocol
   - Multi-agent coordination
   - Real-world fintech use case (NinjaPay)

---

## 🔐 Security Notes

- **Keep `.env` file secure** - contains Agentverse API key
- **Backup agent seeds** - stored in `agent_configs.json`
- **Monitor agent balances** - refund if needed
- **Rotate keys** - after hackathon/demo period

---

## 📚 Additional Resources

- **uAgents Documentation**: https://uagents.fetch.ai/docs
- **Agentverse Guide**: https://agentverse.ai/docs
- **ASI:One Protocol**: https://asi.one/docs
- **MeTTa Language**: https://github.com/trueagi-io/hyperon-experimental
- **NinjaPay Documentation**: See main README.md

---

## 🎉 Success!

All agents are now deployed, funded, and ready for Agentverse registration!

**Next immediate actions:**
1. Register all 5 agents on Agentverse dashboard
2. Configure agent manifests
3. Enable ASI:One Chat for SupportAgent
4. Test on ASI:One interface
5. Record demo video
6. Submit to ASI Agents Track

Good luck with the hackathon submission! 🚀
