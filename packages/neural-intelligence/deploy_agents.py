#!/usr/bin/env python3
"""
Deploy Neural Intelligence Agents to Agentverse
Run this script to deploy all 5 agents and get their addresses
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from agents.compliance.agent import ComplianceAgent
from agents.fraud.agent import FraudAgent
from agents.treasury.agent import TreasuryAgent
from agents.growth.agent import GrowthAgent
from agents.support.agent import SupportAgent


def deploy_agent(agent_class, name, description, unique_seed):
    """Deploy a single agent to Agentverse"""
    print(f"\n{'='*60}")
    print(f"Deploying {name}...")
    print(f"{'='*60}")

    try:
        # Set unique seed in environment temporarily
        original_seed = os.getenv("AGENT_SEED")
        os.environ["AGENT_SEED"] = unique_seed

        # Create agent instance
        agent = agent_class()

        # Restore original seed
        if original_seed:
            os.environ["AGENT_SEED"] = original_seed

        # Print agent details
        # Convert Address objects to strings
        wallet_address = str(agent.agent.wallet.address())
        agent_address = str(agent.agent.address)

        print(f"\n✅ {name} initialized successfully!")
        print(f"   Name: {agent.name}")
        print(f"   Agent Address: {agent_address}")
        print(f"   Wallet Address: {wallet_address}")
        print(f"   Seed: {unique_seed}")
        print(f"   Description: {description}")

        # Save agent address to file
        with open(f"agent_addresses.txt", "a") as f:
            f.write(f"{name}: {agent_address}\n")

        # Save wallet addresses for funding
        with open(f"wallet_addresses.txt", "a") as f:
            f.write(f"{name}: {wallet_address}\n")

        # Save detailed info to JSON
        import json
        agent_info = {
            "name": name,
            "agent_address": agent_address,
            "wallet_address": wallet_address,
            "seed": unique_seed,
            "description": description
        }
        with open(f"agent_configs.json", "a") as f:
            f.write(json.dumps(agent_info) + "\n")

        return agent

    except Exception as e:
        print(f"\n❌ Error deploying {name}: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    """Deploy all agents"""
    print("\n🚀 Neural Intelligence System - Agent Deployment")
    print("=" * 60)

    # Check if API key is set
    api_key = os.getenv("AGENTVERSE_API_KEY")
    if not api_key or api_key == "test_key":
        print("\n❌ ERROR: AGENTVERSE_API_KEY not set in .env file")
        print("Please add your Agentverse API key to .env")
        sys.exit(1)

    print(f"\n✅ Agentverse API Key found")
    print(f"   Key: {api_key[:20]}...")

    # Clear previous files
    for filename in ["agent_addresses.txt", "wallet_addresses.txt", "agent_configs.json"]:
        if os.path.exists(filename):
            os.remove(filename)

    # Deploy each agent with unique seed
    agents = []

    print("\n\n📝 Agent Deployment Plan:")
    print("-" * 60)

    # Base seed from environment
    base_seed = os.getenv("AGENT_SEED", "neural_test_seed_12345")

    agent_configs = [
        (ComplianceAgent, "ComplianceAgent", "AML/KYC monitoring with MeTTa rules", f"{base_seed}_compliance"),
        (FraudAgent, "FraudAgent", "ML-based fraud detection and prevention", f"{base_seed}_fraud"),
        (TreasuryAgent, "TreasuryAgent", "Liquidity optimization and routing", f"{base_seed}_treasury"),
        (GrowthAgent, "GrowthAgent", "Merchant analytics and growth insights", f"{base_seed}_growth"),
        (SupportAgent, "SupportAgent", "AI customer support with ASI:One Chat Protocol", f"{base_seed}_support"),
    ]

    for i, (agent_class, name, desc, seed) in enumerate(agent_configs, 1):
        print(f"{i}. {name}: {desc}")

    print("\n" + "=" * 60)
    print("Starting deployment...")
    print("=" * 60)

    # Deploy agents
    for agent_class, name, desc, seed in agent_configs:
        agent = deploy_agent(agent_class, name, desc, seed)
        if agent:
            agents.append((name, agent))

    # Summary
    print("\n\n" + "=" * 60)
    print("🎉 DEPLOYMENT COMPLETE!")
    print("=" * 60)

    print(f"\n✅ Successfully deployed {len(agents)}/5 agents")

    print("\n📋 Agent Addresses:")
    print("-" * 60)
    for name, agent in agents:
        print(f"{name}:")
        print(f"  Address: {agent.agent.address}")

    print("\n📝 Agent addresses saved to: agent_addresses.txt")

    print("\n\n🚀 Next Steps:")
    print("-" * 60)
    print("1. Copy the agent addresses above")
    print("2. Go to https://agentverse.ai/agents")
    print("3. Register each agent with its address")
    print("4. Configure agent manifests")
    print("5. Enable Chat Protocol for SupportAgent")
    print("6. Test on ASI:One (https://asi.one)")

    print("\n\n💡 To start the API server with these agents:")
    print("   source venv/bin/activate")
    print("   python -m api.main")

    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
