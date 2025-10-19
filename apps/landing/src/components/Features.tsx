'use client';

import { Shield, Lock, Zap, Code2, Globe, BarChart3 } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'MPC-Powered Security',
    description: 'Built on Arcium\'s Multi-Party Computation network. Your payment data never exists unencrypted in one place.',
  },
  {
    icon: Lock,
    title: 'Complete Privacy',
    description: 'Payment amounts, sender, and recipient data are encrypted end-to-end. Only authorized parties can decrypt.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Settle payments in seconds on Solana. No waiting for confirmations or intermediary processors.',
  },
  {
    icon: Code2,
    title: 'Developer First',
    description: 'Clean REST APIs, TypeScript SDKs, and comprehensive documentation. Get started in minutes.',
  },
  {
    icon: Globe,
    title: 'Global by Default',
    description: 'Accept payments from anyone, anywhere. Native USDC support with instant cross-border settlements.',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'Track your confidential transactions with our secure dashboard. Decrypt amounts only when you need them.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Privacy-first payments
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to accept confidential payments, built with security and privacy at the core.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-8 rounded-2xl border border-gray-200 hover:border-ninja-purple hover:shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-ninja-purple/10 flex items-center justify-center mb-6 group-hover:bg-ninja-purple group-hover:scale-110 transition-all">
                  <Icon className="w-6 h-6 text-ninja-purple group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
