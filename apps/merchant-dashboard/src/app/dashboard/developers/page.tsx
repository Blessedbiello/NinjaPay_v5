'use client';

import { useState } from 'react';
import {
  Key,
  Webhook,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  FileCode,
  Terminal,
  Book,
} from 'lucide-react';

// Mock data
const mockApiKeys = [
  {
    id: 'key_abc123',
    name: 'Production Key',
    key: 'nj_live_abc123def456ghi789jkl012mno345pqr678stu901',
    type: 'live',
    lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'key_def456',
    name: 'Development Key',
    key: 'nj_test_xyz789uvw456rst123opq890lmn567ijk234fgh901',
    type: 'test',
    lastUsed: new Date(Date.now() - 5 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  },
];

const mockWebhooks = [
  {
    id: 'wh_abc123',
    url: 'https://api.example.com/webhooks/ninjapay',
    events: ['payment.succeeded', 'payment.failed'],
    status: 'active',
    lastDelivery: new Date(Date.now() - 1 * 60 * 60 * 1000),
    successRate: 98.7,
  },
  {
    id: 'wh_def456',
    url: 'https://staging.example.com/webhooks/ninjapay',
    events: ['payment.succeeded'],
    status: 'active',
    lastDelivery: new Date(Date.now() - 3 * 60 * 60 * 1000),
    successRate: 100,
  },
];

export default function DevelopersPage() {
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleReveal = (keyId: string) => {
    setRevealedKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Developers</h1>
          <p className="text-muted-foreground mt-1">
            API keys, webhooks, and integration resources
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="glass-card text-left hover:border-primary-500/30 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center group-hover:bg-primary-500/30 transition-colors">
              <Book className="w-5 h-5 text-primary-400" />
            </div>
            <h3 className="font-semibold">API Documentation</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Complete reference for all endpoints
          </p>
        </button>

        <button className="glass-card text-left hover:border-secondary-500/30 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-secondary-500/20 flex items-center justify-center group-hover:bg-secondary-500/30 transition-colors">
              <FileCode className="w-5 h-5 text-secondary-400" />
            </div>
            <h3 className="font-semibold">Code Examples</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            TypeScript, Python, and Rust SDKs
          </p>
        </button>

        <button className="glass-card text-left hover:border-accent-500/30 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center group-hover:bg-accent-500/30 transition-colors">
              <Terminal className="w-5 h-5 text-accent-400" />
            </div>
            <h3 className="font-semibold">API Playground</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Test API calls interactively
          </p>
        </button>
      </div>

      {/* API Keys Section */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Key className="w-5 h-5 text-primary-400" />
              API Keys
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Use these keys to authenticate API requests
            </p>
          </div>
          <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all btn-glow flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Key
          </button>
        </div>

        <div className="space-y-4">
          {mockApiKeys.map((apiKey) => {
            const isRevealed = revealedKeys.has(apiKey.id);
            return (
              <div
                key={apiKey.id}
                className="p-4 bg-dark-card border border-dark-border rounded-lg hover:border-primary-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{apiKey.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          apiKey.type === 'live'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}
                      >
                        {apiKey.type === 'live' ? 'Live' : 'Test'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last used {new Date(apiKey.lastUsed).toLocaleString()}
                    </p>
                  </div>
                  <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 p-3 bg-background rounded-lg">
                  <span className="font-mono text-sm flex-1 truncate">
                    {isRevealed ? apiKey.key : '•'.repeat(50)}
                  </span>
                  <button
                    onClick={() => toggleReveal(apiKey.id)}
                    className="p-2 hover:bg-primary-500/10 rounded transition-colors flex-shrink-0"
                  >
                    {isRevealed ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                    className="p-2 hover:bg-primary-500/10 rounded transition-colors flex-shrink-0"
                  >
                    {copiedId === apiKey.id ? (
                      <span className="text-xs text-green-400 px-2">Copied!</span>
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Webhooks Section */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Webhook className="w-5 h-5 text-secondary-400" />
              Webhooks
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Receive real-time notifications for payment events
            </p>
          </div>
          <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all btn-glow flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Webhook
          </button>
        </div>

        <div className="space-y-4">
          {mockWebhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="p-4 bg-dark-card border border-dark-border rounded-lg hover:border-primary-500/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-sm truncate">
                      {webhook.url}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 flex-shrink-0">
                      {webhook.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.map((event) => (
                      <span
                        key={event}
                        className="px-2 py-1 rounded-md text-xs font-medium bg-primary-500/10 text-primary-400 border border-primary-500/20"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-400 flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-dark-border">
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Success Rate: </span>
                    <span className="font-semibold text-green-400">
                      {webhook.successRate}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Delivery: </span>
                    <span className="font-semibold">
                      {new Date(webhook.lastDelivery).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <button className="px-3 py-1.5 text-sm border border-primary-500/30 hover:border-primary-500/60 rounded-lg transition-all">
                  Test Webhook
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code Example */}
      <div className="glass-card">
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="w-5 h-5 text-accent-400" />
          <h2 className="text-xl font-semibold">Quick Start</h2>
        </div>
        <div className="bg-dark-bg rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <pre className="text-green-400">
            <code>{`// Install the SDK
npm install @ninjapay/sdk

// Initialize the client
import { NinjaPaySDK } from '@ninjapay/sdk';

const ninjapay = new NinjaPaySDK({
  apiKey: 'nj_live_abc123...'
});

// Create a confidential payment
const payment = await ninjapay.payments.create({
  amount: 100,
  currency: 'USDC',
  recipient: '7xJ8kL9pMnQ2rStU3vWx...'
});

console.log('Payment created:', payment.id);
// All amounts encrypted with Arcium MPC`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
