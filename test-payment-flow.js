#!/usr/bin/env node

/**
 * E2E Payment Flow Test
 * Tests the complete payment workflow from authentication to payment intent creation
 */

const fs = require('fs');
const path = require('path');
const nacl = require('tweetnacl');
const bs58 = require('bs58');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8001';
const WALLET_ADDRESS = 'GrLHcjmBsUdZhdNmLeiFrZt5J3K3LSh2QyZCk2ysucJb';
const RECIPIENT_ADDRESS =
  process.env.TEST_RECIPIENT_WALLET || '9f4LBRdMWcT5HpsEQSVX9K1TxU4kBxCneLEJV9e7uqoT';

// Load keypair
const keypairPath = path.resolve(__dirname, 'test-merchant.json');
const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
const keypair = nacl.sign.keyPair.fromSecretKey(Uint8Array.from(keypairData));

async function makeRequest(url, options = {}) {
  const fetch = (await import('node-fetch')).default;
  const response = await fetch(url, options);
  const data = await response.json();
  if (!data.success && response.status >= 400) {
    throw new Error(`API Error: ${JSON.stringify(data)}`);
  }
  return data;
}

async function testAuthFlow() {
  console.log('🔐 Step 1: Getting authentication nonce...');

  const nonceResponse = await makeRequest(`${API_BASE}/v1/auth/nonce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress: WALLET_ADDRESS }),
  });

  const message = nonceResponse.data.nonce;
  console.log('✅ Received nonce');
  console.log(`   Message to sign: ${message.substring(0, 50)}...`);

  // Sign the message
  console.log('\n✍️  Step 2: Signing message...');
  const messageBytes = new TextEncoder().encode(message);
  const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
  const signatureBase58 = bs58.encode(signature);
  console.log(`✅ Signature: ${signatureBase58.substring(0, 20)}...`);

  // Verify authentication
  console.log('\n🔓 Step 3: Verifying authentication...');
  const authResponse = await makeRequest(`${API_BASE}/v1/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: WALLET_ADDRESS,
      signature: signatureBase58,
      message: message,
    }),
  });

  const token = authResponse.data.token;
  console.log('✅ Authentication successful!');
  console.log(`   Token: ${token.substring(0, 30)}...`);

  return token;
}

async function testMerchantCreation(token) {
  console.log('\n🏢 Step 4: Creating merchant account...');

  try {
    const merchantResponse = await makeRequest(`${API_BASE}/v1/merchants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        businessName: 'Test Merchant Corp',
        email: 'test@merchant.local',
        website: 'https://test-merchant.local',
      }),
    });

    console.log('✅ Merchant created!');
    console.log(`   Merchant ID: ${merchantResponse.data.id}`);
    return merchantResponse.data;
  } catch (error) {
    console.log('ℹ️  Merchant might already exist, continuing...');
    return null;
  }
}

async function testPaymentIntent(token) {
  console.log('\n💰 Step 5: Creating payment intent...');

  const paymentResponse = await makeRequest(`${API_BASE}/v1/payment-intents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      amount: 100,
      currency: 'USDC',
      recipient: RECIPIENT_ADDRESS,
      description: 'Test payment for E2E flow',
    }),
  });

  console.log('✅ Payment intent created!');
  console.log(`   Payment Intent ID: ${paymentResponse.data.id}`);
  console.log(`   Amount: ${paymentResponse.data.amount} ${paymentResponse.data.currency}`);
  console.log(`   Status: ${paymentResponse.data.status}`);

  return paymentResponse.data;
}

async function main() {
  console.log('🚀 NinjaPay E2E Payment Flow Test\n');
  console.log('=' .repeat(60));

  try {
    const token = await testAuthFlow();
    await testMerchantCreation(token);
    await testPaymentIntent(token);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed! E2E payment flow working correctly.\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
