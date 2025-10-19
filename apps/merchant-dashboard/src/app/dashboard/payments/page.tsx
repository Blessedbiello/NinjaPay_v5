'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { cn, formatDate, getStatusColor } from '@/lib/utils';
import { usePaymentIntents } from '@/hooks/useApi';

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [revealedAmounts, setRevealedAmounts] = useState<Set<string>>(
    new Set()
  );

  // Use real API instead of mock data
  const { items: payments, loading, error, refetch } = usePaymentIntents({
    limit: 50,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    decrypt: true, // Always request decrypted amounts
  });

  const toggleReveal = (paymentId: string) => {
    setRevealedAmounts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
      } else {
        newSet.add(paymentId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Filter payments by search query
  const filteredPayments = payments.filter((payment) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      payment.id.toLowerCase().includes(query) ||
      payment.customer?.email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Payments</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all your confidential transactions
          </p>
        </div>
        <button className="px-4 py-2 glass border border-primary-500/30 hover:border-primary-500/60 text-foreground rounded-lg font-medium transition-all flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="glass p-4 rounded-lg border border-border-light">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search payments..."
              className="w-full pl-10 pr-4 py-2 bg-background border border-border-light rounded-lg focus:outline-none focus:border-primary-500/50 transition-colors text-foreground placeholder-muted-foreground"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              className="px-4 py-2 bg-background border border-border-light rounded-lg focus:outline-none focus:border-primary-500/50 transition-colors text-foreground"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="FINALIZED">Finalized</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="glass p-8 rounded-lg border border-border-light text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading payments...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="glass p-4 rounded-lg border border-red-500/30 bg-red-500/5">
          <p className="text-red-400">Error: {error}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Payments Table */}
      {!loading && !error && (
        <div className="glass rounded-lg border border-border-light overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-light bg-background/50">
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Payment ID
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Customer
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      No payments found. Create your first payment to get started.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-border-light hover:bg-background/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="text-sm text-primary-400">
                            {payment.id.substring(0, 12)}...
                          </code>
                          <button
                            onClick={() => copyToClipboard(payment.id)}
                            className="p-1 hover:bg-background rounded transition-colors"
                          >
                            <Copy className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-foreground">
                          {payment.customer?.email || payment.customer?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {revealedAmounts.has(payment.id) ? (
                            <>
                              <span className="text-sm font-medium text-foreground">
                                {payment.amount !== null
                                  ? `${(payment.amount / 100).toFixed(2)} ${payment.currency}`
                                  : 'Encrypted'}
                              </span>
                              <button
                                onClick={() => toggleReveal(payment.id)}
                                className="p-1 hover:bg-background rounded transition-colors"
                              >
                                <EyeOff className="w-3 h-3 text-muted-foreground" />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-sm font-mono text-primary-400">
                                {payment.amountCommitment?.substring(0, 14) || '••••••••'}
                              </span>
                              <button
                                onClick={() => toggleReveal(payment.id)}
                                className="p-1 hover:bg-background rounded transition-colors"
                              >
                                <Eye className="w-3 h-3 text-muted-foreground" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            getStatusColor(payment.status)
                          )}
                        >
                          {payment.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(new Date(payment.createdAt))}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 hover:bg-background rounded-lg transition-colors">
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
