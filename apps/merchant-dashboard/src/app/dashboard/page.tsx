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
import { useState } from 'react';

export default function DashboardOverview() {
  const [showRevenue, setShowRevenue] = useState(false);

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
        <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all btn-glow flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Create Payment
        </button>
      </div>

      {/* Metrics Grid */}
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
              <p className="text-3xl font-bold">$24,567.89</p>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold">••••••</p>
                <span className="encrypted-badge text-xs">Encrypted</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              <span>+12.5% from last month</span>
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
            <p className="text-3xl font-bold">1,284</p>
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              <span>+8.2% from last month</span>
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
            <p className="text-3xl font-bold">847</p>
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              <span>+15.3% from last month</span>
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
            <p className="text-3xl font-bold">98.7%</p>
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              <span>+0.4% from last month</span>
            </div>
          </div>
        </div>
      </div>

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
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-lg bg-dark-card border border-dark-border hover:border-primary-500/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">Payment #{1000 + i}</p>
                  <p className="text-sm text-muted-foreground">
                    customer@example.com
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">
                      0x8c3d...
                    </span>
                    <span className="encrypted-badge text-xs">Encrypted</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    2 hours ago
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium status-success">
                  Confirmed
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
