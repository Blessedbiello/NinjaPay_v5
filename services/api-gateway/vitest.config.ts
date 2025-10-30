import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
config({ path: resolve(__dirname, '.env') });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://ninjapay:ninjapay123@localhost:5432/ninjapay?schema=public',
      REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
      JWT_SECRET: process.env.JWT_SECRET || 'test-jwt-secret-32-characters-long-minimum',
      ENCRYPTION_MASTER_KEY: process.env.ENCRYPTION_MASTER_KEY || 'b9228b22df1e15a5229828e1a8edf3a5f3e7ec0d54ec193b335f1c8db0f8eaae',
      ARCIUM_CALLBACK_SECRET: process.env.ARCIUM_CALLBACK_SECRET || '4b9c87c6a5f3d20419b2e0b9876543214b9c87c6a5f3d20419b2e0b987654321',
      SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      SOLANA_NETWORK: process.env.SOLANA_NETWORK || 'devnet',
      API_PORT: process.env.API_PORT || '8001',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
  },
});
