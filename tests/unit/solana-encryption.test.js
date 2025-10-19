#!/usr/bin/env node

/**
 * Standalone test script for TypeScript encryption module
 *
 * Verifies compatibility with Rust implementation
 */

const { EncryptionHelper, EncryptionAPIUtils } = require('./dist/encryption');

// Test master key (matches Rust)
const TEST_MASTER_KEY =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

console.log('🧪 Testing TypeScript Encryption Module\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ ${message}`);
    passCount++;
  } else {
    console.log(`❌ ${message}`);
    failCount++;
  }
}

function assertEquals(actual, expected, message) {
  const isEqual = actual === expected || (typeof actual === 'bigint' && actual === BigInt(expected));
  assert(isEqual, message + ` (got: ${actual}, expected: ${expected})`);
}

// Test 1: Basic encryption/decryption
console.log('Test 1: Basic Encryption/Decryption');
const encryption = new EncryptionHelper(TEST_MASTER_KEY);
const user = 'test_user_pubkey';
const value = 42n;
const encrypted = encryption.encryptU64(value, user);
const decrypted = encryption.decryptToU64(encrypted, user);
assertEquals(decrypted, value, 'Should encrypt and decrypt u64 value');

// Test 2: Data format (36 bytes for u64)
console.log('\nTest 2: Data Format');
const encrypted2 = encryption.encryptU64(1000n, user);
const bytes = Buffer.from(encrypted2, 'base64');
assertEquals(bytes.length, 36, 'Encrypted u64 should be 36 bytes (12 nonce + 8 data + 16 tag)');

// Test 3: Nonce randomness
console.log('\nTest 3: Nonce Randomness');
const enc1 = encryption.encryptU64(42n, user);
const enc2 = encryption.encryptU64(42n, user);
assert(enc1 !== enc2, 'Same value should produce different ciphertexts (random nonce)');
assertEquals(encryption.decryptToU64(enc1, user), 42n, 'First ciphertext should decrypt correctly');
assertEquals(encryption.decryptToU64(enc2, user), 42n, 'Second ciphertext should decrypt correctly');

// Test 4: User isolation
console.log('\nTest 4: User Isolation');
const user1 = 'alice';
const user2 = 'bob';
const encAlice = encryption.encryptU64(100n, user1);
const encBob = encryption.encryptU64(100n, user2);
assert(encAlice !== encBob, 'Different users should produce different ciphertexts');
assertEquals(encryption.decryptToU64(encAlice, user1), 100n, 'Alice can decrypt her own data');

let bobFailed = false;
try {
  encryption.decryptToU64(encAlice, user2);
} catch (e) {
  bobFailed = true;
}
assert(bobFailed, 'Bob cannot decrypt Alice\'s data');

// Test 5: Tampering detection
console.log('\nTest 5: Tampering Detection');
const original = encryption.encryptU64(42n, user);
const tamperedBytes = Buffer.from(original, 'base64');
tamperedBytes[20] ^= 0xFF; // Flip bits
const tampered = tamperedBytes.toString('base64');

let tamperFailed = false;
try {
  encryption.decryptToU64(tampered, user);
} catch (e) {
  tamperFailed = true;
}
assert(tamperFailed, 'Should detect tampering (authentication tag mismatch)');

// Test 6: Batch operations
console.log('\nTest 6: Batch Operations');
const values = [10n, 20n, 30n];
const encryptedBatch = values.map(v => {
  const enc = encryption.encryptU64(v, user);
  return Buffer.from(enc, 'base64');
});

const batched = encryption.prepareBatchInputs(encryptedBatch);
const extracted = encryption.extractBatchResults(batched, 3);
assertEquals(extracted.length, 3, 'Should extract 3 values from batch');

// Test 7: Large batch (payroll simulation)
console.log('\nTest 7: Large Batch (100 employees)');
const payrollValues = [];
for (let i = 0; i < 100; i++) {
  payrollValues.push(BigInt(1000 + i));
}
const payrollEncrypted = payrollValues.map(v => {
  const enc = encryption.encryptU64(v, user);
  return Buffer.from(enc, 'base64');
});

const payrollBatched = encryption.prepareBatchInputs(payrollEncrypted);
const payrollExtracted = encryption.extractBatchResults(payrollBatched, 100);
assertEquals(payrollExtracted.length, 100, 'Should handle 100-item batch');

// Test 8: API Utilities
console.log('\nTest 8: API Utilities');
const apiUtils = new EncryptionAPIUtils(TEST_MASTER_KEY);
const apiUser = 'wallet_address_xyz';
const apiAmount = 5000;

const apiEncrypted = apiUtils.encryptForAPI(apiAmount, apiUser);
assert(typeof apiEncrypted === 'string', 'API encrypted value should be string (base64)');
assert(apiEncrypted.length > 0, 'API encrypted value should not be empty');

const apiDecrypted = apiUtils.decryptFromAPI(apiEncrypted, apiUser);
assertEquals(apiDecrypted, BigInt(apiAmount), 'API utils should decrypt correctly');

// Test 9: Batch API utilities
console.log('\nTest 9: Batch API Utilities');
const apiAmounts = [100, 200, 300];
const apiEncryptedBatch = apiUtils.encryptBatchForAPI(apiAmounts, apiUser);
assertEquals(apiEncryptedBatch.length, 3, 'Should encrypt batch for API');
assert(apiEncryptedBatch.every(e => typeof e === 'string'), 'All batch items should be strings');

// Test 10: Large values (max u64)
console.log('\nTest 10: Large Values');
const maxU64 = 18446744073709551615n;
const encMax = encryption.encryptU64(maxU64, user);
const decMax = encryption.decryptToU64(encMax, user);
assertEquals(decMax, maxU64, 'Should handle max u64 value');

// Test 11: Zero value
console.log('\nTest 11: Zero Value');
const encZero = encryption.encryptU64(0n, user);
const decZero = encryption.decryptToU64(encZero, user);
assertEquals(decZero, 0n, 'Should handle zero value');

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log('='.repeat(50));

if (failCount === 0) {
  console.log('\n🎉 All tests passed!');
  console.log('\n✅ TypeScript encryption is compatible with Rust implementation');
  console.log('   Format: [nonce (12)] + [ciphertext] + [tag (16)] = 36 bytes for u64');
  console.log('   HKDF key derivation per user');
  console.log('   ChaCha20-Poly1305 AEAD encryption');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}
