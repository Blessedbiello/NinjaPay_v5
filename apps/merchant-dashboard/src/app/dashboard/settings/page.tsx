'use client';

import { useState } from 'react';
import {
  User,
  Building2,
  Mail,
  Wallet,
  Shield,
  Bell,
  Globe,
  Key,
  Trash2,
  Save,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

// Mock data
const mockMerchant = {
  id: 'merchant_abc123',
  businessName: 'Acme Corp',
  email: 'merchant@acme.com',
  walletAddress: '7xJ8kL9pMnQ2rStU3vWxYz5aBcDeFgHiJkLmNoPqRsTu',
  kycStatus: 'verified',
  kycCompletedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
  businessType: 'Software',
  country: 'United States',
  website: 'https://acme.com',
  webhookUrl: 'https://api.acme.com/webhooks/ninjapay',
  successRedirectUrl: 'https://acme.com/payment/success',
  cancelRedirectUrl: 'https://acme.com/payment/cancel',
  emailNotifications: true,
  webhookNotifications: true,
  securityAlerts: true,
  createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
};

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(
    mockMerchant.emailNotifications
  );
  const [webhookNotifications, setWebhookNotifications] = useState(
    mockMerchant.webhookNotifications
  );
  const [securityAlerts, setSecurityAlerts] = useState(
    mockMerchant.securityAlerts
  );

  const handleSave = async () => {
    setSaving(true);
    // TODO: Call API to save settings
    setTimeout(() => setSaving(false), 1000);
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and business preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all btn-glow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Business Profile */}
      <div className="glass-card">
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="w-5 h-5 text-primary-400" />
          <h2 className="text-xl font-semibold">Business Profile</h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Business Name
              </label>
              <input
                type="text"
                defaultValue={mockMerchant.businessName}
                className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Business Type
              </label>
              <select className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                <option value="software">Software</option>
                <option value="ecommerce">E-commerce</option>
                <option value="services">Services</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email
              </label>
              <input
                type="email"
                defaultValue={mockMerchant.email}
                className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                Website
              </label>
              <input
                type="url"
                defaultValue={mockMerchant.website}
                className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Country</label>
            <select
              defaultValue={mockMerchant.country}
              className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            >
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Canada">Canada</option>
              <option value="Germany">Germany</option>
              <option value="Singapore">Singapore</option>
            </select>
          </div>
        </div>
      </div>

      {/* Wallet & KYC */}
      <div className="glass-card">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-secondary-400" />
          <h2 className="text-xl font-semibold">Wallet & Verification</h2>
        </div>

        <div className="space-y-4">
          {/* Wallet Address */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              Solana Wallet Address
            </label>
            <div className="flex items-center gap-2 p-3 bg-dark-card border border-dark-border rounded-lg">
              <span className="font-mono text-sm flex-1 truncate">
                {mockMerchant.walletAddress}
              </span>
              <button className="p-2 hover:bg-primary-500/10 rounded transition-colors flex-shrink-0">
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This wallet receives all payments from customers
            </p>
          </div>

          {/* KYC Status */}
          <div className="p-4 bg-dark-card border border-dark-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Key className="w-4 h-4" />
                KYC Status
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border ${getKycStatusColor(
                  mockMerchant.kycStatus
                )}`}
              >
                {mockMerchant.kycStatus === 'verified' && (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </span>
                )}
                {mockMerchant.kycStatus === 'pending' && (
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Pending Review
                  </span>
                )}
              </span>
            </div>

            {mockMerchant.kycStatus === 'verified' ? (
              <div className="text-sm text-muted-foreground">
                <p>
                  Your account was verified on{' '}
                  {mockMerchant.kycCompletedAt.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="mt-1">
                  You can now accept payments up to $100,000/month
                </p>
              </div>
            ) : (
              <div className="mt-3">
                <button className="w-full md:w-auto px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg font-medium transition-all btn-glow">
                  Complete KYC Verification
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Integration Settings */}
      <div className="glass-card">
        <div className="flex items-center gap-2 mb-6">
          <Globe className="w-5 h-5 text-accent-400" />
          <h2 className="text-xl font-semibold">Integration Settings</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              defaultValue={mockMerchant.webhookUrl}
              placeholder="https://api.example.com/webhooks/ninjapay"
              className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              We'll send payment events to this URL
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Success Redirect URL
              </label>
              <input
                type="url"
                defaultValue={mockMerchant.successRedirectUrl}
                placeholder="https://example.com/payment/success"
                className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Cancel Redirect URL
              </label>
              <input
                type="url"
                defaultValue={mockMerchant.cancelRedirectUrl}
                placeholder="https://example.com/payment/cancel"
                className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="w-5 h-5 text-primary-400" />
          <h2 className="text-xl font-semibold">Notifications</h2>
        </div>

        <div className="space-y-4">
          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 bg-dark-card border border-dark-border rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Email Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Receive email updates about payments and account activity
              </p>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                emailNotifications ? 'bg-primary-600' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  emailNotifications ? 'translate-x-6' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>

          {/* Webhook Notifications */}
          <div className="flex items-center justify-between p-4 bg-dark-card border border-dark-border rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Webhook Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Send real-time events to your webhook endpoint
              </p>
            </div>
            <button
              onClick={() => setWebhookNotifications(!webhookNotifications)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                webhookNotifications ? 'bg-primary-600' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  webhookNotifications ? 'translate-x-6' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>

          {/* Security Alerts */}
          <div className="flex items-center justify-between p-4 bg-dark-card border border-dark-border rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Security Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Get notified about suspicious activity and security issues
              </p>
            </div>
            <button
              onClick={() => setSecurityAlerts(!securityAlerts)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                securityAlerts ? 'bg-primary-600' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  securityAlerts ? 'translate-x-6' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card border-red-500/20">
        <div className="flex items-center gap-2 mb-6">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h2 className="text-xl font-semibold text-red-400">Danger Zone</h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-red-400 mb-1">
                  Delete Account
                </h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your merchant account and all associated
                  data. This action cannot be undone.
                </p>
              </div>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 flex-shrink-0">
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Account created on {mockMerchant.createdAt.toLocaleDateString()}</p>
            <p className="mt-1">Merchant ID: {mockMerchant.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
