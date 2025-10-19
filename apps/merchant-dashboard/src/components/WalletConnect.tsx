'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState } from 'react';
import { Wallet, LogOut, User } from 'lucide-react';
import bs58 from 'bs58';

export function WalletConnect() {
  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [merchantInfo, setMerchantInfo] = useState<any>(null);

  // Check if we have a stored auth token
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
      // Optionally fetch merchant info
      fetchMerchantInfo(token);
    }
  }, []);

  // When wallet connects, authenticate with backend
  useEffect(() => {
    if (connected && publicKey && !isAuthenticated && !isAuthenticating) {
      authenticateWallet();
    }
  }, [connected, publicKey, isAuthenticated]);

  const fetchMerchantInfo = async (token: string) => {
    try {
      // You can add an endpoint to fetch merchant info if needed
      const merchantData = JSON.parse(localStorage.getItem('merchant_info') || '{}');
      setMerchantInfo(merchantData);
    } catch (error) {
      console.error('Error fetching merchant info:', error);
    }
  };

  const authenticateWallet = async () => {
    if (!publicKey || !signMessage) {
      console.error('Wallet not ready for authentication');
      return;
    }

    setIsAuthenticating(true);

    try {
      // Step 1: Get nonce from backend
      const nonceResponse = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey.toBase58() }),
      });

      const nonceData = await nonceResponse.json();

      if (!nonceData.success) {
        throw new Error(nonceData.error?.message || 'Failed to get nonce');
      }

      const message = nonceData.data.nonce;

      // Step 2: Sign the message
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(messageBytes);
      const signature = bs58.encode(signatureBytes);

      // Step 3: Verify signature and get JWT
      const verifyResponse = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          signature,
          message,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        throw new Error(verifyData.error?.message || 'Authentication failed');
      }

      // Store token and user info
      const token = verifyData.data.token;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('merchant_info', JSON.stringify(verifyData.data.user));

      setAuthToken(token);
      setIsAuthenticated(true);
      setMerchantInfo(verifyData.data.user);

      // Refresh the page to update the dashboard with authenticated state
      window.location.reload();
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Failed to authenticate. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('merchant_info');
    setAuthToken(null);
    setIsAuthenticated(false);
    setMerchantInfo(null);
    disconnect();
    window.location.href = '/';
  };

  if (isAuthenticating) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/30 rounded-lg">
        <div className="animate-spin w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full" />
        <span className="text-sm text-primary-400">Authenticating...</span>
      </div>
    );
  }

  if (isAuthenticated && merchantInfo) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-dark-card border border-dark-border rounded-lg">
          <User className="w-4 h-4 text-primary-400" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Merchant</span>
            <span className="text-sm font-medium text-foreground">
              {merchantInfo.businessName || 'Unnamed Business'}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400">Logout</span>
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-adapter-button-wrapper">
      <WalletMultiButton />
    </div>
  );
}
