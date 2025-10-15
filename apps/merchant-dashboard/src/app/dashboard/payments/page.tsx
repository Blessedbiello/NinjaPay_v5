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

// Mock data
const mockPayments = [
  {
    id: 'pay_abc123',
    customer: 'alice@example.com',
    amountCommitment: '0x8c3d4f2a1b9e',
    currency: 'USDC',
    status: 'confirmed',
    txSignature: '5Jx8...kL9p',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'pay_def456',
    customer: 'bob@startup.io',
    amountCommitment: '0x7a2b5c8d3e1f',
    currency: 'USDC',
    status: 'pending',
    txSignature: null,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: 'pay_ghi789',
    customer: 'carol@dao.xyz',
    amountCommitment: '0x9f1e4d7b2c5a',
    currency: 'USDC',
    status: 'finalized',
    txSignature: '3Kp7...mN2q',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'pay_jkl012',
    customer: 'dave@protocol.com',
    amountCommitment: '0x6e3c8f1a4b7d',
    currency: 'USDC',
    status: 'failed',
    txSignature: null,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'pay_mno345',
    customer: 'eve@defi.app',
    amountCommitment: '0x5d2f9e4c1b8a',
    currency: 'USDC',
    status: 'confirmed',
    txSignature: '8Mn4...pQ6r',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [revealedAmounts, setRevealedAmounts] = useState<Set<string>>(
    new Set()
  );

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
      <div className="glass-card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by ID, customer email, or commitment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-dark-card border border-dark-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg border border-dark-border hover:border-primary-500/30 transition-all flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filter</span>
            </button>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary-500 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="glass p-4 rounded-lg border-l-4 border-primary-500">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
            <Eye className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">
              Privacy-Preserving Payments
            </h4>
            <p className="text-sm text-muted-foreground">
              All payment amounts are encrypted using Arcium MPC. Click the eye
              icon to decrypt and reveal individual amounts. Only you can see
              the plaintext values.
            </p>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-dark-border">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">
                  Payment ID
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">
                  Customer
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">
                  Amount
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">
                  Date
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {mockPayments.map((payment) => {
                const isRevealed = revealedAmounts.has(payment.id);
                return (
                  <tr
                    key={payment.id}
                    className="border-b border-dark-border hover:bg-primary-500/5 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {payment.id}
                        </span>
                        <button
                          onClick={() => copyToClipboard(payment.id)}
                          className="p-1 hover:bg-primary-500/10 rounded transition-colors"
                        >
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm">{payment.customer}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {isRevealed ? (
                          <span className="font-semibold">
                            $
                            {(Math.random() * 1000 + 50).toFixed(2)}
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">
                              {payment.amountCommitment.slice(0, 12)}...
                            </span>
                            <span className="encrypted-badge text-xs">
                              Encrypted
                            </span>
                          </div>
                        )}
                        <button
                          onClick={() => toggleReveal(payment.id)}
                          className="p-1 hover:bg-primary-500/10 rounded transition-colors"
                        >
                          {isRevealed ? (
                            <EyeOff className="w-4 h-4 text-primary-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={cn(
                          'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                          getStatusColor(payment.status)
                        )}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(payment.createdAt)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {payment.txSignature && (
                          <button className="p-2 hover:bg-primary-500/10 rounded transition-colors">
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-dark-border">
          <p className="text-sm text-muted-foreground">
            Showing 5 of 1,284 payments
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg border border-dark-border hover:border-primary-500/30 text-sm transition-all">
              Previous
            </button>
            <button className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm transition-all">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
