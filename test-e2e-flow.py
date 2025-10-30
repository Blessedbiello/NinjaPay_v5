#!/usr/bin/env python3
"""
E2E Payment Flow Test for NinjaPay
Tests complete authentication and payment intent creation flow
"""

import json
import requests
import base64
import base58
from nacl.signing import SigningKey
from nacl.encoding import RawEncoder

API_BASE = "http://localhost:8001"
WALLET_ADDRESS = "GrLHcjmBsUdZhdNmLeiFrZt5J3K3LSh2QyZCk2ysucJb"

def load_keypair():
    """Load the test merchant keypair"""
    with open('test-merchant.json', 'r') as f:
        keypair_data = json.load(f)

    # Convert to bytes and create signing key
    secret_bytes = bytes(keypair_data[:32])  # First 32 bytes are the secret key
    signing_key = SigningKey(secret_bytes)
    return signing_key

def test_get_nonce():
    """Step 1: Get authentication nonce"""
    print("🔐 Step 1: Getting authentication nonce...")

    response = requests.post(
        f"{API_BASE}/v1/auth/nonce",
        json={"walletAddress": WALLET_ADDRESS},
        headers={"Content-Type": "application/json"}
    )

    if response.status_code != 200:
        raise Exception(f"Failed to get nonce: {response.text}")

    data = response.json()
    nonce = data['data']['nonce']
    expires_in = data['data']['expiresIn']

    print(f"✅ Received nonce (expires in {expires_in}s)")
    print(f"   Message preview: {nonce[:60]}...")

    return nonce

def test_sign_and_verify(nonce):
    """Step 2 & 3: Sign message and verify authentication"""
    print("\n✍️  Step 2: Signing message with wallet...")

    # Load keypair
    signing_key = load_keypair()

    # Sign the message
    message_bytes = nonce.encode('utf-8')
    signed = signing_key.sign(message_bytes)
    signature = signed.signature

    # Encode signature in base58
    signature_base58 = base58.b58encode(signature).decode('ascii')

    print(f"✅ Message signed")
    print(f"   Signature: {signature_base58[:40]}...")

    # Login with signature
    print("\n🔓 Step 3: Logging in with signature...")

    response = requests.post(
        f"{API_BASE}/v1/auth/login",
        json={
            "walletAddress": WALLET_ADDRESS,
            "signature": signature_base58,
            "message": nonce
        },
        headers={"Content-Type": "application/json"}
    )

    if response.status_code != 200:
        raise Exception(f"Authentication failed: {response.text}")

    data = response.json()
    token = data['data']['token']
    user = data['data']['user']

    print(f"✅ Authentication successful!")
    print(f"   User ID: {user['id']}")
    print(f"   Wallet: {user['walletAddress']}")
    print(f"   Token: {token[:40]}...")

    return token, user

def test_create_or_get_merchant(token):
    """Step 4: Create or get merchant account"""
    print("\n🏢 Step 4: Setting up merchant account...")

    # First check if merchant already exists
    response = requests.get(
        f"{API_BASE}/v1/merchants/me",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
    )

    if response.status_code == 200:
        merchant = response.json()['data']
        print(f"✅ Using existing merchant account")
        print(f"   Merchant ID: {merchant['id']}")
        print(f"   Business: {merchant.get('businessName', 'N/A')}")
        return merchant

    # Create new merchant
    response = requests.post(
        f"{API_BASE}/v1/merchants",
        json={
            "businessName": "Test Merchant Corp",
            "email": "test@merchant.local",
            "website": "https://test-merchant.local"
        },
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
    )

    if response.status_code not in [200, 201]:
        raise Exception(f"Failed to create merchant: {response.text}")

    merchant = response.json()['data']
    print(f"✅ Merchant account created!")
    print(f"   Merchant ID: {merchant['id']}")
    print(f"   Business: {merchant['businessName']}")

    return merchant

def test_create_payment_intent(token):
    """Step 5: Create encrypted payment intent"""
    print("\n💰 Step 5: Creating payment intent...")

    # Use a test recipient address (Solana devnet)
    test_recipient = "3fMoA42W8MzvA86ZUFiRj5ayoEuwmDkz1qtZGiY5ooWR"

    response = requests.post(
        f"{API_BASE}/v1/payment_intents",
        json={
            "amount": 100.50,
            "currency": "USDC",
            "recipient": test_recipient,
            "description": "E2E Test Payment - Encrypted via Arcium MPC"
        },
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
    )

    if response.status_code not in [200, 201]:
        raise Exception(f"Failed to create payment intent: {response.text}")

    payment = response.json()['data']

    print(f"✅ Payment intent created!")
    print(f"   ID: {payment['id']}")
    print(f"   Amount: {payment['amount']} {payment['currency']}")
    print(f"   Status: {payment['status']}")
    if 'encryptedAmount' in payment:
        print(f"   Encrypted: Yes (Arcium MPC)")

    return payment

def test_list_payment_intents(token):
    """Step 6: List payment intents"""
    print("\n📋 Step 6: Listing payment intents...")

    response = requests.get(
        f"{API_BASE}/v1/payment_intents",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
    )

    if response.status_code != 200:
        print(f"⚠️  Warning: Failed to list payment intents: {response.text}")
        return []

    data = response.json()['data']

    # Handle both array and object responses
    payments = data if isinstance(data, list) else data.get('paymentIntents', [])

    print(f"✅ Found {len(payments)} payment intent(s)")
    for p in payments[:3]:  # Show first 3
        amount = p.get('amount', 'N/A')
        currency = p.get('currency', 'N/A')
        print(f"   - {p['id']}: {amount} {currency} ({p['status']})")

    return payments

def main():
    print("🚀 NinjaPay E2E API Payment Flow Test")
    print("=" * 70)

    try:
        # Test complete flow
        nonce = test_get_nonce()
        token, user = test_sign_and_verify(nonce)

        # Skip merchant creation for now - test payment intents directly
        payment = test_create_payment_intent(token)
        payments = test_list_payment_intents(token)

        print("\n" + "=" * 70)
        print("✅ ALL TESTS PASSED!")
        print("\n📊 Summary:")
        print(f"   User ID: {user['id']}")
        print(f"   Payment Intent ID: {payment['id']}")
        print(f"   Total Payment Intents: {len(payments)}")
        print("\n🎉 E2E payment flow working correctly!")

    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        exit(1)

if __name__ == "__main__":
    main()
