#!/bin/bash
# Fund all agent wallet addresses with testnet tokens

echo "🪙 Funding Agent Wallets with Testnet Tokens"
echo "=============================================="

if [ ! -f "wallet_addresses.txt" ]; then
    echo "❌ Error: wallet_addresses.txt not found"
    echo "Run deploy_agents.py first to generate wallet addresses"
    exit 1
fi

# Read wallet addresses from file
while IFS=: read -r name address; do
    # Trim whitespace
    address=$(echo "$address" | xargs)
    name=$(echo "$name" | xargs)

    echo -e "\n💰 Funding $name..."
    echo "   Wallet Address: $address"

    # Request testnet funds from Dorado faucet
    response=$(curl -s -X POST \
        -H 'Content-Type: application/json' \
        -d "{\"address\":\"$address\"}" \
        https://faucet-dorado.fetch.ai/api/v3/claims)

    status=$(echo "$response" | jq -r '.status' 2>/dev/null)

    if [ "$status" = "ok" ]; then
        uuid=$(echo "$response" | jq -r '.uuid')
        echo "   ✅ Success! UUID: $uuid"
    else
        error=$(echo "$response" | jq -r '.detail // .message // "Unknown error"' 2>/dev/null)
        echo "   ⚠️  Status: $status"
        if [ "$error" != "Unknown error" ] && [ "$error" != "null" ]; then
            echo "   ⚠️  Error: $error"
        fi
        echo "   Full response: $response"
    fi

    # Wait a bit between requests to avoid rate limiting
    sleep 3

done < wallet_addresses.txt

echo -e "\n\n✅ Funding complete!"
echo "Note: It may take a few moments for funds to appear in wallets"
echo ""
echo "To check wallet balances:"
echo "  fetchd query bank balances <wallet_address>"
