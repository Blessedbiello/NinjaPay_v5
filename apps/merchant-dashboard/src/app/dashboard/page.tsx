'use client';

import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  CreditCard,
  Users,
  TrendingUp,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardMetrics {
  totalRevenue: string;
  transactionCount: number;
  customerCount: number;
  successRate: number;
  revenueGrowth: string;
  transactionGrowth: string;
  customerGrowth: string;
  recentPayments: any[];
}

export default function DashboardOverview() {
  const router = useRouter();
  const [showRevenue, setShowRevenue] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getAuthToken = useCallback(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem('auth_token');
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const token = getAuthToken();

        if (!token) {
          setErrorMessage('Authentication required. Please log in again.');
          return;
        }

        const response = await fetch('/api/v1/dashboard/metrics', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          setErrorMessage('Session expired. Please authenticate again.');
          return;
        }

        const data = await response.json();

        if (data.success) {
          setMetrics(data.data);
        } else {
          setErrorMessage('Unable to load dashboard metrics.');
        }
      } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        setErrorMessage('Unexpected error loading metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [getAuthToken]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Overview</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back to your confidential payment dashboard
          </p>
      </div>
      <button
        onClick={() => router.push('/dashboard/payment-links')}
        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all btn-glow flex items-center gap-2"
      >
        <DollarSign className="w-4 h-4" />
        Create Payment
      </button>
    </div>

      {errorMessage && (
        <div className="glass-card border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3">
          {errorMessage}
        </div>
      )}

      {/* Metrics Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="metric-card animate-pulse">
              <div className="h-12 w-12 bg-dark-border rounded-lg mb-4"></div>
              <div className="h-4 w-24 bg-dark-border rounded mb-2"></div>
              <div className="h-8 w-32 bg-dark-border rounded mb-2"></div>
              <div className="h-4 w-full bg-dark-border rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue - Privacy Adapted */}
          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary-400" />
              </div>
              <button
                onClick={() => setShowRevenue(!showRevenue)}
                className="p-2 rounded-lg hover:bg-primary-500/10 transition-colors"
              >
                {showRevenue ? (
                  <Eye className="w-4 h-4 text-primary-400" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              {showRevenue ? (
                <p className="text-3xl font-bold">${metrics?.totalRevenue || '0.00'}</p>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold">••••••</p>
                  <span className="encrypted-badge text-xs">Encrypted</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <ArrowUpRight className="w-4 h-4" />
                <span>+{metrics?.revenueGrowth || '0'}% from last month</span>
              </div>
            </div>
          </div>

          {/* Total Transactions */}
          <div className="metric-card">
            <div className="w-12 h-12 rounded-lg bg-secondary-500/20 flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6 text-secondary-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-3xl font-bold">{metrics?.transactionCount?.toLocaleString() || '0'}</p>
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <ArrowUpRight className="w-4 h-4" />
                <span>+{metrics?.transactionGrowth || '0'}% from last month</span>
              </div>
            </div>
          </div>

          {/* Active Customers */}
          <div className="metric-card">
            <div className="w-12 h-12 rounded-lg bg-accent-500/20 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-accent-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Active Customers</p>
              <p className="text-3xl font-bold">{metrics?.customerCount?.toLocaleString() || '0'}</p>
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <ArrowUpRight className="w-4 h-4" />
                <span>+{metrics?.customerGrowth || '0'}% from last month</span>
              </div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="metric-card">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-3xl font-bold">{metrics?.successRate || '0'}%</p>
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <ArrowUpRight className="w-4 h-4" />
                <span>Stable performance</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Revenue Overview</h3>
              <p className="text-sm text-muted-foreground">
                Last 7 days - Aggregated totals only
              </p>
            </div>
            <span className="encrypted-badge">Encrypted Amounts</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-500/20 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-primary-400" />
              </div>
              <p className="text-muted-foreground">
                Chart visualization coming soon
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Privacy-preserving analytics with aggregated data
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Volume */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Transaction Volume</h3>
              <p className="text-sm text-muted-foreground">
                Daily transaction count
              </p>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary-500/20 flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-secondary-400" />
              </div>
              <p className="text-muted-foreground">
                Chart visualization coming soon
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <p className="text-sm text-muted-foreground">
              Latest payment activity
            </p>
          </div>
          <button className="text-sm text-primary-400 hover:text-primary-300 font-medium">
            View all →
          </button>
        </div>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-lg bg-dark-card border border-dark-border animate-pulse">
                <div className="h-4 w-3/4 bg-dark-border rounded mb-2"></div>
                <div className="h-3 w-1/2 bg-dark-border rounded"></div>
              </div>
            ))}
          </div>
        ) : metrics?.recentPayments && metrics.recentPayments.length > 0 ? (
          <div className="space-y-4">
            {metrics.recentPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 rounded-lg bg-dark-card border border-dark-border hover:border-primary-500/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {payment.product?.name || `Payment ${payment.id.substring(0, 8)}...`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.customer?.email || `${payment.recipient.substring(0, 8)}...`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">
                        {payment.amountCommitment.substring(0, 8)}...
                      </span>
                      <span className="encrypted-badge text-xs">Encrypted</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    payment.status === 'CONFIRMED' ? 'status-success' :
                    payment.status === 'PENDING' ? 'status-pending' :
                    payment.status === 'FAILED' ? 'status-error' :
                    'bg-dark-border text-muted-foreground'
                  }`}>
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-border flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No transactions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first payment to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
