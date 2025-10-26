/**
 * Neural Intelligence System - TypeScript SDK
 * Main entry point
 */

// Export client classes
export { NeuralIntelligenceClient, createClient } from './client';
export { NeuralWebSocketClient, createWebSocketClient } from './websocket';

// Export all types
export * from './types';

// Export version
export const VERSION = '0.1.0';
