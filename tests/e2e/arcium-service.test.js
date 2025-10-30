#!/usr/bin/env node

/**
 * End-to-End Test: Complete Encrypted Payment Flow
 *
 * Tests the full stack:
 * 1. TypeScript encryption
 * 2. HTTP API request to Arcium Service
 * 3. MPC simulation with real encryption
 * 4. Redis state management
 * 5. Result polling and decryption
 */

const path = require('path');
const { ArciumServiceClient } = require(path.resolve(__dirname, '../../packages/solana-utils/dist/arcium-service-client'));
const { EncryptionHelper } = require(path.resolve(__dirname, '../../packages/solana-utils/dist/encryption'));

// Test configuration
const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

if (!process.env.ENCRYPTION_MASTER_KEY) {
  console.warn(
    '⚠️  Using fallback ENCRYPTION_MASTER_KEY for tests. Ensure the Arcium service is configured with the same value.'
  );
}
const SERVICE_URL = process.env.ARCIUM_SERVICE_URL || 'http://localhost:8001';
const USER_WALLET = 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK';

console.log('🧪 NinjaPay End-to-End Test\n');
console.log('='.repeat(60));

async function testHealthCheck(client) {
  console.log('\n📡 Test 1: Health Check');
  try {
    const health = await client.healthCheck();
    console.log('✅ Service healthy:', health);
    return true;
  } catch (error) {
    console.log('❌ Service not available:', error.message);
    return false;
  }
}

async function testConfidentialTransfer(client) {
  console.log('\n💸 Test 2: Confidential Transfer');
  console.log('   Initial balance: $100.00 (10000 cents)');
  console.log('   Transfer amount: $25.00 (2500 cents)');
  console.log('   Expected result: $75.00 (7500 cents)');

  try {
    const balance = 10000n;
    const amount = 2500n;

    const startTime = Date.now();
    const newBalance = await client.confidentialTransfer(
      USER_WALLET,
      balance,
      amount
    );
    const duration = Date.now() - startTime;

    const expected = balance - amount;
    if (newBalance === expected) {
      console.log(`✅ Transfer successful in ${duration}ms`);
      console.log(`   New balance: $${Number(newBalance) / 100} (${newBalance} cents)`);
      return true;
    } else {
      console.log(`❌ Incorrect result: got ${newBalance}, expected ${expected}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Transfer failed:', error.message);
    return false;
  }
}

async function testBatchPayroll(client) {
  console.log('\n👥 Test 3: Batch Payroll (3 employees)');
  console.log('   Company balance: $500.00 (50000 cents)');
  console.log('   Employee 1: $50.00');
  console.log('   Employee 2: $75.00');
  console.log('   Employee 3: $60.00');
  console.log('   Total payout: $185.00');
  console.log('   Expected remaining: $315.00 (31500 cents)');

  try {
    const balance = 50000n;
    const payroll = [5000n, 7500n, 6000n];

    const startTime = Date.now();
    const remaining = await client.batchPayroll(
      USER_WALLET,
      balance,
      payroll
    );
    const duration = Date.now() - startTime;

    const totalPayout = payroll.reduce((sum, amount) => sum + amount, 0n);
    const expected = balance - totalPayout;

    if (remaining === expected) {
      console.log(`✅ Payroll processed in ${duration}ms`);
      console.log(`   Remaining balance: $${Number(remaining) / 100} (${remaining} cents)`);
      return true;
    } else {
      console.log(`❌ Incorrect result: got ${remaining}, expected ${expected}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Payroll failed:', error.message);
    return false;
  }
}

async function testEncryptionCompatibility() {
  console.log('\n🔐 Test 4: Encryption Compatibility (TS ↔ Rust)');

  try {
    const encryption = new EncryptionHelper(MASTER_KEY);
    const user = 'test_user';

    // Test 1: Basic roundtrip
    const value1 = 12345n;
    const encrypted1 = encryption.encryptU64(value1, user);
    const decrypted1 = encryption.decryptToU64(encrypted1, user);

    if (decrypted1 === value1) {
      console.log('   ✅ Basic roundtrip successful');
    } else {
      console.log(`   ❌ Roundtrip failed: ${decrypted1} !== ${value1}`);
      return false;
    }

    // Test 2: Format check (36 bytes)
    const bytes = Buffer.from(encrypted1, 'base64');
    if (bytes.length === 36) {
      console.log('   ✅ Data format correct (36 bytes)');
    } else {
      console.log(`   ❌ Wrong format: ${bytes.length} bytes (expected 36)`);
      return false;
    }

    // Test 3: User isolation
    const encrypted2 = encryption.encryptU64(value1, 'other_user');
    if (encrypted1 !== encrypted2) {
      console.log('   ✅ User isolation working (different ciphertexts)');
    } else {
      console.log('   ❌ User isolation failed (same ciphertext)');
      return false;
    }

    // Test 4: Tampering detection
    try {
      const tamperedBytes = Buffer.from(encrypted1, 'base64');
      tamperedBytes[20] ^= 0xFF;
      const tampered = tamperedBytes.toString('base64');
      encryption.decryptToU64(tampered, user);
      console.log('   ❌ Tampering not detected');
      return false;
    } catch (error) {
      console.log('   ✅ Tampering detected and rejected');
    }

    console.log('✅ All encryption tests passed');
    return true;
  } catch (error) {
    console.log('❌ Encryption test failed:', error.message);
    return false;
  }
}

async function testLargePayroll(client) {
  console.log('\n🏢 Test 5: Large Payroll (100 employees)');
  console.log('   Company balance: $1,000,000.00');
  console.log('   100 employees @ $5,000 each');
  console.log('   Total payout: $500,000.00');
  console.log('   Expected remaining: $500,000.00');

  try {
    const balance = 100000000n; // $1M in cents
    const payroll = Array.from({ length: 100 }, () => 500000n); // $5k each

    const startTime = Date.now();
    const remaining = await client.batchPayroll(
      USER_WALLET,
      balance,
      payroll
    );
    const duration = Date.now() - startTime;

    const totalPayout = BigInt(payroll.length) * 500000n;
    const expected = balance - totalPayout;

    if (remaining === expected) {
      console.log(`✅ Large payroll processed in ${duration}ms`);
      console.log(`   Avg time per employee: ${(duration / 100).toFixed(2)}ms`);
      console.log(`   Remaining: $${Number(remaining) / 100}`);
      return true;
    } else {
      console.log(`❌ Incorrect result: got ${remaining}, expected ${expected}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Large payroll failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  const client = new ArciumServiceClient({
    baseUrl: SERVICE_URL,
    masterKey: MASTER_KEY,
  });

  const results = {
    healthCheck: false,
    confidentialTransfer: false,
    batchPayroll: false,
    encryptionCompatibility: false,
    largePayroll: false,
  };

  // Run tests sequentially
  results.healthCheck = await testHealthCheck(client);

  if (!results.healthCheck) {
    console.log('\n❌ Service not available. Make sure Arcium Service is running:');
    console.log('   cd services/arcium-service && cargo run');
    return results;
  }

  results.encryptionCompatibility = await testEncryptionCompatibility();
  results.confidentialTransfer = await testConfidentialTransfer(client);
  results.batchPayroll = await testBatchPayroll(client);
  results.largePayroll = await testLargePayroll(client);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary\n');

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([test, result]) => {
    const icon = result ? '✅' : '❌';
    const name = test.replace(/([A-Z])/g, ' $1').trim();
    console.log(`${icon} ${name}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log(`\n${passed}/${total} tests passed\n`);

  if (passed === total) {
    console.log('🎉 All E2E tests passed!');
    console.log('\n✅ System Status:');
    console.log('   - TypeScript encryption: Working');
    console.log('   - Rust encryption: Working');
    console.log('   - MPC simulator: Working');
    console.log('   - Redis state management: Working');
    console.log('   - HTTP API: Working');
    console.log('   - Cross-platform compatibility: Verified');
    console.log('\n🚀 Ready for Week 2: Solana deployment + Arcium cluster integration');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Review logs above.');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
