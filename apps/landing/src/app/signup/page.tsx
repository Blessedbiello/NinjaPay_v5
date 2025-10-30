'use client';

import Link from 'next/link';
import { ArrowRight, Check, Wallet, Shield, Zap, TrendingUp } from 'lucide-react';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-ninja-purple/10 text-ninja-purple mb-6">
            <Shield className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Merchant Onboarding</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
            Start accepting
            <br />
            <span className="text-gradient">private payments</span>
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join NinjaPay and start accepting encrypted payments in minutes.
            No KYC required to start, just connect your wallet.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-ninja-purple/10 rounded-lg flex items-center justify-center mb-4">
              <Wallet className="w-6 h-6 text-ninja-purple" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Connect Your Wallet
            </h3>
            <p className="text-gray-600">
              Simply connect your Solana wallet to get started. No email, no password, just your wallet.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-ninja-purple/10 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-ninja-purple" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Create Payment Links
            </h3>
            <p className="text-gray-600">
              Generate encrypted payment links in seconds. Share with customers via any channel.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-ninja-purple/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-ninja-purple" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Privacy by Default
            </h3>
            <p className="text-gray-600">
              All payment amounts are encrypted with Arcium MPC. Your revenue stays confidential.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-ninja-purple/10 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-ninja-purple" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Track Revenue
            </h3>
            <p className="text-gray-600">
              Real-time dashboard showing payments, conversions, and revenue analytics.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Get Started in 3 Steps
          </h2>

          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-ninja-gradient text-white rounded-full flex items-center justify-center font-bold mr-4">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Connect Your Wallet</h3>
                <p className="text-gray-600">Use Phantom, Solflare, or any Solana wallet to authenticate</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-ninja-gradient text-white rounded-full flex items-center justify-center font-bold mr-4">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Create Your First Product</h3>
                <p className="text-gray-600">Add product details, pricing, and generate a payment link</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-ninja-gradient text-white rounded-full flex items-center justify-center font-bold mr-4">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Start Accepting Payments</h3>
                <p className="text-gray-600">Share your link and receive encrypted payments instantly</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="http://localhost:3001?onboarding=true"
            className="inline-flex items-center px-10 py-5 bg-ninja-gradient text-white text-lg rounded-xl font-semibold hover:shadow-2xl transition-all group"
          >
            Go to Merchant Dashboard
            <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </a>

          <p className="mt-6 text-sm text-gray-500">
            Already have an account?{' '}
            <a href="http://localhost:3001" className="text-ninja-purple font-medium hover:underline">
              Sign in →
            </a>
          </p>
        </div>

        {/* Trust Badge */}
        <div className="mt-12 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              <span>Solana mainnet</span>
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              <span>Arcium MPC secured</span>
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              <span>No fees to start</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
