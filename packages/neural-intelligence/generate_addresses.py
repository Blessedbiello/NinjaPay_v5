#!/usr/bin/env python3
"""
Generate Agent Addresses without running full deployment
"""

import os
import sys
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import uagents to generate addresses
from uagents import Agent

def generate_agent_address(name: str, seed: str):
    """Generate an agent address from a seed"""
    try:
        # Create temporary agent just to get address
        agent = Agent(name=name, seed=seed)
        return agent.address
    except Exception as e:
        print(f"Error generating address for {name}: {e}")
        return None

def main():
    """Generate all agent addresses"""
    print("\n🔑 Neural Intelligence System - Address Generation")
    print("=" * 60)

    # Base seed from environment
    base_seed = os.getenv("AGENT_SEED", "neural_test_seed_12345")

    agent_configs = [
        ("ComplianceAgent", "AML/KYC monitoring with MeTTa rules", f"{base_seed}_compliance"),
        ("FraudAgent", "ML-based fraud detection and prevention", f"{base_seed}_fraud"),
        ("TreasuryAgent", "Liquidity optimization and routing", f"{base_seed}_treasury"),
        ("GrowthAgent", "Merchant analytics and growth insights", f"{base_seed}_growth"),
        ("SupportAgent", "AI customer support with ASI:One Chat Protocol", f"{base_seed}_support"),
    ]

    # Clear previous files
    if os.path.exists("agent_addresses.txt"):
        os.remove("agent_addresses.txt")
    if os.path.exists("agent_configs.json"):
        os.remove("agent_configs.json")

    print("\n📝 Generating addresses for 5 agents...")
    print("-" * 60)

    agents = []
    for i, (name, desc, seed) in enumerate(agent_configs, 1):
        print(f"\n{i}. {name}")
        address = generate_agent_address(name, seed)

        if address:
            print(f"   ✅ Address: {address}")

            # Save to files
            with open("agent_addresses.txt", "a") as f:
                f.write(f"{name}: {address}\n")

            agent_info = {
                "name": name,
                "address": address,
                "seed": seed,
                "description": desc
            }
            with open("agent_configs.json", "a") as f:
                f.write(json.dumps(agent_info) + "\n")

            agents.append((name, address, desc))
        else:
            print(f"   ❌ Failed to generate address")

    # Summary
    print("\n\n" + "=" * 60)
    print("🎉 ADDRESS GENERATION COMPLETE!")
    print("=" * 60)

    print(f"\n✅ Successfully generated {len(agents)}/5 addresses")

    print("\n📋 Agent Addresses:")
    print("-" * 60)
    for name, address, desc in agents:
        print(f"\n{name}:")
        print(f"  Address: {address}")
        print(f"  Description: {desc}")

    print("\n\n📝 Files created:")
    print("  • agent_addresses.txt - Simple list of addresses")
    print("  • agent_configs.json - Complete configuration with seeds")

    print("\n\n🚀 Next Steps - Register on Agentverse:")
    print("-" * 60)
    print("1. Go to https://agentverse.ai")
    print("2. Sign in with your Agentverse account")
    print("3. Click 'Register New Agent'")
    print("4. For each agent:")
    print("   - Enter the agent name")
    print("   - Enter the agent address")
    print("   - Add description")
    print("   - Configure manifest (see AGENTVERSE_DEPLOYMENT.md)")
    print("5. For SupportAgent:")
    print("   - Enable ASI:One Chat Protocol")
    print("   - Configure chat endpoints")
    print("6. Test on ASI:One (https://asi.one)")

    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
