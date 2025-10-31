'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useCallback, useEffect, useState, useRef } from 'react';
import { LogOut, User } from 'lucide-react';
import bs58 from 'bs58';
import { apiClient } from '@/lib/api-client';

export function WalletConnect() {
  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [merchantInfo, setMerchantInfo] = useState<any>(null);
  const router = useRouter();
  const authAttemptedRef = useRef(false);

  const navigateToDashboard = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (window.location.pathname !== '/dashboard') {
      router.replace('/dashboard');
    }
  }, [router]);

  useEffect(() => {
    try {
      router.prefetch('/dashboard');
    } catch (error) {
      console.error('Failed to prefetch dashboard route:', error);
    }
  }, [router]);

  // Check if we have a stored auth token
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
      apiClient.setAuthToken(token);
      // Optionally fetch merchant info
      fetchMerchantInfo(token);
    }
  }, []);

  // When wallet connects, authenticate with backend
  useEffect(() => {
    if (connected && publicKey && !isAuthenticated && !authAttemptedRef.current) {
      authAttemptedRef.current = true;
      authenticateWallet();
    }

    // Reset auth attempted when wallet disconnects
    if (!connected) {
      authAttemptedRef.current = false;
    }
  }, [connected, publicKey, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && merchantInfo) {
      navigateToDashboard();
    }
  }, [isAuthenticated, merchantInfo, navigateToDashboard]);

  const fetchMerchantInfo = async (token: string) => {
    try {
      const stored = localStorage.getItem('merchant_info');
      if (stored) {
        const merchantData = JSON.parse(stored);
        setMerchantInfo(merchantData);
      } else {
        setMerchantInfo(null);
      }
    } catch (error) {
      console.error('Error fetching merchant info:', error);
      setMerchantInfo(null);
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

      // Store token and merchant info
      const token = verifyData.data.token;
      const merchantRecord =
        verifyData.data.merchant ?? {
          id: verifyData.data.user?.merchantId ?? `dev_${publicKey.toBase58().slice(0, 8)}`,
          businessName:
            verifyData.data.user?.businessName ?? `Dev Merchant ${publicKey.toBase58().slice(0, 6)}`,
          email: verifyData.data.user?.email ?? `merchant_${publicKey.toBase58().slice(0, 8)}@ninjapay.local`,
        };

      localStorage.setItem('auth_token', token);
      localStorage.setItem('merchant_info', JSON.stringify(merchantRecord));

      // Also set as cookie for middleware
      document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

      setAuthToken(token);
      setIsAuthenticated(true);
      setMerchantInfo(merchantRecord);
      apiClient.setAuthToken(token);

      // Redirect to dashboard after successful authentication
      navigateToDashboard();
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Failed to authenticate. Please try again.');
      authAttemptedRef.current = false; // Allow retry
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('merchant_info');

    // Clear cookie
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Failed to clear auth cookie:', error);
    }
    document.cookie = 'auth_token=; path=/; max-age=0';

    setAuthToken(null);
    setIsAuthenticated(false);
    setMerchantInfo(null);
    apiClient.setAuthToken(null);
    Promise.resolve(disconnect()).catch(() => null);
    router.replace('/');
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
