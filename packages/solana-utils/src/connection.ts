import { Connection, Commitment, ConnectionConfig } from '@solana/web3.js';
import { createLogger } from '@ninjapay/logger';
import { SolanaConfig } from '@ninjapay/types';

const logger = createLogger('solana-connection');

export class SolanaConnection {
  private connection: Connection;
  private config: SolanaConfig;

  constructor(config?: Partial<SolanaConfig>) {
    const commitment = config?.commitment || 'confirmed';
    this.config = {
      rpcUrl: config?.rpcUrl || process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      commitment: commitment as 'processed' | 'confirmed' | 'finalized',
      wsUrl: config?.wsUrl || process.env.SOLANA_WS_URL,
    };

    const connectionConfig: ConnectionConfig = {
      commitment: this.config.commitment,
      wsEndpoint: this.config.wsUrl,
    };

    this.connection = new Connection(this.config.rpcUrl, connectionConfig);
    logger.info('Solana connection initialized', {
      rpcUrl: this.config.rpcUrl,
      commitment: this.config.commitment,
    });
  }

  getConnection(): Connection {
    return this.connection;
  }

  async getHealth(): Promise<'ok' | 'behind' | 'unknown'> {
    try {
      // Using getSlot() as health check
      await this.connection.getSlot();
      return 'ok';
    } catch (error) {
      logger.error('Failed to check Solana health', { error });
      return 'unknown';
    }
  }

  async getSlot(): Promise<number> {
    return await this.connection.getSlot();
  }

  async getBlockHeight(): Promise<number> {
    return await this.connection.getBlockHeight();
  }

  async getVersion(): Promise<any> {
    return await this.connection.getVersion();
  }

  async getBalance(publicKey: string): Promise<number> {
    try {
      const balance = await this.connection.getBalance(
        new (await import('@solana/web3.js')).PublicKey(publicKey)
      );
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      logger.error('Failed to get balance', { publicKey, error });
      throw error;
    }
  }

  async confirmTransaction(signature: string): Promise<boolean> {
    try {
      const result = await this.connection.confirmTransaction(signature, this.config.commitment);
      return !result.value.err;
    } catch (error) {
      logger.error('Failed to confirm transaction', { signature, error });
      return false;
    }
  }
}

// Singleton instance
let solanaConnection: SolanaConnection | null = null;

export function getSolanaConnection(config?: Partial<SolanaConfig>): SolanaConnection {
  if (!solanaConnection) {
    solanaConnection = new SolanaConnection(config);
  }
  return solanaConnection;
}

export function createSolanaConnection(config?: Partial<SolanaConfig>): SolanaConnection {
  return new SolanaConnection(config);
}
