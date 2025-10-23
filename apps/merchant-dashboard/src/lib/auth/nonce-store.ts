/**
 * Simple in-memory nonce store for development.
 * In production this should be backed by Redis or another shared cache.
 */
type NonceEntry = {
  value: string;
  expiresAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __NINJAPAY_NONCE_STORE__: Map<string, NonceEntry> | undefined;
  // eslint-disable-next-line no-var
  var __NINJAPAY_NONCE_CLEANUP__: NodeJS.Timeout | undefined;
}

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getStore(): Map<string, NonceEntry> {
  if (!globalThis.__NINJAPAY_NONCE_STORE__) {
    globalThis.__NINJAPAY_NONCE_STORE__ = new Map<string, NonceEntry>();
  }

  if (!globalThis.__NINJAPAY_NONCE_CLEANUP__) {
    globalThis.__NINJAPAY_NONCE_CLEANUP__ = setInterval(() => {
      const store = getStore();
      const now = Date.now();

      for (const [key, entry] of store.entries()) {
        if (entry.expiresAt <= now) {
          store.delete(key);
        }
      }
    }, NONCE_TTL_MS);
  }

  return globalThis.__NINJAPAY_NONCE_STORE__;
}

export function storeNonce(walletAddress: string, nonceMessage: string) {
  const store = getStore();
  store.set(walletAddress, {
    value: nonceMessage,
    expiresAt: Date.now() + NONCE_TTL_MS,
  });
}

export function consumeNonce(walletAddress: string, providedMessage: string): boolean {
  const store = getStore();
  const entry = store.get(walletAddress);

  if (!entry) {
    return false;
  }

  if (entry.expiresAt <= Date.now()) {
    store.delete(walletAddress);
    return false;
  }

  if (entry.value !== providedMessage) {
    return false;
  }

  store.delete(walletAddress);
  return true;
}

export function clearNonce(walletAddress: string) {
  const store = getStore();
  store.delete(walletAddress);
}

