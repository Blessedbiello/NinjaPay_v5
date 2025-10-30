/**
 * Environment variable validation utility
 * Validates all required environment variables on startup
 */

interface EnvConfig {
  // Database
  DATABASE_URL: string;
  REDIS_URL: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  // Solana
  SOLANA_RPC_URL: string;
  SOLANA_NETWORK: string;

  // Arcium
  ARCIUM_SERVICE_PORT: string;
  ENCRYPTION_MASTER_KEY: string;

  // API
  API_PORT: string;
  CORS_ORIGIN: string;

  // Rate Limiting
  RATE_LIMIT_WINDOW: string;
  RATE_LIMIT_MAX_REQUESTS: string;

  // Environment
  NODE_ENV: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a single environment variable
 */
function validateEnvVar(
  name: keyof EnvConfig,
  value: string | undefined,
  options: {
    required?: boolean;
    minLength?: number;
    pattern?: RegExp;
    defaultValue?: string;
  } = {}
): { value: string | undefined; error?: string; warning?: string } {
  const { required = true, minLength, pattern, defaultValue } = options;

  // Check if required
  if (required && !value) {
    if (defaultValue) {
      return {
        value: defaultValue,
        warning: `${name} not set, using default: ${defaultValue}`,
      };
    }
    return {
      value,
      error: `${name} is required but not set`,
    };
  }

  if (!value) {
    return { value };
  }

  // Check minimum length
  if (minLength && value.length < minLength) {
    return {
      value,
      error: `${name} must be at least ${minLength} characters (current: ${value.length})`,
    };
  }

  // Check pattern
  if (pattern && !pattern.test(value)) {
    return {
      value,
      error: `${name} does not match required format`,
    };
  }

  return { value };
}

/**
 * Validate all environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Database
  const dbUrl = validateEnvVar('DATABASE_URL', process.env.DATABASE_URL, {
    required: true,
    pattern: /^postgresql:\/\//,
  });
  if (dbUrl.error) errors.push(dbUrl.error);

  const redisUrl = validateEnvVar('REDIS_URL', process.env.REDIS_URL, {
    required: true,
    pattern: /^redis:\/\//,
  });
  if (redisUrl.error) errors.push(redisUrl.error);

  // JWT Secret - CRITICAL
  const jwtSecret = validateEnvVar('JWT_SECRET', process.env.JWT_SECRET, {
    required: true,
    minLength: 32,
  });
  if (jwtSecret.error) {
    errors.push(jwtSecret.error);
  } else if (process.env.JWT_SECRET === 'change-me-to-a-strong-32-char-secret') {
    errors.push(
      'JWT_SECRET is using default value. MUST be changed in production!'
    );
  }

  const jwtExpires = validateEnvVar('JWT_EXPIRES_IN', process.env.JWT_EXPIRES_IN, {
    required: false,
    defaultValue: '7d',
  });
  if (jwtExpires.warning) warnings.push(jwtExpires.warning);

  // Encryption Master Key - CRITICAL
  const masterKey = validateEnvVar(
    'ENCRYPTION_MASTER_KEY',
    process.env.ENCRYPTION_MASTER_KEY,
    {
      required: true,
      minLength: 64,
      pattern: /^[0-9a-fA-F]{64}$/,
    }
  );
  if (masterKey.error) {
    errors.push(masterKey.error);
  } else {
    // Warn if using production in dev mode with weak key
    if (process.env.NODE_ENV === 'production' && process.env.ENCRYPTION_MASTER_KEY) {
      warnings.push(
        'ENCRYPTION_MASTER_KEY should be stored in AWS Secrets Manager, not .env file in production'
      );
    }
  }

  // Solana
  const solanaRpc = validateEnvVar('SOLANA_RPC_URL', process.env.SOLANA_RPC_URL, {
    required: true,
    pattern: /^https?:\/\//,
  });
  if (solanaRpc.error) errors.push(solanaRpc.error);

  const solanaNetwork = validateEnvVar(
    'SOLANA_NETWORK',
    process.env.SOLANA_NETWORK,
    {
      required: false,
      defaultValue: 'devnet',
    }
  );
  if (solanaNetwork.warning) warnings.push(solanaNetwork.warning);
  if (
    solanaNetwork.value &&
    !['mainnet-beta', 'devnet', 'testnet', 'localnet'].includes(
      solanaNetwork.value
    )
  ) {
    errors.push(
      `SOLANA_NETWORK must be one of: mainnet-beta, devnet, testnet, localnet (got: ${solanaNetwork.value})`
    );
  }

  // Arcium
  const arciumPort = validateEnvVar(
    'ARCIUM_SERVICE_PORT',
    process.env.ARCIUM_SERVICE_PORT,
    {
      required: false,
      defaultValue: '8002',
    }
  );
  if (arciumPort.warning) warnings.push(arciumPort.warning);

  // API Configuration
  const apiPort = validateEnvVar('API_PORT', process.env.API_PORT, {
    required: false,
    defaultValue: '8001',
  });
  if (apiPort.warning) warnings.push(apiPort.warning);

  const corsOrigin = validateEnvVar('CORS_ORIGIN', process.env.CORS_ORIGIN, {
    required: false,
    defaultValue: 'http://localhost:3001',
  });
  if (corsOrigin.warning) warnings.push(corsOrigin.warning);

  // Rate Limiting
  const rateLimitWindow = validateEnvVar(
    'RATE_LIMIT_WINDOW',
    process.env.RATE_LIMIT_WINDOW,
    {
      required: false,
      defaultValue: '60000',
    }
  );
  if (rateLimitWindow.warning) warnings.push(rateLimitWindow.warning);

  const rateLimitMax = validateEnvVar(
    'RATE_LIMIT_MAX_REQUESTS',
    process.env.RATE_LIMIT_MAX_REQUESTS,
    {
      required: false,
      defaultValue: '60',
    }
  );
  if (rateLimitMax.warning) warnings.push(rateLimitMax.warning);

  // Node Environment
  const nodeEnv = validateEnvVar('NODE_ENV', process.env.NODE_ENV, {
    required: false,
    defaultValue: 'development',
  });
  if (nodeEnv.warning) warnings.push(nodeEnv.warning);
  if (
    nodeEnv.value &&
    !['development', 'production', 'test'].includes(nodeEnv.value)
  ) {
    warnings.push(
      `NODE_ENV should be one of: development, production, test (got: ${nodeEnv.value})`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate environment and exit if critical errors found
 */
export function validateEnvironmentOrExit(): void {
  console.log('🔍 Validating environment variables...');

  const result = validateEnvironment();

  // Print warnings
  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment Warnings:');
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  // Print errors
  if (result.errors.length > 0) {
    console.error('\n❌ Environment Validation Failed:');
    result.errors.forEach((error) => console.error(`  - ${error}`));
    console.error('\nPlease fix the above errors and restart the server.\n');
    process.exit(1);
  }

  console.log('✅ Environment validation passed\n');
}

/**
 * Get a required environment variable or throw error
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

/**
 * Get an optional environment variable with default
 */
export function getOptionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

/**
 * Check if we're in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if we're in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
}

/**
 * Check if we're in test mode
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}
