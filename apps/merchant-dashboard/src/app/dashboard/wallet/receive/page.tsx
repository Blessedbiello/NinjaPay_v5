'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowDownToLine, Copy, Check, QrCode as QrCodeIcon } from 'lucide-react';

export default function ReceivePage() {
  const [copied, setCopied] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchWalletAddress();
  }, []);

  useEffect(() => {
    if (walletAddress && canvasRef.current) {
      generateQRCode();
    }
  }, [walletAddress]);

  const fetchWalletAddress = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/wallet/balance');
      const data = await response.json();
      if (data.success && data.data.walletAddress) {
        setWalletAddress(data.data.walletAddress);
      }
    } catch (error) {
      console.error('Error fetching wallet address:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    if (!canvasRef.current || !walletAddress) return;

    try {
      // Dynamic import to avoid SSR issues
      const QRCode = (await import('qrcode')).default;

      await QRCode.toCanvas(canvasRef.current, walletAddress, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center">
          <ArrowDownToLine className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold gradient-text">Receive Money</h1>
          <p className="text-muted-foreground">
            Share your address to receive payments
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* QR Code */}
        <div className="glass-card flex flex-col items-center justify-center p-12">
          {loading ? (
            <div className="w-64 h-64 bg-dark-border rounded-2xl flex items-center justify-center mb-6 animate-pulse">
              <QrCodeIcon className="w-32 h-32 text-muted-foreground" />
            </div>
          ) : walletAddress ? (
            <>
              <div className="bg-white rounded-2xl p-4 mb-6">
                <canvas ref={canvasRef} />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Scan this QR code to send payment
              </p>
            </>
          ) : (
            <div className="w-64 h-64 bg-dark-border rounded-2xl flex items-center justify-center mb-6">
              <p className="text-muted-foreground text-center px-6">
                Wallet not configured
              </p>
            </div>
          )}
        </div>

        {/* Wallet Address */}
        <div className="space-y-6">
          <div className="glass-card">
            <h3 className="font-semibold mb-4">Your Wallet Address</h3>
            {loading ? (
              <div className="bg-dark-card border border-dark-border rounded-lg p-4 mb-4">
                <div className="h-6 bg-dark-border rounded animate-pulse"></div>
              </div>
            ) : walletAddress ? (
              <>
                <div className="bg-dark-card border border-dark-border rounded-lg p-4 mb-4">
                  <p className="font-mono text-sm break-all text-secondary-400">
                    {walletAddress}
                  </p>
                </div>
                <button
                  onClick={copyAddress}
                  className="w-full px-4 py-3 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg font-medium transition-all btn-glow flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Address
                    </>
                  )}
                </button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Wallet not configured. Please contact support.
              </p>
            )}
          </div>

          <div className="glass-card">
            <h3 className="font-semibold mb-3">How to Receive</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary-500/20 flex items-center justify-center flex-shrink-0 text-secondary-400 font-semibold">
                  1
                </div>
                <p>Share your wallet address or QR code with the sender</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary-500/20 flex items-center justify-center flex-shrink-0 text-secondary-400 font-semibold">
                  2
                </div>
                <p>Wait for the payment to be sent to your address</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary-500/20 flex items-center justify-center flex-shrink-0 text-secondary-400 font-semibold">
                  3
                </div>
                <p>Receive confirmation once transaction is confirmed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
