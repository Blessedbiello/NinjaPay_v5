'use client';

import { useState, useEffect } from 'react';
import { Receipt, ArrowUpRight, ArrowDownLeft, Shield, ExternalLink, Copy } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'sent' | 'received';
  address: string;
  amount: string;
  currency: string;
  status: string;
  description?: string;
  txSignature?: string;
  date: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, totalSent: 0, totalReceived: 0 });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/wallet/transactions?limit=50');
      const data = await response.json();
      if (data.success) {
        setTransactions(data.data.transactions);
        setStats({
          total: data.data.total,
          totalSent: data.data.totalSent,
          totalReceived: data.data.totalReceived,
        });
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const shortenAddress = (address: string) => {
    if (!address || address.length < 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'finalized':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'failed':
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Transactions</h1>
            <p className="text-muted-foreground">
              View your transaction history
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {!loading && stats.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card">
            <p className="text-sm text-muted-foreground mb-1">Total Transactions</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="glass-card">
            <p className="text-sm text-muted-foreground mb-1">Sent</p>
            <p className="text-2xl font-bold text-red-400">{stats.totalSent}</p>
          </div>
          <div className="glass-card">
            <p className="text-sm text-muted-foreground mb-1">Received</p>
            <p className="text-2xl font-bold text-green-400">{stats.totalReceived}</p>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="glass-card bg-secondary-500/5 border-secondary-500/20">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-secondary-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-secondary-400 mb-1">
              Privacy Protected
            </h3>
            <p className="text-sm text-muted-foreground">
              All transaction amounts are encrypted with Arcium MPC. Only you can see the actual values.
            </p>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="glass-card">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 rounded-lg bg-dark-card border border-dark-border animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-dark-border"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-dark-border rounded"></div>
                    <div className="h-3 w-1/2 bg-dark-border rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-dark-card border border-dark-border hover:border-secondary-500/50 transition-all"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'sent'
                      ? 'bg-red-500/20'
                      : 'bg-green-500/20'
                  }`}
                >
                  {tx.type === 'sent' ? (
                    <ArrowUpRight className="w-5 h-5 text-red-400" />
                  ) : (
                    <ArrowDownLeft className="w-5 h-5 text-green-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-semibold truncate">
                        {tx.type === 'sent' ? 'Sent to' : 'Received from'}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-sm text-muted-foreground">
                          {shortenAddress(tx.address)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(tx.address)}
                          className="p-1 hover:bg-dark-border rounded transition-colors"
                        >
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    <p
                      className={`text-lg font-bold whitespace-nowrap ${
                        tx.type === 'sent' ? 'text-red-400' : 'text-green-400'
                      }`}
                    >
                      {tx.type === 'sent' ? '-' : '+'}
                      {parseFloat(tx.amount).toFixed(2)} {tx.currency}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground gap-4">
                    <div className="flex items-center gap-3">
                      <span>{new Date(tx.date).toLocaleDateString()}</span>
                      {tx.description && (
                        <span className="truncate max-w-xs">{tx.description}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                      {tx.txSignature && (
                        <a
                          href={`https://explorer.solana.com/tx/${tx.txSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-dark-border rounded transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-2">No transactions yet</p>
            <p className="text-sm text-muted-foreground">
              Send or receive payments to see them here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
