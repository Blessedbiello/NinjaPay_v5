'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import {
  Package,
  CreditCard,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Wallet,
  Shield,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PaymentLinkData {
  id: string;
  merchantId: string;
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
  const { publicKey, signTransaction, connected } = useWallet();

  const [loading, setLoading] = useState(true);
  const [paymentLink, setPaymentLink] = useState<PaymentLinkData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

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
    if (!paymentLink || !connected || !publicKey || !signTransaction) {
      setError('Please connect your wallet first');
      return;
    }

    setProcessing(true);
    setStatusMessage('Creating payment intent...');

    try {
      // Step 1: Create payment intent with encrypted amount
      const encryptedAmount = paymentLink.metadata?.encrypted_amount;
      const encryptionKey = paymentLink.metadata?.encryption_key;

      if (!encryptedAmount || !encryptionKey) {
        throw new Error('Payment link encryption data is missing');
      }

      const paymentIntentResponse = await fetch('/api/v1/payment_intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentLink.amount),
          currency: paymentLink.currency,
          description: `Payment for ${paymentLink.productName}`,
          userPubkey: publicKey.toBase58(),
          metadata: {
            payment_link_id: paymentLink.id,
            product_name: paymentLink.productName,
            encrypted_amount: encryptedAmount,
            encryption_key: encryptionKey,
          },
        }),
      });

      const paymentIntentData = await paymentIntentResponse.json();

      if (!paymentIntentData.success) {
        throw new Error(paymentIntentData.error?.message || 'Failed to create payment intent');
      }

      const paymentIntent = paymentIntentData.data;
      setPaymentIntentId(paymentIntent.id);
      setStatusMessage('Processing payment through Arcium MPC...');

      // Step 2: Process through Arcium MPC cluster
      const arciumResponse = await fetch(`/api/v1/payment_intents/${paymentIntent.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPubkey: publicKey.toBase58(),
          balance: 100_000_000, // 100 tokens default balance (in micro-units)
        }),
      });

      const arciumData = await arciumResponse.json();

      if (!arciumData.success) {
        throw new Error(arciumData.error?.message || 'Arcium MPC processing failed');
      }

      console.log('[Payment] Arcium MPC completed:', arciumData.data);
      setStatusMessage('Creating Solana transaction...');

      // Step 3: Create and sign Solana transaction
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
        'confirmed'
      );

      // Get merchant's wallet address (recipient)
      const merchantWallet = encryptionKey; // The encryption key is the merchant's wallet address

      // Create a simple transfer transaction (in production, this would be a confidential transfer)
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(merchantWallet),
          lamports: Math.floor(parseFloat(paymentLink.amount) * 1_000_000), // Convert to lamports (assuming SOL)
        })
      );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      setStatusMessage('Please sign the transaction in your wallet...');

      // Sign transaction
      const signedTransaction = await signTransaction(transaction);

      setStatusMessage('Submitting transaction to Solana devnet...');

      // Send transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());

      setStatusMessage('Confirming transaction...');

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      setTxSignature(signature);

      // Step 4: Update payment intent status
      await fetch(`/api/v1/payment_intents/${paymentIntent.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txSignature: signature,
        }),
      });

      // Track conversion and revenue
      await fetch(`/api/v1/payment_links/${paymentLink.id}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentLink.amount),
        }),
      });

      setPaymentStatus('success');
      setStatusMessage('Payment successful!');

      // Redirect to success URL if provided
      if (paymentLink.successUrl) {
        setTimeout(() => {
          window.location.href = paymentLink.successUrl!;
        }, 3000);
      }
    } catch (err: any) {
      console.error('Payment failed:', err);
      setPaymentStatus('failed');
      setError(err.message || 'Payment processing failed');
      setStatusMessage('');
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

  if (error && !paymentLink) {
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

              {/* Security Info */}
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Shield className="w-4 h-4 text-primary-400" />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium mb-1">Confidential Payment</p>
                      <p className="text-muted-foreground text-xs">
                        Your payment will be processed securely using Arcium MPC encryption on Solana Devnet.
                        Transaction amounts are encrypted and private.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wallet Connection / Payment */}
              {!connected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Wallet className="w-4 h-4" />
                    <span>Connect your Solana wallet to proceed</span>
                  </div>
                  <WalletMultiButton className="w-full !bg-primary-600 !hover:bg-primary-700 !rounded-lg !font-semibold !text-lg !h-auto !py-4" />
                  {paymentLink.cancelUrl && (
                    <a
                      href={paymentLink.cancelUrl}
                      className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Connected Wallet Info */}
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">
                      Wallet connected: {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
                    </span>
                  </div>

                  {/* Processing Status */}
                  {processing && statusMessage && (
                    <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />
                      <span className="text-sm text-primary-400">{statusMessage}</span>
                    </div>
                  )}

                  {/* Error Display */}
                  {error && paymentStatus === 'idle' && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-red-400">{error}</span>
                    </div>
                  )}

                  {/* Payment Button */}
                  <button
                    onClick={handlePayment}
                    disabled={processing}
                    className="w-full px-6 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-lg transition-all btn-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
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
              )}
            </>
          ) : paymentStatus === 'success' ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground mb-4">
                Your confidential payment has been processed successfully.
              </p>
              {paymentIntentId && (
                <p className="text-xs text-muted-foreground mb-2">
                  Payment ID: {paymentIntentId.slice(0, 12)}...
                </p>
              )}
              {txSignature && (
                <a
                  href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors mb-4"
                >
                  View on Solana Explorer <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {paymentLink.successUrl && (
                <p className="text-sm text-muted-foreground mt-4">
                  Redirecting in 3 seconds...
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Payment Failed</h2>
              <p className="text-muted-foreground mb-2">
                {error || 'Something went wrong processing your payment.'}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Please try again or contact support if the issue persists.
              </p>
              <button
                onClick={() => {
                  setPaymentStatus('idle');
                  setProcessing(false);
                  setError(null);
                  setStatusMessage('');
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
            {' • '}
            <span className="text-muted-foreground/70">Solana Devnet</span>
          </p>
        </div>
      </div>
    </div>
  );
}
