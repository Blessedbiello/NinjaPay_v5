'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for testing and small projects',
    features: [
      'Up to 100 transactions/month',
      'Test mode unlimited',
      'Basic analytics',
      'Email support',
      'Standard encryption',
    ],
    cta: 'Start free',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$49',
    period: '/month',
    description: 'For growing businesses',
    features: [
      'Unlimited transactions',
      '1.5% + $0.30 per transaction',
      'Advanced analytics',
      'Priority support',
      'MPC encryption',
      'Custom webhooks',
      'Batch payroll processing',
    ],
    cta: 'Get started',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large-scale operations',
    features: [
      'Volume discounts',
      'Dedicated account manager',
      '24/7 phone support',
      'Custom SLAs',
      'White-label options',
      'Advanced compliance tools',
      'Custom integration support',
    ],
    cta: 'Contact sales',
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start free, scale as you grow. No hidden fees, no surprises.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-2xl p-8 ${
                plan.highlighted
                  ? 'bg-ninja-gradient text-white shadow-2xl scale-105'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className="mb-8">
                <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <p className={`mb-4 ${plan.highlighted ? 'text-white/90' : 'text-gray-600'}`}>
                  {plan.description}
                </p>
                <div className="flex items-baseline">
                  <span className={`text-5xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={`ml-2 ${plan.highlighted ? 'text-white/80' : 'text-gray-600'}`}>
                      {plan.period}
                    </span>
                  )}
                </div>
              </div>

              <Link
                href="/signup"
                className={`block w-full py-3 px-6 rounded-lg font-medium text-center mb-8 transition-all ${
                  plan.highlighted
                    ? 'bg-white text-ninja-purple hover:shadow-xl'
                    : 'bg-ninja-gradient text-white hover:shadow-lg'
                }`}
              >
                {plan.cta}
              </Link>

              <ul className="space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check
                      className={`w-5 h-5 mr-3 flex-shrink-0 ${
                        plan.highlighted ? 'text-white' : 'text-ninja-purple'
                      }`}
                    />
                    <span className={plan.highlighted ? 'text-white/90' : 'text-gray-600'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Note */}
        <p className="text-center text-gray-600 mt-12">
          All plans include bank-level security, instant settlements, and USDC support.
        </p>
      </div>
    </section>
  );
}
