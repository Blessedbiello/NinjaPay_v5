'use client';

import { useState, useEffect } from 'react';
import { Send, ArrowRight, Wallet, Shield, CheckCircle, XCircle, DollarSign } from 'lucide-react';

interface WalletBalance {
  walletAddress: string;
  balances: {
    SOL: number;
    USDC: number;
    USDT: number;
  };
}

export default function SendMoneyPage() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USDC');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    setLoadingBalance(true);
    try {
      const response = await fetch('/api/v1/wallet/balance');
      const data = await response.json();
      if (data.success) {
        setBalance(data.data);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/v1/wallet/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          amount: parseFloat(amount),
          currency,
          description: note,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(`Payment sent successfully! Transaction ID: ${data.data.paymentIntent.id.substring(0, 12)}...`);
        setRecipient('');
        setAmount('');
        setNote('');
        await fetchBalance();
      } else {
        setErrorMessage(data.error?.message || 'Failed to send payment');
      }
    } catch (error: any) {
      console.error('Error sending payment:', error);
      setErrorMessage(error.message || 'Failed to send payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center">
          <Send className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold gradient-text">Send Money</h1>
          <p className="text-muted-foreground">
            Send confidential payments on Solana
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="glass-card bg-green-500/10 border-green-500/30 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <p className="text-green-400">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="glass-card bg-red-500/10 border-red-500/30 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{errorMessage}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Send Form */}
        <div className="lg:col-span-2">
          <div className="glass-card">
            <form onSubmit={handleSend} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                  Recipient Wallet Address
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 transition-all font-mono text-sm"
                  placeholder="Enter Solana wallet address"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Amount</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 transition-all text-xl font-semibold"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 transition-all"
                  >
                    <option value="USDC">USDC</option>
                    <option value="USDT">USDT</option>
                    <option value="SOL">SOL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Note (Optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 transition-all resize-none"
                  rows={3}
                  placeholder="Add a note..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-secondary-600 hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all btn-glow flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                {loading ? 'Sending...' : 'Send Payment'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>
          </div>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          {/* Balance Card */}
          <div className="glass-card">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-primary-400" />
              <h3 className="font-semibold">Your Balance</h3>
            </div>
            {loadingBalance ? (
              <div className="space-y-2">
                <div className="h-6 bg-dark-border rounded animate-pulse"></div>
                <div className="h-6 bg-dark-border rounded animate-pulse"></div>
                <div className="h-6 bg-dark-border rounded animate-pulse"></div>
              </div>
            ) : balance ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">USDC</span>
                  <span className="font-semibold">{balance.balances.USDC.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">USDT</span>
                  <span className="font-semibold">{balance.balances.USDT.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">SOL</span>
                  <span className="font-semibold">{balance.balances.SOL.toFixed(4)}</span>
                </div>
                <div className="pt-3 border-t border-dark-border">
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {balance.walletAddress.substring(0, 20)}...
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Failed to load balance</p>
            )}
          </div>

          {/* Privacy Info */}
          <div className="glass-card">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-secondary-400" />
              <h3 className="font-semibold text-secondary-400">Privacy Protection</h3>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                All payment amounts are encrypted using Arcium MPC technology
              </p>
              <p>
                Transaction details are only visible to sender and receiver
              </p>
              <p>
                Fast settlement on Solana network
              </p>
            </div>
          </div>

          {/* Recent Recipients */}
          <div className="glass-card">
            <h3 className="font-semibold mb-3">Recent Recipients</h3>
            <p className="text-sm text-muted-foreground">
              No recent recipients yet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
