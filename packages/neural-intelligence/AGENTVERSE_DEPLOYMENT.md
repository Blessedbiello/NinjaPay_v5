# Agentverse Deployment Guide

This guide explains how to deploy the Neural Intelligence System agents to Fetch.ai's Agentverse platform.

---

## Prerequisites

1. **Agentverse Account**: Sign up at [agentverse.ai](https://agentverse.ai)
2. **API Key**: Generate an API key from your Agentverse dashboard
3. **Agent Seeds**: Unique seed phrases for each agent (for deterministic addresses)

---

## Agent Addresses

After deployment, your agents will have the following addresses (examples):

```
ComplianceAgent: agent1qwx...abc123
FraudAgent:      agent1qxy...def456
TreasuryAgent:   agent1qxz...ghi789
GrowthAgent:     agent1qya...jkl012
SupportAgent:    agent1qyb...mno345
```

---

## Deployment Steps

### 1. Configure Environment Variables

Create `.env` file:

```bash
# Agentverse Configuration
AGENTVERSE_API_KEY=your_agentverse_api_key_here
AGENT_SEED=your_secret_seed_phrase_here
AGENT_MAILBOX_KEY=your_mailbox_key_here

# Database (read-only access)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
MONGODB_URI=mongodb://...

# NinjaPay Integration
NINJAPAY_API_URL=https://api.ninjapay.xyz
NINJAPAY_API_KEY=your_api_key
NINJAPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 2. Deploy ComplianceAgent

```bash
# From packages/neural-intelligence directory

# Install uagents CLI
pip install uagents

# Deploy to Agentverse
python -m agents.compliance.agent --deploy \
  --name "NinjaPay Compliance Agent" \
  --description "AML/KYC monitoring for confidential payments" \
  --mailbox true

# Note the agent address returned
```

### 3. Deploy FraudAgent

```bash
python -m agents.fraud.agent --deploy \
  --name "NinjaPay Fraud Detection" \
  --description "Real-time fraud detection using MeTTa reasoning" \
  --mailbox true
```

### 4. Deploy TreasuryAgent

```bash
python -m agents.treasury.agent --deploy \
  --name "NinjaPay Treasury Optimizer" \
  --description "Liquidity and routing optimization" \
  --mailbox true
```

### 5. Deploy GrowthAgent

```bash
python -m agents.growth.agent --deploy \
  --name "NinjaPay Growth Analytics" \
  --description "Merchant performance and growth recommendations" \
  --mailbox true
```

### 6. Deploy SupportAgent (with Chat Protocol)

```bash
python -m agents.support.agent --deploy \
  --name "NinjaPay Support Assistant" \
  --description "Customer support with ASI:One Chat Protocol" \
  --mailbox true \
  --chat-protocol true
```

---

## Configure Agent Manifests

Each agent needs a manifest for Agentverse discovery. Create agent manifests on Agentverse dashboard:

### ComplianceAgent Manifest

```json
{
  "name": "NinjaPay Compliance Agent",
  "description": "AML/KYC monitoring for confidential payment transactions",
  "version": "1.0.0",
  "capabilities": [
    "compliance_check",
    "risk_scoring",
    "aml_monitoring",
    "kyc_verification"
  ],
  "tags": ["fintech", "compliance", "aml", "kyc", "privacy"],
  "category": "finance",
  "readme": "See README.md for details"
}
```

### SupportAgent Manifest (Chat Protocol)

```json
{
  "name": "NinjaPay Support Assistant",
  "description": "AI-powered customer support for NinjaPay payments",
  "version": "1.0.0",
  "capabilities": [
    "customer_support",
    "transaction_lookup",
    "faq_responses"
  ],
  "protocols": ["AgentChatProtocol"],
  "chat_enabled": true,
  "tags": ["support", "customer-service", "payments", "asi-one"],
  "category": "support",
  "readme": "See README.md for details"
}
```

---

## Enable ASI:One Chat Protocol

### For SupportAgent

1. Go to Agent Settings on Agentverse
2. Enable "Chat Protocol"
3. Set Chat Protocol Version: `1.0.0`
4. Configure greeting message:

```
👋 Hi! I'm the NinjaPay Support Assistant.

I can help you with:
• Transaction status and history
• Account verification (KYC)
• Payment fees and confirmation times
• Security and privacy features

What would you like to know?
```

5. Test on ASI:One interface: [asi.one](https://asi.one)

---

## Agent Communication Setup

Configure inter-agent communication:

### 1. Create Agent Registry

On Agentverse, register all agents in a registry:

```python
# agents/registry.py
NEURAL_AGENTS = {
    "compliance": "agent1qwx...abc123",
    "fraud": "agent1qxy...def456",
    "treasury": "agent1qxz...ghi789",
    "growth": "agent1qya...jkl012",
    "support": "agent1qyb...mno345"
}
```

### 2. Configure Message Routing

Each agent can send messages to others:

```python
from uagents import Context

@agent.on_interval(period=60.0)
async def check_coordination(ctx: Context):
    # Fraud agent alerts Compliance agent
    await ctx.send(
        NEURAL_AGENTS["compliance"],
        FraudAlertMessage(
            transaction_id="tx_123",
            fraud_probability=0.9,
            reason="unusual_velocity"
        )
    )
```

---

## Monitoring & Logs

### View Agent Logs

On Agentverse dashboard:
1. Select agent
2. Go to "Logs" tab
3. Filter by level (INFO, WARNING, ERROR)

### Monitor Performance

Track metrics:
- Messages processed
- Response times
- Error rates
- Query success rates

---

## Testing Agents

### 1. Test ComplianceAgent

```bash
curl -X POST https://agentverse.ai/v1/agents/{agent_address}/messages \
  -H "Authorization: Bearer $AGENTVERSE_API_KEY" \
  -d '{
    "message_type": "compliance_check",
    "payload": {
      "entity_type": "transaction",
      "entity_id": "tx_123",
      "check_types": ["aml", "kyc"],
      "data": {...}
    }
  }'
```

### 2. Test SupportAgent (Chat)

On [ASI:One](https://asi.one):
1. Search for "NinjaPay Support"
2. Start chat
3. Ask: "What are your payment fees?"
4. Verify response

---

## Adding Innovation Lab Badges

Add badges to your agent README on Agentverse:

```markdown
![tag:innovationlab](https://img.shields.io/badge/innovationlab-3D8BD3)
![tag:hackathon](https://img.shields.io/badge/hackathon-5F43F1)
```

---

## Troubleshooting

### Agent Not Responding

1. Check agent status on Agentverse
2. Verify mailbox connection
3. Review error logs
4. Restart agent if needed

### Chat Protocol Not Working

1. Verify Chat Protocol is enabled
2. Check protocol version matches
3. Test with simple "hello" message
4. Review chat handler logs

### Database Connection Issues

1. Verify DATABASE_URL is accessible from Agentverse
2. Check firewall/security group settings
3. Use connection pooling
4. Monitor connection limits

---

## Production Checklist

Before going live:

- [ ] All 5 agents deployed and verified
- [ ] Agent addresses documented
- [ ] Manifests configured
- [ ] Chat Protocol enabled for SupportAgent
- [ ] Inter-agent communication tested
- [ ] Database connections working
- [ ] Monitoring and logging enabled
- [ ] README added to Agentverse
- [ ] Innovation Lab badges added
- [ ] Agents discoverable on ASI:One
- [ ] Demo video recorded

---

## Support

For deployment issues:
- Fetch.ai Discord: [discord.gg/fetchai](https://discord.gg/fetchai)
- Agentverse Docs: [docs.fetch.ai](https://docs.fetch.ai)
- Innovation Lab: [innovationlab.fetch.ai](https://innovationlab.fetch.ai)

---

**Deployed By**: NinjaPay Team
**Last Updated**: October 26, 2025
