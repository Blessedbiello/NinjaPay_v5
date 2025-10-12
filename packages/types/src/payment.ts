export type TxStatus = 'pending' | 'processing' | 'confirmed' | 'finalized' | 'failed' | 'cancelled';

export interface Transaction {
  id: string;
  userId: string;
  sender: string;
  recipient: string;
  encryptedAmount: Buffer; // ElGamal ciphertext
  amountCommitment: string; // Pedersen commitment (public)
  proofs: TransferProofs;
  signature?: string;
  status: TxStatus;
  sessionId?: string; // MagicBlock session ID
  layer: 'L1' | 'L2';
  createdAt: Date;
  updatedAt: Date;
}

export interface TransferProofs {
  rangeProof: Buffer;
  validityProof: Buffer;
  equalityProof?: Buffer;
}

export interface PaymentIntent {
  id: string;
  merchantId?: string;
  sender?: string;
  recipient: string;
  amountCommitment: string;
  status: TxStatus;
  sessionId?: string;
  txSignature?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfidentialTransferParams {
  from: string;
  to: string;
  amount: number;
  senderKeyId: string;
  priority?: 'speed' | 'finality';
}

export interface PaymentResult {
  id: string;
  signature: string;
  status: TxStatus;
  latency?: number;
  layer: 'L1' | 'L2';
}
