'use client';

import Link from 'next/link';
import { ArrowRight, Shield, Lock, Zap } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-white -z-10" />

      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-ninja-purple/10 text-ninja-purple mb-8">
            <Shield className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Built on Solana with Arcium MPC</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
            Accept payments
            <br />
            <span className="text-gradient">with complete privacy</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto mb-10">
            The confidential payment infrastructure for the internet.
            Built for developers, designed for privacy.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              href="/signup"
              className="px-8 py-4 bg-ninja-gradient text-white rounded-lg font-medium hover:shadow-xl transition-all flex items-center group"
            >
              Start now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#developers"
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:border-ninja-purple hover:text-ninja-purple transition-all"
            >
              View documentation
            </Link>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-6 justify-center text-sm text-gray-600">
            <div className="flex items-center">
              <Lock className="w-5 h-5 text-ninja-purple mr-2" />
              <span>End-to-end encrypted</span>
            </div>
            <div className="flex items-center">
              <Zap className="w-5 h-5 text-ninja-purple mr-2" />
              <span>Instant settlements</span>
            </div>
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-ninja-purple mr-2" />
              <span>MPC-secured</span>
            </div>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-20 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10" />
          <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="bg-gray-950 rounded-lg p-6 font-mono text-sm">
                <div className="text-gray-500 mb-2">// Accept your first confidential payment</div>
                <div className="text-purple-400">const <span className="text-blue-400">payment</span> = await <span className="text-blue-400">ninjapay</span>.<span className="text-yellow-400">createPayment</span>({'{'}
                </div>
                <div className="ml-4 text-purple-400">amount: <span className="text-green-400">1000</span>,</div>
                <div className="ml-4 text-purple-400">currency: <span className="text-green-400">&apos;USDC&apos;</span>,</div>
                <div className="ml-4 text-purple-400">confidential: <span className="text-orange-400">true</span></div>
                <div className="text-purple-400">{'}'});</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
