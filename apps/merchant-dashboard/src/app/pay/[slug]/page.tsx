'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Package,
  CreditCard,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PaymentLinkData {
  id: string;
  productName: string;
  description: string | null;
  amount: string;
  currency: string;
  imageUrl: string | null;
  successUrl: string | null;
  cancelUrl: string | null;
  metadata: any;
}

export default function PaymentLinkPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [paymentLink, setPaymentLink] = useState<PaymentLinkData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  useEffect(() => {
    fetchPaymentLink();
  }, [slug]);

  const fetchPaymentLink = async () => {
    try {
      const response = await fetch(`/api/v1/payment_links/${slug}`);
      const data = await response.json();

      if (data.success) {
        setPaymentLink(data.data);
      } else {
        setError(data.error?.message || 'Payment link not found');
      }
    } catch (err) {
      setError('Failed to load payment link');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentLink) return;

    setProcessing(true);
    try {
      // TODO: Integrate with Solana wallet and Arcium MPC
      // For now, simulate payment
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Track conversion and revenue
      await fetch(`/api/v1/payment_links/${paymentLink.id}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentLink.amount),
        }),
      });

      setPaymentStatus('success');

      // Redirect to success URL if provided
      if (paymentLink.successUrl) {
        setTimeout(() => {
          window.location.href = paymentLink.successUrl!;
        }, 2000);
      }
    } catch (err) {
      setPaymentStatus('failed');
      console.error('Payment failed:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-card to-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          <p className="text-muted-foreground">Loading payment link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-card to-dark-bg flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Link Not Found</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <a
            href="https://ninjapay.xyz"
            className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
          >
            Go to NinjaPay <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  if (!paymentLink) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-card to-dark-bg flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">NinjaPay</h1>
          <p className="text-muted-foreground">Secure Solana Payments</p>
        </div>

        <div className="glass-card">
          {paymentStatus === 'idle' ? (
            <>
              {/* Product Info */}
              <div className="flex items-start gap-6 mb-8">
                {/* Product Image/Icon */}
                <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
                  {paymentLink.imageUrl ? (
                    <img
                      src={paymentLink.imageUrl}
                      alt={paymentLink.productName}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="w-12 h-12 text-white" />
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{paymentLink.productName}</h2>
                  {paymentLink.description && (
                    <p className="text-muted-foreground mb-4">{paymentLink.description}</p>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold gradient-text">
                      {formatCurrency(parseFloat(paymentLink.amount))}
                    </span>
                    <span className="text-muted-foreground">{paymentLink.currency}</span>
                  </div>
                </div>
              </div>

              {/* Payment Button */}
              <div className="space-y-4">
                <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CreditCard className="w-4 h-4 text-primary-400" />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium mb-1">Confidential Payment</p>
                      <p className="text-muted-foreground text-xs">
                        Your payment will be processed securely using Arcium MPC encryption on Solana.
                        No one can see your transaction amounts.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full px-6 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-lg transition-all btn-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Pay {formatCurrency(parseFloat(paymentLink.amount))} {paymentLink.currency}
                    </>
                  )}
                </button>

                {paymentLink.cancelUrl && (
                  <a
                    href={paymentLink.cancelUrl}
                    className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </a>
                )}
              </div>
            </>
          ) : paymentStatus === 'success' ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground mb-4">
                Your payment has been processed successfully.
              </p>
              {paymentLink.successUrl && (
                <p className="text-sm text-muted-foreground">
                  Redirecting...
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Payment Failed</h2>
              <p className="text-muted-foreground mb-6">
                Something went wrong processing your payment. Please try again.
              </p>
              <button
                onClick={() => {
                  setPaymentStatus('idle');
                  setProcessing(false);
                }}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all btn-glow"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            Powered by{' '}
            <a
              href="https://ninjapay.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              NinjaPay
            </a>
            {' • '}
            <a
              href="https://arcium.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              Arcium MPC
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
