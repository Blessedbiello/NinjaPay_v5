import { nanoid } from 'nanoid';

type NonceEntry = {
  value: string;
  expiresAt: number;
};

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Development-mode nonce store.
 *
 * NOTE: In production this should be backed by Redis or another shared cache.
 */
class AuthNonceService {
  private store = new Map<string, NonceEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(() => this.sweep(), NONCE_TTL_MS).unref();
  }

  generate(walletAddress: string): { message: string; expiresIn: number } {
    const nonce = nanoid(32);
    const message = [
      'Sign this message to authenticate with NinjaPay.',
      '',
      `Wallet: ${walletAddress}`,
      `Nonce: ${nonce}`,
      `Timestamp: ${Date.now()}`,
    ].join('\n');

    this.store.set(walletAddress, {
      value: message,
      expiresAt: Date.now() + NONCE_TTL_MS,
    });

    return { message, expiresIn: NONCE_TTL_MS / 1000 };
  }

  consume(walletAddress: string, providedMessage: string): boolean {
    const entry = this.store.get(walletAddress);
    if (!entry) {
      return false;
    }

    const isValid =
      entry.expiresAt > Date.now() && entry.value.trim() === providedMessage.trim();

    if (isValid) {
      this.store.delete(walletAddress);
    }

    return isValid;
  }

  private sweep() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }
}

export const authNonceService = new AuthNonceService();
