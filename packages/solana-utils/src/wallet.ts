import { PublicKey, Transaction, Keypair } from '@solana/web3.js';
import { createLogger } from '@ninjapay/logger';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

const logger = createLogger('solana-wallet');

export class WalletUtils {
  /**
   * Validate Solana wallet address
   */
  static isValidAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify wallet signature for authentication
   */
  static verifySignature(
    message: string,
    signature: string,
    publicKey: string
  ): boolean {
    try {
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = bs58.decode(signature);
      const publicKeyBytes = new PublicKey(publicKey).toBytes();

      return nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );
    } catch (error) {
      logger.error('Failed to verify signature', { error });
      return false;
    }
  }

  /**
   * Generate authentication message for wallet signature
   */
  static generateAuthMessage(walletAddress: string): string {
    const timestamp = Date.now();
    return `Sign this message to authenticate with NinjaPay:\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
  }

  /**
   * Create a new Solana keypair (for testing/development)
   */
  static generateKeypair(): Keypair {
    return Keypair.generate();
  }

  /**
   * Get public key from private key
   */
  static getPublicKeyFromPrivateKey(privateKey: Uint8Array): PublicKey {
    const keypair = Keypair.fromSecretKey(privateKey);
    return keypair.publicKey;
  }

  /**
   * Shorten wallet address for display
   */
  static shortenAddress(address: string, chars: number = 4): string {
    if (address.length <= chars * 2 + 3) {
      return address;
    }
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  }
}
