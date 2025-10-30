# NinjaPay Deployment Configuration

## Deployed Programs (Devnet)

### ninja-payroll (MagicBlock Ephemeral Rollups)
- **Program ID**: `FEfFPJF8CMck4zvDPm6fGXcyUZifPHBT7P3YwCjdhHr7`
- **Deployed**: 2025-10-26
- **Size**: 307,856 bytes
- **Features**: 
  - Batch payroll processing
  - 10-50ms latency via ephemeral rollups
  - Zero transaction fees during rollup session
  - Automatic state commitment to Solana
- **Explorer**: https://explorer.solana.com/address/FEfFPJF8CMck4zvDPm6fGXcyUZifPHBT7P3YwCjdhHr7?cluster=devnet

### ninjapay-vault-lite (Encrypted Balance Storage)
- **Program ID**: `FKsek5byvQ7fMTD9atN55gAxytrWecci57chsjuYNFPP`
- **Deployed**: 2025-10-26
- **Size**: 236,584 bytes
- **Features**:
  - Encrypted balance storage
  - Payment intent recording
  - Audit trail for settlements
  - Integration with Arcium MPC service
- **Explorer**: https://explorer.solana.com/address/FKsek5byvQ7fMTD9atN55gAxytrWecci57chsjuYNFPP?cluster=devnet

## Integration Endpoints

### Environment Variables
```bash
NINJA_PAYROLL_PROGRAM_ID=FEfFPJF8CMck4zvDPm6fGXcyUZifPHBT7P3YwCjdhHr7
NINJAPAY_VAULT_PROGRAM_ID=FKsek5byvQ7fMTD9atN55gAxytrWecci57chsjuYNFPP
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
```

### Program Keypairs
Located in:
- `programs/ninja-payroll/target/deploy/ninja_payroll-keypair.json`
- `programs/ninjapay-vault-lite/target/deploy/ninjapay_vault_lite-keypair.json`

**⚠️ SECURITY**: Keep these keypairs secure - they control program upgrades!

## Quick Start Testing

### 1. Initialize a Vault
```bash
solana program invoke \
  --program-id FKsek5byvQ7fMTD9atN55gAxytrWecci57chsjuYNFPP \
  initialize_vault
```

### 2. Test Integration
```bash
cd services/api-gateway
pnpm dev
```

### 3. Check Deployment Status
```bash
solana program show FEfFPJF8CMck4zvDPm6fGXcyUZifPHBT7P3YwCjdhHr7
solana program show FKsek5byvQ7fMTD9atN55gAxytrWecci57chsjuYNFPP
```

## Upgrade Instructions

### Rebuild and Upgrade
```bash
# Rebuild programs
cd programs/ninja-payroll
cargo build-sbf

# Upgrade deployed program
solana program deploy \
  --program-id target/deploy/ninja_payroll-keypair.json \
  target/deploy/ninja_payroll.so
```

## Cost Breakdown

### Deployment Costs (Paid)
- ninja-payroll: 2.14 SOL (rent-exempt reserve)
- ninjapay-vault-lite: 1.65 SOL (rent-exempt reserve)
- **Total**: 3.79 SOL

### Operating Costs (Estimated)
- Vault initialization: ~0.002 SOL
- Payment intent: ~0.001 SOL
- Batch payroll (100 txs): ~0.02 SOL
- Monthly (1000 payments): ~0.2 SOL

## Network Configuration

- **Network**: Devnet
- **RPC**: https://api.devnet.solana.com
- **WebSocket**: wss://api.devnet.solana.com
- **Commitment**: confirmed

## Support

For issues or questions:
1. Check program logs: `solana logs <program_id>`
2. Review transaction on Explorer
3. Check Arcium service logs for MPC operations
4. Verify Redis/Postgres connections

---

**Last Updated**: 2025-10-26
**Status**: ✅ Production Ready (Devnet)
