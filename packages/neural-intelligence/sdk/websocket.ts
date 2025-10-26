/**
 * Neural Intelligence System - WebSocket Client
 * Real-time event streaming from agents
 */

import WebSocket from 'ws';
import { WebSocketMessage, AgentEvent, WebSocketCallback } from './types';

export interface WebSocketClientConfig {
  url: string;
  clientId?: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  debug?: boolean;
}

export class NeuralWebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketClientConfig>;
  private eventHandlers: Map<string, Set<WebSocketCallback>> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;
  private shouldReconnect: boolean = true;

  constructor(config: WebSocketClientConfig) {
    this.config = {
      url: config.url,
      clientId: config.clientId || `client_${Date.now()}`,
      reconnect: config.reconnect ?? true,
      reconnectInterval: config.reconnectInterval || 5000,
      debug: config.debug || false,
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
        resolve();
        return;
      }

      this.isConnecting = true;
      const wsUrl = `${this.config.url}?client_id=${this.config.clientId}`;

      this.log('Connecting to', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        this.log('Connected');
        this.isConnecting = false;
        this.sendHeartbeat();
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          this.handleMessage(message);
        } catch (error) {
          this.log('Error parsing message:', error);
        }
      });

      this.ws.on('close', () => {
        this.log('Disconnected');
        this.isConnecting = false;
        if (this.shouldReconnect && this.config.reconnect) {
          this.scheduleReconnect();
        }
      });

      this.ws.on('error', (error) => {
        this.log('WebSocket error:', error);
        this.isConnecting = false;
        reject(error);
      });
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to specific agent events
   */
  subscribeToAgents(agents: string[]): void {
    this.send({
      type: 'subscribe',
      agents,
    });
  }

  /**
   * Register event handler
   */
  on(eventType: string, callback: WebSocketCallback): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(callback);
  }

  /**
   * Remove event handler
   */
  off(eventType: string, callback?: WebSocketCallback): void {
    if (!callback) {
      this.eventHandlers.delete(eventType);
    } else {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(callback);
      }
    }
  }

  /**
   * Send message to server
   */
  private send(message: WebSocketMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.log('Cannot send message: WebSocket not connected');
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: WebSocketMessage): void {
    this.log('Received message:', message.type);

    if (message.type === 'pong') {
      // Heartbeat response
      return;
    }

    if (message.type === 'agent_event') {
      const event = message as AgentEvent;
      this.emitEvent(event.event_type, event);
      this.emitEvent('*', event); // Wildcard for all events
    }
  }

  /**
   * Emit event to registered handlers
   */
  private emitEvent(eventType: string, event: AgentEvent): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          this.log('Error in event handler:', error);
        }
      });
    }
  }

  /**
   * Send heartbeat to keep connection alive
   */
  private sendHeartbeat(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({ type: 'ping' });
      setTimeout(() => this.sendHeartbeat(), 30000); // Every 30 seconds
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      return;
    }

    this.log(`Reconnecting in ${this.config.reconnectInterval}ms...`);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect().catch((error) => {
        this.log('Reconnection failed:', error);
      });
    }, this.config.reconnectInterval);
  }

  /**
   * Log debug messages
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[NeuralWebSocket]', ...args);
    }
  }

  /**
   * Get connection status
   */
  get connected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export convenience factory function
export function createWebSocketClient(
  config: WebSocketClientConfig
): NeuralWebSocketClient {
  return new NeuralWebSocketClient(config);
}
