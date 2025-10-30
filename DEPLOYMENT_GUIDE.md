# NinjaPay Deployment Guide

## Prerequisites

- Solana CLI installed and configured
- Anchor CLI v0.30.1+
- Rust 1.80+ with nightly toolchain
- At least 5 SOL on devnet for deployments
- Redis running locally

## Current Status

### ✅ Completed
- **Arcium Service**: Full cluster integration with Solana SDK 2.0
  - Local simulator mode (working)
  - Cluster mode (ready for testing after program deployment)
  - Proper Anchor discriminators implemented
  - HTTP callback integration complete

- **TypeScript Integration**: 3-layer architecture
  - ArciumServiceClient (low-level HTTP)
  - ArciumClientService (business logic)
  - PaymentIntentService (domain integration)

- **Database**: Migration complete with MPC computation fields

### ⚠️ Blocked - Dependency Conflicts
- **ninja-payroll**: Dependency conflict between ephemeral-rollups-sdk (Solana 2.x) and anchor-spl 0.29 (Solana 1.x)
- **ninjapay-vault**: Requires Rust edition2024 (not yet stable)

## Deployment Steps (Once Resolved)

### 1. Deploy ninja-payroll (MagicBlock Payroll)

```bash
cd programs/ninja-payroll

# Fix dependency conflict first:
# Option A: Upgrade Anchor to 0.31+ (requires code changes)
# Option B: Downgrade ephemeral-rollups-sdk (may lose features)

# Build
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Get program ID
solana program show $(solana address -k target/deploy/ninja_payroll-keypair.json)

# Update Anchor.toml with deployed program ID
```

### 2. Deploy ninjapay-vault (Arcium MPC Vault)

```bash
cd services/arcium-service

# Build (requires Rust nightly with edition2024)
cargo build-sbf --manifest-path programs/ninjapay-vault/Cargo.toml

# Deploy
solana program deploy \
  target/deploy/ninjapay_vault.so \
  --program-id programs/ninjapay-vault/target/deploy/ninjapay_vault-keypair.json \
  --url devnet

# Verify deployment
solana program show <PROGRAM_ID> --url devnet
```

### 3. Update Configuration Files

After deployment, update program IDs in:

**services/arcium-service/.env**:
```env
ARCIUM_PROGRAM_ID=<deployed_ninjapay_vault_program_id>
MPC_MODE=cluster  # Switch from local to cluster mode
```

**services/arcium-service/Anchor.toml**:
```toml
[programs.devnet]
ninjapay_vault = "<deployed_program_id>"
```

**programs/ninja-payroll/Anchor.toml**:
```toml
[programs.devnet]
ninja_payroll = "<deployed_program_id>"
```

### 4. Initialize On-Chain Accounts

```bash
# Initialize MPC cluster account
curl -X POST http://localhost:8001/api/health
# Should return {"status": "healthy"}

# The Arcium service will auto-initialize cluster PDA on first use
# Ensure the following configuration is set before running in cluster mode:
#   - `ARCIUM_CLUSTER_OFFSET`, `ARCIUM_CLUSTER_MAX_SIZE`, `ARCIUM_CLUSTER_CU_PRICE`
#   - Optional `ARCIUM_CLUSTER_AUTHORITY` if different from the service signer
#   - `ARCIUM_ENCRYPTION_BACKEND` (`dev` for local ChaCha, `rescue` once native bindings are linked)

# When queueing real computations, wallets must provide a base58 `user_signature`
# over the generated transaction payload whenever the fee payer differs from the user.
```

### 5. Test Cluster Mode

```bash
# Start Arcium service in cluster mode
cd services/arcium-service
MPC_MODE=cluster cargo run

# In another terminal, queue a test computation
curl -X POST http://localhost:8001/api/computation/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "computation_type": "encrypted_transfer",
    "encrypted_inputs": ["'$(echo -n "1000" | base64)'", "'$(echo -n "500" | base64)'"],
    "user_pubkey": "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK",
    "metadata": {}
  }'

# Check computation status
curl "http://localhost:8001/api/computation/status?computation_id=<comp_id>"
```

## Known Issues & Workarounds

### Issue 1: ninja-payroll Dependency Conflict

**Problem**: ephemeral-rollups-sdk 0.3.6 depends on Solana 2.x, but Anchor 0.29 uses Solana 1.x

**Workaround Options**:
1. **Upgrade to Anchor 0.31** (recommended):
   ```toml
   [dependencies]
   anchor-lang = "0.31"
   anchor-spl = "0.31"
   ```
   - Requires updating code for API changes
   - Best long-term solution

2. **Use ephemeral-rollups-sdk-v2**:
   ```toml
   ephemeral-rollups-sdk-v2 = "0.1.2"
   ```
   - May have different API
   - Check if MagicBlock delegation still works

3. **Pin specific Solana versions** in Cargo.toml:
   ```toml
   [patch.crates-io]
   solana-program = { version = "=1.18.0" }
   ```

### Issue 2: ninjapay-vault Edition 2024 Requirement

**Problem**: arcium-anchor dependencies require Rust edition2024

**Workaround**:
1. Use Rust nightly: `rustup default nightly`
2. Or wait for Arcium to release stable edition2021-compatible version
3. Or remove Arcium integration temporarily and use local simulator only

## Testing Checklist

- [ ] ninja-payroll builds successfully
- [ ] ninja-payroll deploys to devnet
- [ ] ninjapay-vault builds successfully
- [ ] ninjapay-vault deploys to devnet
- [ ] Arcium service starts in cluster mode
- [ ] Can initialize cluster PDA on-chain
- [ ] Can queue computation to cluster
- [ ] On-chain transaction appears on Solscan
- [ ] Callback received with tx_signature
- [ ] Payment intent status updated correctly
- [ ] Encrypted result stored in database
- [ ] End-to-end payment flow works

## Production Deployment

Before going to production:

1. **Security**:
   - [ ] Move ENCRYPTION_MASTER_KEY to AWS Secrets Manager (the Arcium service and API gateway now abort on startup unless this value is retrieved from a secret manager)
   - [ ] Use KMS for Solana keypair
   - [ ] Enable API authentication
   - [ ] Add rate limiting (100 computations/hour per user)

2. **Monitoring**:
   - [ ] Add Prometheus metrics
   - [ ] Set up alerts for failed computations
   - [ ] Configure CloudWatch/Datadog logging

3. **Testing**:
   - [ ] Write 20+ integration tests
   - [ ] Load test with 1000 concurrent users
   - [ ] Chaos testing (network failures, etc.)

4. **Deployment**:
   - [ ] Deploy to mainnet-beta (not devnet)
   - [ ] Use multisig for program upgrades
   - [ ] Set up CI/CD pipeline
   - [ ] Create rollback plan

## Troubleshooting

### "Program not found" error
```bash
# Verify program is deployed
solana program show <PROGRAM_ID> --url devnet

# If not found, redeploy
anchor deploy --provider.cluster devnet
```

### "Invalid discriminator" error
```bash
# Check if discriminator calculation is correct
# Should be: SHA256("global:confidential_transfer")[..8]
# Implemented in: services/arcium-service/src/mpc/discriminators.rs
```

### Callback not received
```bash
# Check callback URL is reachable
curl http://localhost:8001/v1/arcium/callbacks

# Check Redis connection
redis-cli ping  # Should return PONG

# Check computation metadata
redis-cli get "comp:<computation_id>"
```

## Next Steps

1. Resolve dependency conflicts
2. Deploy both programs to devnet
3. Run integration tests
4. Performance benchmarking
5. Production hardening

---

**Last Updated**: 2025-10-25
**Status**: Ready for deployment pending dependency resolution
