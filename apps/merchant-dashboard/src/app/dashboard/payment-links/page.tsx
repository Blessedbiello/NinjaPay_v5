'use client';

import { useState } from 'react';
import {
  Plus,
  Link2,
  Copy,
  ExternalLink,
  MoreVertical,
  Eye,
  EyeOff,
  QrCode,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

// Mock data
const mockLinks = [
  {
    id: 'link_abc123',
    url: 'https://pay.ninjapay.xyz/web3-course',
    productName: 'Web3 Development Course',
    description: 'Complete Solana smart contract course',
    amount: 299.99,
    currency: 'USDC',
    active: true,
    views: 1247,
    conversions: 45,
    revenue: 13499.55,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'link_def456',
    url: 'https://pay.ninjapay.xyz/nft-template',
    productName: 'NFT Marketplace Template',
    description: 'Ready-to-deploy NFT marketplace',
    amount: 499.99,
    currency: 'USDC',
    active: true,
    views: 856,
    conversions: 23,
    revenue: 11499.77,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'link_ghi789',
    url: 'https://pay.ninjapay.xyz/defi-audit',
    productName: 'DeFi Protocol Audit',
    description: 'Professional security audit',
    amount: 2999.99,
    currency: 'USDC',
    active: false,
    views: 342,
    conversions: 8,
    revenue: 23999.92,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
  },
];

export default function PaymentLinksPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalViews = mockLinks.reduce((acc, link) => acc + link.views, 0);
  const totalConversions = mockLinks.reduce((acc, link) => acc + link.conversions, 0);
  const totalRevenue = mockLinks.reduce((acc, link) => acc + link.revenue, 0);
  const conversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Payment Links</h1>
          <p className="text-muted-foreground mt-1">
            Create no-code payment links to share anywhere
          </p>
        </div>
        <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all btn-glow flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Link
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Links</p>
              <p className="text-2xl font-bold">{mockLinks.length}</p>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-secondary-500/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-secondary-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center">
              <span className="text-lg font-bold text-accent-400">%</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <p className="text-2xl font-bold">{conversionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <span className="text-lg font-bold text-green-400">$</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="glass p-4 rounded-lg border-l-4 border-secondary-500">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary-500/20 flex items-center justify-center flex-shrink-0">
            <Link2 className="w-5 h-5 text-secondary-400" />
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">No-Code Payment Links</h4>
            <p className="text-sm text-muted-foreground">
              Share payment links on social media, email, or anywhere. No coding required.
              All payments are confidential with Arcium MPC encryption.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Links */}
      <div className="space-y-4">
        {mockLinks.map((link) => (
          <div key={link.id} className="glass-card card-hover">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
                <Link2 className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{link.productName}</h3>
                      {link.active ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {link.description}
                    </p>

                    {/* URL */}
                    <div className="flex items-center gap-2 p-2 bg-dark-card rounded-lg">
                      <span className="font-mono text-xs text-muted-foreground truncate flex-1">
                        {link.url}
                      </span>
                      <button
                        onClick={() => copyToClipboard(link.url, link.id)}
                        className="p-1 hover:bg-primary-500/10 rounded transition-colors flex-shrink-0"
                      >
                        {copiedId === link.id ? (
                          <span className="text-xs text-green-400">Copied!</span>
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                      <button className="p-1 hover:bg-primary-500/10 rounded transition-colors flex-shrink-0">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-1 hover:bg-primary-500/10 rounded transition-colors flex-shrink-0">
                        <QrCode className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  <button className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors flex-shrink-0">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-5 gap-4 pt-3 border-t border-dark-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-semibold">{formatCurrency(link.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Views</p>
                    <p className="font-semibold">{link.views.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Conversions</p>
                    <p className="font-semibold">{link.conversions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="font-semibold">{formatCurrency(link.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="font-semibold text-xs">
                      {formatDate(link.createdAt).split(',')[0]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {mockLinks.length === 0 && (
        <div className="glass-card text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-500/20 flex items-center justify-center">
            <Link2 className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No payment links yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first no-code payment link to start accepting payments
          </p>
          <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all btn-glow">
            Create Link
          </button>
        </div>
      )}
    </div>
  );
}
