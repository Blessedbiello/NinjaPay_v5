'use client';

import { WalletConnect } from '@/components/WalletConnect';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 animated-gradient opacity-20"></div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold gradient-text mb-4">
            NinjaPay Dashboard
          </h1>
          <p className="text-xl text-muted-foreground text-center">
            Connect your wallet to access the merchant dashboard
          </p>
        </div>

        {/* Wallet Connect */}
        <div className="mb-12">
          <WalletConnect />
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mb-12">
          <div className="glass-card text-center card-hover">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-500/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Privacy First</h3>
            <p className="text-sm text-muted-foreground">
              Encrypted amounts with Arcium MPC technology
            </p>
          </div>

          <div className="glass-card text-center card-hover">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary-500/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-secondary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground">
              Sub-50ms transactions with MagicBlock rollups
            </p>
          </div>

          <div className="glass-card text-center card-hover">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-500/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-accent-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Stripe-like API</h3>
            <p className="text-sm text-muted-foreground">
              Developer-friendly with comprehensive SDKs
            </p>
          </div>
        </div>

        {/* Info Link */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Looking for the public landing page?{' '}
            <a href="http://localhost:3000" className="text-primary-500 hover:text-primary-600">
              Visit NinjaPay.com
            </a>
          </p>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl">
          <div className="text-center">
            <div className="text-3xl font-bold gradient-text">95%</div>
            <div className="text-sm text-muted-foreground mt-1">
              Cost Savings
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold gradient-text">&lt;50ms</div>
            <div className="text-sm text-muted-foreground mt-1">Latency</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold gradient-text">100%</div>
            <div className="text-sm text-muted-foreground mt-1">Private</div>
          </div>
        </div>
      </div>
    </div>
  );
}
