'use client';

import { useState, useEffect } from 'react';
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
  X,
  Code,
  Play,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Activity,
  Package,
  Download,
  Check,
} from 'lucide-react';
import { useDeveloperMetrics, useApiActivity, useApiErrors } from '@/hooks/useApi';

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
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showExamplesModal, setShowExamplesModal] = useState(false);
  const [showPlaygroundModal, setShowPlaygroundModal] = useState(false);
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [showAddWebhookModal, setShowAddWebhookModal] = useState(false);

  // Real data state
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [loadingWebhooks, setLoadingWebhooks] = useState(true);

  // Developer metrics hooks
  const { data: metrics, loading: metricsLoading } = useDeveloperMetrics();
  const { items: recentActivity, loading: activityLoading } = useApiActivity({ limit: 10 });
  const { items: recentErrors, loading: errorsLoading } = useApiErrors({ limit: 5 });

  // Form state
  const [keyName, setKeyName] = useState('');
  const [keyEnvironment, setKeyEnvironment] = useState('live');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookDescription, setWebhookDescription] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['payment.succeeded', 'payment.failed']);

  // Fetch API keys
  useEffect(() => {
    fetchApiKeys();
  }, []);

  // Fetch webhooks
  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchApiKeys = async () => {
    setLoadingKeys(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/v1/api_keys', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setApiKeys(data.data.items);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoadingKeys(false);
    }
  };

  const fetchWebhooks = async () => {
    setLoadingWebhooks(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/v1/webhooks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setWebhooks(data.data.items);
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    } finally {
      setLoadingWebhooks(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!keyName) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/v1/api_keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: keyName,
          permissions: ['read', 'write'],
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchApiKeys();
        setShowCreateKeyModal(false);
        setKeyName('');
        alert('API key created successfully!');
      } else {
        alert('Failed to create API key: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('Failed to create API key');
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/v1/api_keys/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        await fetchApiKeys();
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const handleCreateWebhook = async () => {
    if (!webhookUrl || webhookEvents.length === 0) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/v1/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          url: webhookUrl,
          events: webhookEvents,
          description: webhookDescription || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchWebhooks();
        setShowAddWebhookModal(false);
        setWebhookUrl('');
        setWebhookDescription('');
        setWebhookEvents(['payment.succeeded', 'payment.failed']);
        alert('Webhook created successfully!');
      } else {
        alert('Failed to create webhook: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const response = await fetch(`/api/v1/webhooks/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        await fetchWebhooks();
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
    }
  };

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
        <button
          onClick={() => setShowDocsModal(true)}
          className="glass-card text-left hover:border-primary-500/30 transition-all group"
        >
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

        <button
          onClick={() => setShowExamplesModal(true)}
          className="glass-card text-left hover:border-secondary-500/30 transition-all group"
        >
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

        <button
          onClick={() => setShowPlaygroundModal(true)}
          className="glass-card text-left hover:border-accent-500/30 transition-all group"
        >
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

      {/* API Usage Metrics Grid */}
      {metricsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card animate-pulse">
              <div className="h-12 w-12 bg-dark-border rounded-lg mb-4"></div>
              <div className="h-4 w-24 bg-dark-border rounded mb-2"></div>
              <div className="h-8 w-32 bg-dark-border rounded"></div>
            </div>
          ))}
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total API Calls */}
          <div className="glass-card">
            <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-primary-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total API Calls</p>
              <p className="text-3xl font-bold">{metrics.apiCalls.total.toLocaleString()}</p>
              <p className="text-sm text-green-400">{metrics.apiCalls.growth} from last month</p>
            </div>
          </div>

          {/* Success Rate */}
          <div className="glass-card">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-3xl font-bold">{metrics.successRate}%</p>
              <p className="text-sm text-muted-foreground">API call success</p>
            </div>
          </div>

          {/* Average Response Time */}
          <div className="glass-card">
            <div className="w-12 h-12 rounded-lg bg-secondary-500/20 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-secondary-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
              <p className="text-3xl font-bold">{metrics.avgResponseTime}ms</p>
              <p className="text-sm text-muted-foreground">Per request</p>
            </div>
          </div>

          {/* Active API Keys */}
          <div className="glass-card">
            <div className="w-12 h-12 rounded-lg bg-accent-500/20 flex items-center justify-center mb-4">
              <Key className="w-6 h-6 text-accent-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Active API Keys</p>
              <p className="text-3xl font-bold">{metrics.activeApiKeys}/{metrics.totalApiKeys}</p>
              <p className="text-sm text-muted-foreground">Used in last 7 days</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Recent API Activity */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-400" />
              Recent API Activity
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Last 10 API requests
            </p>
          </div>
        </div>

        {activityLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-dark-card border border-dark-border rounded-lg animate-pulse">
                <div className="h-4 w-3/4 bg-dark-border rounded mb-2"></div>
                <div className="h-3 w-1/2 bg-dark-border rounded"></div>
              </div>
            ))}
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Method</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Endpoint</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Response Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">API Key</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((activity) => {
                  const statusColor = activity.statusCode >= 200 && activity.statusCode < 300
                    ? 'text-green-400 bg-green-500/10'
                    : activity.statusCode >= 400
                    ? 'text-red-400 bg-red-500/10'
                    : 'text-yellow-400 bg-yellow-500/10';

                  return (
                    <tr key={activity.id} className="border-b border-dark-border/50 hover:bg-dark-card/50">
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded text-xs font-mono bg-dark-border">
                          {activity.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-mono">{activity.endpoint}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                          {activity.statusCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{activity.responseTime}ms</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {activity.apiKeyName} (••{activity.apiKeyLastChars})
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No API activity yet</p>
          </div>
        )}
      </div>

      {/* Integration Status Checklist */}
      {metrics && (
        <div className="glass-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Integration Status
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {metrics.integrationStatus.completionPercentage}% complete
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-400">
                {metrics.integrationStatus.completionPercentage}%
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Create API Key', completed: metrics.integrationStatus.hasApiKey },
              { label: 'Make first API call', completed: metrics.integrationStatus.hasFirstCall },
              { label: 'Configure webhook', completed: metrics.integrationStatus.hasWebhook },
              { label: 'Receive webhook delivery', completed: metrics.integrationStatus.hasWebhookDelivery },
              { label: 'Complete test payment', completed: metrics.integrationStatus.hasTestPayment },
            ].map((step, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-dark-card rounded-lg">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  step.completed ? 'bg-green-500/20' : 'bg-dark-border'
                }`}>
                  {step.completed && <Check className="w-4 h-4 text-green-400" />}
                </div>
                <span className={step.completed ? 'text-foreground' : 'text-muted-foreground'}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SDK Installation */}
      <div className="glass-card">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-accent-400" />
          <h2 className="text-xl font-semibold">SDK Installation</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'TypeScript/JavaScript', command: 'npm install @ninjapay/sdk' },
            { label: 'Python', command: 'pip install ninjapay' },
            { label: 'Rust', command: 'cargo add ninjapay' },
          ].map((sdk, index) => (
            <div key={index} className="bg-dark-bg rounded-lg p-4">
              <p className="text-sm font-medium mb-2 text-muted-foreground">{sdk.label}</p>
              <div className="flex items-center justify-between bg-background rounded p-2">
                <code className="text-sm text-green-400">{sdk.command}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sdk.command);
                    setCopiedId(sdk.label);
                    setTimeout(() => setCopiedId(null), 2000);
                  }}
                  className="p-1 hover:bg-primary-500/10 rounded transition-colors"
                >
                  {copiedId === sdk.label ? (
                    <span className="text-xs text-green-400">Copied!</span>
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Errors */}
      {recentErrors && recentErrors.length > 0 && (
        <div className="glass-card border-red-500/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                Recent Errors
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Last {recentErrors.length} API errors
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {recentErrors.map((error) => (
              <div key={error.id} className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded text-xs font-mono bg-red-500/20 text-red-400">
                      {error.method}
                    </span>
                    <span className="text-sm font-mono">{error.endpoint}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(error.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-red-400">{error.errorMessage}</p>
                <span className="inline-block mt-2 px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
                  {error.statusCode}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
          <button
            onClick={() => setShowCreateKeyModal(true)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all btn-glow flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Key
          </button>
        </div>

        {loadingKeys ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 bg-dark-card border border-dark-border rounded-lg animate-pulse">
                <div className="h-4 w-3/4 bg-dark-border rounded mb-2"></div>
                <div className="h-3 w-1/2 bg-dark-border rounded"></div>
              </div>
            ))}
          </div>
        ) : apiKeys.length > 0 ? (
          <div className="space-y-4">
            {apiKeys.map((apiKey) => {
              const isRevealed = revealedKeys.has(apiKey.id);
              const keyType = apiKey.key?.startsWith('nj_live_') ? 'live' : 'test';
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
                            keyType === 'live'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          }`}
                        >
                          {keyType === 'live' ? 'Live' : 'Test'}
                        </span>
                        {!apiKey.active && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(apiKey.createdAt).toLocaleDateString()}
                        {apiKey.lastUsedAt && ` • Last used ${new Date(apiKey.lastUsedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteApiKey(apiKey.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-400"
                    >
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
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-border flex items-center justify-center">
              <Key className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No API keys yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first API key to get started
            </p>
          </div>
        )}
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
          <button
            onClick={() => setShowAddWebhookModal(true)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all btn-glow flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Webhook
          </button>
        </div>

        {loadingWebhooks ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 bg-dark-card border border-dark-border rounded-lg animate-pulse">
                <div className="h-4 w-3/4 bg-dark-border rounded mb-2"></div>
                <div className="h-3 w-1/2 bg-dark-border rounded"></div>
              </div>
            ))}
          </div>
        ) : webhooks.length > 0 ? (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
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
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                        webhook.enabled
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {webhook.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    {webhook.description && (
                      <p className="text-xs text-muted-foreground mb-2">{webhook.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {webhook.events.map((event: string) => (
                        <span
                          key={event}
                          className="px-2 py-1 rounded-md text-xs font-medium bg-primary-500/10 text-primary-400 border border-primary-500/20"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteWebhook(webhook.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-400 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-dark-border">
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Created: </span>
                      <span className="font-semibold">
                        {new Date(webhook.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Deliveries: </span>
                      <span className="font-semibold">
                        {webhook._count?.deliveries || 0}
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
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-border flex items-center justify-center">
              <Webhook className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No webhooks configured</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add a webhook to receive real-time event notifications
            </p>
          </div>
        )}
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

      {/* API Documentation Modal */}
      {showDocsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-dark-card border-b border-dark-border p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                  <Book className="w-5 h-5 text-primary-400" />
                </div>
                <h2 className="text-2xl font-semibold">API Documentation</h2>
              </div>
              <button
                onClick={() => setShowDocsModal(false)}
                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary-400">Payment Intents</h3>
                <div className="space-y-4">
                  <div className="bg-dark-bg rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-mono rounded">POST</span>
                      <code className="text-sm">/api/v1/payment_intents</code>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Create a new confidential payment intent</p>
                    <pre className="text-xs bg-background rounded p-3 overflow-x-auto">
                      <code>{`{
  "amount": 100,
  "currency": "USDC",
  "recipient": "7xJ8kL9pMnQ2rStU3vWx...",
  "description": "Payment for services"
}`}</code>
                    </pre>
                  </div>
                  <div className="bg-dark-bg rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-mono rounded">GET</span>
                      <code className="text-sm">/api/v1/payment_intents/:id</code>
                    </div>
                    <p className="text-sm text-muted-foreground">Retrieve payment intent details</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-secondary-400">Payment Links</h3>
                <div className="space-y-4">
                  <div className="bg-dark-bg rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-mono rounded">POST</span>
                      <code className="text-sm">/api/v1/payment_links</code>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Create a payment link for products</p>
                    <pre className="text-xs bg-background rounded p-3 overflow-x-auto">
                      <code>{`{
  "productId": "prod_abc123",
  "customUrl": "my-product",
  "expiresAt": "2025-12-31T23:59:59Z",
  "maxUses": 100
}`}</code>
                    </pre>
                  </div>
                  <div className="bg-dark-bg rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-mono rounded">GET</span>
                      <code className="text-sm">/api/v1/payment_links</code>
                    </div>
                    <p className="text-sm text-muted-foreground">List all payment links</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-accent-400">Webhooks</h3>
                <div className="space-y-4">
                  <div className="bg-dark-bg rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-mono rounded">POST</span>
                      <code className="text-sm">/api/v1/webhooks</code>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Register a webhook endpoint</p>
                    <pre className="text-xs bg-background rounded p-3 overflow-x-auto">
                      <code>{`{
  "url": "https://your-domain.com/webhook",
  "events": ["payment.succeeded", "payment.failed"]
}`}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Code Examples Modal */}
      {showExamplesModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-dark-card border-b border-dark-border p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary-500/20 flex items-center justify-center">
                  <FileCode className="w-5 h-5 text-secondary-400" />
                </div>
                <h2 className="text-2xl font-semibold">Code Examples</h2>
              </div>
              <button
                onClick={() => setShowExamplesModal(false)}
                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Code className="w-5 h-5 text-blue-400" />
                  TypeScript / JavaScript
                </h3>
                <div className="bg-dark-bg rounded-lg p-4">
                  <pre className="text-sm overflow-x-auto">
                    <code className="text-green-400">{`import { NinjaPaySDK } from '@ninjapay/sdk';

const ninjapay = new NinjaPaySDK({
  apiKey: process.env.NINJAPAY_API_KEY
});

// Create confidential payment
const payment = await ninjapay.payments.create({
  amount: 100,
  currency: 'USDC',
  recipient: '7xJ8kL9pMnQ2rStU3vWx9ZyAbC1dEfGh2IjKlMnOpQrS',
  description: 'Payment for services'
});

console.log('Payment ID:', payment.id);
console.log('Status:', payment.status);

// Create payment link
const link = await ninjapay.paymentLinks.create({
  productId: 'prod_abc123',
  customUrl: 'web3-course',
  expiresAt: new Date('2025-12-31')
});

console.log('Payment Link:', link.url);`}</code>
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Code className="w-5 h-5 text-yellow-400" />
                  Python
                </h3>
                <div className="bg-dark-bg rounded-lg p-4">
                  <pre className="text-sm overflow-x-auto">
                    <code className="text-green-400">{`import ninjapay
import os

# Initialize client
client = ninjapay.Client(api_key=os.getenv('NINJAPAY_API_KEY'))

# Create confidential payment
payment = client.payments.create(
    amount=100,
    currency='USDC',
    recipient='7xJ8kL9pMnQ2rStU3vWx9ZyAbC1dEfGh2IjKlMnOpQrS',
    description='Payment for services'
)

print(f'Payment ID: {payment.id}')
print(f'Status: {payment.status}')

# Create payment link
link = client.payment_links.create(
    product_id='prod_abc123',
    custom_url='web3-course'
)

print(f'Payment Link: {link.url}')`}</code>
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Code className="w-5 h-5 text-orange-400" />
                  Rust
                </h3>
                <div className="bg-dark-bg rounded-lg p-4">
                  <pre className="text-sm overflow-x-auto">
                    <code className="text-green-400">{`use ninjapay::{Client, PaymentRequest};
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize client
    let api_key = env::var("NINJAPAY_API_KEY")?;
    let client = Client::new(&api_key);

    // Create confidential payment
    let payment = client.payments().create(PaymentRequest {
        amount: 100,
        currency: "USDC".to_string(),
        recipient: "7xJ8kL9pMnQ2rStU3vWx9ZyAbC1dEfGh2IjKlMnOpQrS".to_string(),
        description: Some("Payment for services".to_string()),
    }).await?;

    println!("Payment ID: {}", payment.id);
    println!("Status: {:?}", payment.status);

    Ok(())
}`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Playground Modal */}
      {showPlaygroundModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-dark-card border-b border-dark-border p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center">
                  <Terminal className="w-5 h-5 text-accent-400" />
                </div>
                <h2 className="text-2xl font-semibold">API Playground</h2>
              </div>
              <button
                onClick={() => setShowPlaygroundModal(false)}
                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Endpoint</label>
                <select className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2">
                  <option>POST /api/v1/payment_intents</option>
                  <option>GET /api/v1/payment_intents/:id</option>
                  <option>POST /api/v1/payment_links</option>
                  <option>GET /api/v1/payment_links</option>
                  <option>POST /api/v1/webhooks</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Request Body</label>
                <textarea
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 font-mono text-sm h-64 resize-none"
                  defaultValue={`{
  "amount": 100,
  "currency": "USDC",
  "recipient": "7xJ8kL9pMnQ2rStU3vWx...",
  "description": "Test payment"
}`}
                />
              </div>

              <button className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all btn-glow flex items-center justify-center gap-2">
                <Play className="w-4 h-4" />
                Send Request
              </button>

              <div>
                <label className="block text-sm font-medium mb-2">Response</label>
                <div className="bg-dark-bg border border-dark-border rounded-lg px-4 py-3 font-mono text-sm h-48 overflow-y-auto">
                  <p className="text-muted-foreground">Response will appear here...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create API Key Modal */}
      {showCreateKeyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-dark-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                  <Key className="w-5 h-5 text-primary-400" />
                </div>
                <h2 className="text-xl font-semibold">Create API Key</h2>
              </div>
              <button
                onClick={() => setShowCreateKeyModal(false)}
                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Key Name</label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="Production API Key"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Environment</label>
                <select
                  value={keyEnvironment}
                  onChange={(e) => setKeyEnvironment(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2"
                >
                  <option value="test">Test</option>
                  <option value="live">Live</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Permissions</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Read access</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Write access</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateKeyModal(false);
                    setKeyName('');
                  }}
                  className="flex-1 px-4 py-2 border border-dark-border hover:bg-dark-bg rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateApiKey}
                  disabled={!keyName}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all btn-glow"
                >
                  Create Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Webhook Modal */}
      {showAddWebhookModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-dark-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary-500/20 flex items-center justify-center">
                  <Webhook className="w-5 h-5 text-secondary-400" />
                </div>
                <h2 className="text-xl font-semibold">Add Webhook</h2>
              </div>
              <button
                onClick={() => setShowAddWebhookModal(false)}
                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Webhook URL</label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-domain.com/webhook"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                <input
                  type="text"
                  value={webhookDescription}
                  onChange={(e) => setWebhookDescription(e.target.value)}
                  placeholder="Production webhook endpoint"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Events to receive</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {['payment.succeeded', 'payment.failed', 'payment.processing', 'payment.cancelled', 'payment_link.created', 'payment_link.used'].map((event) => (
                    <label key={event} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={webhookEvents.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setWebhookEvents([...webhookEvents, event]);
                          } else {
                            setWebhookEvents(webhookEvents.filter((e) => e !== event));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddWebhookModal(false);
                    setWebhookUrl('');
                    setWebhookDescription('');
                    setWebhookEvents(['payment.succeeded', 'payment.failed']);
                  }}
                  className="flex-1 px-4 py-2 border border-dark-border hover:bg-dark-bg rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWebhook}
                  disabled={!webhookUrl || webhookEvents.length === 0}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all btn-glow"
                >
                  Add Webhook
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
