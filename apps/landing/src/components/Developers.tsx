'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

const codeExamples = {
  javascript: `// Install the SDK
npm install @ninjapay/sdk

// Initialize
import { NinjaPay } from '@ninjapay/sdk';
const ninjapay = new NinjaPay({ apiKey: process.env.NINJAPAY_KEY });

// Create a confidential payment
const payment = await ninjapay.payments.create({
  amount: 10000, // $100.00 in cents
  currency: 'USDC',
  confidential: true,
  customer: 'cust_abc123',
  description: 'Premium subscription'
});

console.log(payment.id); // payment_xyz789
console.log(payment.status); // 'pending'`,

  python: `# Install the SDK
pip install ninjapay

# Initialize
import ninjapay
ninjapay.api_key = os.environ.get('NINJAPAY_KEY')

# Create a confidential payment
payment = ninjapay.Payment.create(
    amount=10000,  # $100.00 in cents
    currency='USDC',
    confidential=True,
    customer='cust_abc123',
    description='Premium subscription'
)

print(payment.id)  # payment_xyz789
print(payment.status)  # 'pending'`,

  curl: `# Create a confidential payment
curl https://api.ninjapay.xyz/v1/payments \\
  -u YOUR_API_KEY: \\
  -d amount=10000 \\
  -d currency=USDC \\
  -d confidential=true \\
  -d customer=cust_abc123 \\
  -d description="Premium subscription"

# Response
{
  "id": "payment_xyz789",
  "amount_commitment": "encrypted_data_here",
  "currency": "USDC",
  "status": "pending",
  "confidential": true
}`,
};

export function Developers() {
  const [activeTab, setActiveTab] = useState<keyof typeof codeExamples>('javascript');
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(codeExamples[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="developers" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Info */}
          <div className="text-white">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Built for developers
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Get started in minutes with our developer-friendly APIs and SDKs.
              Full TypeScript support, webhooks, and detailed documentation.
            </p>

            <div className="space-y-4 mb-8">
              {[
                'RESTful API with comprehensive endpoints',
                'Official SDKs for JavaScript, Python, and more',
                'Webhook support for real-time events',
                'Test mode for safe development',
                'Detailed API reference and guides',
              ].map((item, index) => (
                <div key={index} className="flex items-center">
                  <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300">{item}</span>
                </div>
              ))}
            </div>

            <a
              href="https://docs.ninjapay.xyz"
              className="inline-flex items-center px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:shadow-xl transition-all"
            >
              Read the docs
            </a>
          </div>

          {/* Right: Code Example */}
          <div className="bg-gray-950 rounded-xl overflow-hidden shadow-2xl border border-gray-800">
            {/* Tabs */}
            <div className="flex border-b border-gray-800 bg-gray-900/50">
              {Object.keys(codeExamples).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveTab(lang as keyof typeof codeExamples)}
                  className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === lang
                      ? 'text-white border-b-2 border-ninja-purple'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {lang === 'javascript' ? 'Node.js' : lang === 'python' ? 'Python' : 'cURL'}
                </button>
              ))}

              <button
                onClick={copyCode}
                className="ml-auto px-4 py-3 text-gray-400 hover:text-white transition-colors"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Code */}
            <pre className="p-6 overflow-x-auto">
              <code className="text-sm text-gray-300 font-mono">
                {codeExamples[activeTab]}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
