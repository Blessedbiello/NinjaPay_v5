'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Link2,
  Copy,
  ExternalLink,
  MoreVertical,
  Trash2,
  Eye,
  EyeOff,
  QrCode,
  X,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useProducts } from '@/hooks/useApi';

export default function PaymentLinksPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedLinkUrl, setSelectedLinkUrl] = useState('');
  const [paymentLinks, setPaymentLinks] = useState<any[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    productId: '',
    customUrl: '',
    maxUses: '',
    expiresAt: '',
    description: '',
  });
  const isMountedRef = useRef(true);
  const {
    items: products,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useProducts({ limit: 100 });

  const getAuthToken = useCallback(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem('auth_token');
  }, []);

  const fetchPaymentLinks = useCallback(async () => {
    const token = getAuthToken();

    if (!token) {
      console.error('Missing auth token for payment links request');
      if (isMountedRef.current) {
        setLoadingLinks(false);
      }
      return;
    }

    if (isMountedRef.current) {
      setLoadingLinks(true);
    }

    try {
      const response = await fetch('/api/v1/payment_links', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!isMountedRef.current) {
        return;
      }

      if (data.success) {
        setPaymentLinks(data.data.items);
      } else {
        console.error('Error fetching payment links:', data.error);
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error('Error fetching payment links:', error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingLinks(false);
      }
    }
  }, [getAuthToken]);

  useEffect(() => {
    fetchPaymentLinks();
  }, [fetchPaymentLinks]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const showQrCode = (url: string) => {
    setSelectedLinkUrl(url);
    setShowQrModal(true);
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = getAuthToken();

      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch('/api/v1/payment_links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: formData.productId,
          customUrl: formData.customUrl || undefined,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
          expiresAt: formData.expiresAt || undefined,
          description: formData.description || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        setFormData({
          productId: '',
          customUrl: '',
          maxUses: '',
          expiresAt: '',
          description: '',
        });
        await Promise.all([fetchPaymentLinks(), refetchProducts()]);
      } else {
        alert('Error: ' + data.error.message);
      }
    } catch (error) {
      console.error('Error creating payment link:', error);
      alert('Failed to create payment link');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLink = async (id: string, name: string) => {
    if (!confirm(`Delete payment link "${name}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(id);

    try {
      const token = getAuthToken();

      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`/api/v1/payment_links/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        await fetchPaymentLinks();
      } else {
        alert(data.error?.message || 'Failed to delete payment link');
      }
    } catch (error) {
      console.error('Error deleting payment link:', error);
      alert('Failed to delete payment link');
    } finally {
      setDeletingId(null);
    }
  };

  const totalViews = paymentLinks.reduce((acc, link) => acc + (link.views || 0), 0);
  const totalConversions = paymentLinks.reduce((acc, link) => acc + (link.conversions || 0), 0);
  const totalRevenue = paymentLinks.reduce((acc, link) => acc + (link.revenue || 0), 0);
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
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all btn-glow flex items-center gap-2"
        >
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
              <p className="text-2xl font-bold">{paymentLinks.length}</p>
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
        {loadingLinks ? (
          <div className="glass-card text-center py-12">
            <p className="text-muted-foreground">Loading payment links...</p>
          </div>
        ) : paymentLinks.map((link) => (
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
                        title="Copy link"
                      >
                        {copiedId === link.id ? (
                          <span className="text-xs text-green-400">Copied!</span>
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={() => openInNewTab(link.url)}
                        className="p-1 hover:bg-primary-500/10 rounded transition-colors flex-shrink-0"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => showQrCode(link.url)}
                        className="p-1 hover:bg-primary-500/10 rounded transition-colors flex-shrink-0"
                        title="Show QR code"
                      >
                        <QrCode className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteLink(link.id, link.productName)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0 text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={deletingId === link.id}
                      title="Delete payment link"
                    >
                      {deletingId === link.id ? (
                        <span className="text-xs">Deleting...</span>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                    <button className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors flex-shrink-0">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-5 gap-4 pt-3 border-t border-dark-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-semibold">{formatCurrency(link.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Views</p>
                    <p className="font-semibold">{(link.views || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Conversions</p>
                    <p className="font-semibold">{link.conversions || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="font-semibold">{formatCurrency(link.revenue || 0)}</p>
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
      {!loadingLinks && paymentLinks.length === 0 && (
        <div className="glass-card text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-500/20 flex items-center justify-center">
            <Link2 className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No payment links yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first no-code payment link to start accepting payments
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all btn-glow"
          >
            Create Link
          </button>
        </div>
      )}

      {/* Create Payment Link Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold gradient-text">Create Payment Link</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-dark-card rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLink} className="space-y-6">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Product <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  disabled={productsLoading}
                  className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {productsLoading ? 'Loading products...' : 'Select a product'}
                  </option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {formatCurrency(Number(product.price ?? 0))}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Select the product this link will sell
                </p>
                {productsError && (
                  <p className="text-xs text-red-400 mt-2">
                    Failed to load products: {productsError}
                  </p>
                )}
              </div>

              {/* Custom URL */}
              <div>
                <label className="block text-sm font-medium mb-2">Custom URL Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">pay.ninjapay.xyz/</span>
                  <input
                    type="text"
                    value={formData.customUrl}
                    onChange={(e) => setFormData({ ...formData, customUrl: e.target.value })}
                    placeholder="my-product"
                    className="flex-1 px-4 py-3 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-primary-500 transition-colors font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to auto-generate from product name
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Optional description for this payment link"
                  className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-primary-500 transition-colors resize-none"
                />
              </div>

              {/* Max Uses */}
              <div>
                <label className="block text-sm font-medium mb-2">Maximum Uses</label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  placeholder="Unlimited"
                  className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-primary-500 transition-colors"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for unlimited uses
                </p>
              </div>

              {/* Expiration Date */}
              <div>
                <label className="block text-sm font-medium mb-2">Expiration Date</label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-primary-500 transition-colors"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for no expiration
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-dark-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-dark-card hover:bg-dark-card/80 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.productId}
                  className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all btn-glow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Payment Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold gradient-text">Payment Link QR Code</h2>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-2 hover:bg-dark-card rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center">
              {/* QR Code */}
              <div className="bg-white p-4 rounded-lg mb-4">
                <canvas id="qr-canvas" ref={(canvas) => {
                  if (canvas && selectedLinkUrl) {
                    import('qrcode').then((QRCode) => {
                      QRCode.default.toCanvas(canvas, selectedLinkUrl, {
                        width: 256,
                        margin: 2,
                        color: {
                          dark: '#000000',
                          light: '#FFFFFF',
                        },
                      });
                    });
                  }
                }}></canvas>
              </div>

              {/* URL */}
              <div className="w-full p-3 bg-dark-card rounded-lg mb-4">
                <p className="font-mono text-xs text-muted-foreground text-center break-all">
                  {selectedLinkUrl}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => copyToClipboard(selectedLinkUrl, 'qr-modal')}
                  className="flex-1 px-4 py-3 bg-primary-600/10 hover:bg-primary-600/20 text-primary-400 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copiedId === 'qr-modal' ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={() => {
                    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
                    if (canvas) {
                      const url = canvas.toDataURL('image/png');
                      const link = document.createElement('a');
                      link.download = 'payment-link-qr.png';
                      link.href = url;
                      link.click();
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-secondary-600/10 hover:bg-secondary-600/20 text-secondary-400 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  Download QR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
