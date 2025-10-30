const UNSAFE_DEFAULTS = new Set([
  '0'.repeat(64),
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
]);

let cachedEncryptionKey: string | null = null;

function validateHexKey(value: string, varName: string): string {
  if (value.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error(`${varName} must be a 64 character hex string`);
  }

  const normalized = value.toLowerCase();
  if (UNSAFE_DEFAULTS.has(normalized)) {
    throw new Error(
      `${varName} is set to a development placeholder. Please provision a unique secret via your secret manager.`
    );
  }

  return normalized;
}

export function requireEncryptionMasterKey(): string {
  if (cachedEncryptionKey) {
    return cachedEncryptionKey;
  }

  const raw =
    process.env.ENCRYPTION_MASTER_KEY ?? process.env.ARCIUM_MASTER_KEY ?? '';

  if (!raw) {
    throw new Error(
      'ENCRYPTION_MASTER_KEY must be configured before using confidential APIs.'
    );
  }

  cachedEncryptionKey = validateHexKey(raw, 'ENCRYPTION_MASTER_KEY');
  return cachedEncryptionKey;
}
