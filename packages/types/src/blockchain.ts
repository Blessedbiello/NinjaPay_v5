// Blockchain-specific types

export interface ArciumConfig {
  network: 'mainnet-alpha' | 'devnet' | 'testnet';
  mxeEndpoint: string;
  apiKey?: string;
}

export interface MXESession {
  id: string;
  type: 'confidential-account-setup' | 'confidential-transfer' | 'batch-transfer' | 'balance-decryption' | 'proof-generation';
  participants: string[];
  threshold: number;
  createdAt: Date;
}

export interface ElGamalKeypair {
  publicKey: string;
  keyId: string; // Reference to MPC key shares
}

export interface ConfidentialAccountParams {
  owner: string;
  mint: string;
  elgamalPubkey: string;
  keyId: string;
}

export interface MagicBlockConfig {
  endpoint: string;
  commitment: 'processed' | 'confirmed' | 'finalized';
  teeAttestation: boolean;
}

export interface EphemeralSession {
  id: string;
  accounts: string[];
  duration: number;
  maxTransactions: number;
  commitInterval: number;
  teeSecured: boolean;
  active: boolean;
  transactionCount: number;
  lastCommitSlot: number;
  createdAt: Date;
}

export interface SessionStatus {
  active: boolean;
  transactionsProcessed: number;
  pendingCommitment: number;
  lastCommitSlot: number;
  estimatedFinality: number;
}

export interface CommitResult {
  commitSignature: string;
  transactionsFinalized: number;
  merkleRoot: string;
}

export interface SolanaConfig {
  rpcUrl: string;
  commitment?: 'processed' | 'confirmed' | 'finalized';
  wsUrl?: string;
}

export interface TokenAccount {
  address: string;
  mint: string;
  owner: string;
  amount: string; // encrypted
  isConfidential: boolean;
}
