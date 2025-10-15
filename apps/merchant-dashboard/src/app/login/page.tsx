'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Wallet, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isLoading } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'login') {
        await login(email, walletAddress);
      } else {
        await register(businessName, email, walletAddress);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).solana) {
      try {
        const response = await (window as any).solana.connect();
        setWalletAddress(response.publicKey.toString());
      } catch (err) {
        setError('Failed to connect wallet');
      }
    } else {
      setError('Phantom wallet not found. Please install Phantom.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg animated-gradient">
      <div className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-10 h-10 text-primary-400" />
            <h1 className="text-4xl font-bold gradient-text">NinjaPay</h1>
          </div>
          <p className="text-muted-foreground">
            Confidential payments on Solana
          </p>
        </div>

        {/* Login/Register Card */}
        <div className="glass-card">
          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-dark-card rounded-lg mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                mode === 'login'
                  ? 'bg-primary-600 text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                mode === 'register'
                  ? 'bg-primary-600 text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  placeholder="Acme Corp"
                  required={mode === 'register'}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                placeholder="merchant@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-muted-foreground" />
                Solana Wallet
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="flex-1 px-4 py-3 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono text-sm"
                  placeholder="Wallet address"
                  required
                />
                <button
                  type="button"
                  onClick={connectWallet}
                  className="px-4 py-3 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg font-medium transition-all btn-glow"
                >
                  Connect
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all btn-glow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Features */}
          <div className="mt-6 pt-6 border-t border-dark-border">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Powered by
            </p>
            <div className="flex items-center justify-center gap-4 text-xs">
              <span className="px-3 py-1 bg-primary-500/10 text-primary-400 rounded-full">
                Arcium MPC
              </span>
              <span className="px-3 py-1 bg-secondary-500/10 text-secondary-400 rounded-full">
                MagicBlock
              </span>
              <span className="px-3 py-1 bg-accent-500/10 text-accent-400 rounded-full">
                Solana
              </span>
            </div>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-4 p-4 bg-dark-card/50 rounded-lg border border-dark-border">
          <p className="text-xs text-muted-foreground mb-2">Demo Credentials:</p>
          <p className="text-xs font-mono text-foreground">
            Email: demo@ninjapay.io
          </p>
          <p className="text-xs font-mono text-foreground">
            Wallet: Any Solana wallet address
          </p>
        </div>
      </div>
    </div>
  );
}
