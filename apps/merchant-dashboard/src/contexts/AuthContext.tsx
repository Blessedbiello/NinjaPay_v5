'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface Merchant {
  id: string;
  businessName: string;
  email: string;
  kycStatus: string;
}

interface AuthContextType {
  merchant: Merchant | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, walletAddress: string) => Promise<void>;
  register: (businessName: string, email: string, walletAddress: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('ninjapay_token');
    const storedMerchant = localStorage.getItem('ninjapay_merchant');

    if (storedToken && storedMerchant) {
      setToken(storedToken);
      setMerchant(JSON.parse(storedMerchant));
      apiClient.setApiKey(storedToken);
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, walletAddress: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/merchant/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, walletAddress }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Login failed');
      }

      const data = await response.json();
      const { merchant: merchantData, token: authToken } = data.data;

      setMerchant(merchantData);
      setToken(authToken);
      apiClient.setApiKey(authToken);

      localStorage.setItem('ninjapay_token', authToken);
      localStorage.setItem('ninjapay_merchant', JSON.stringify(merchantData));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (businessName: string, email: string, walletAddress: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/merchant/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessName, email, walletAddress }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Registration failed');
      }

      const data = await response.json();
      const { merchant: merchantData, token: authToken } = data.data;

      setMerchant(merchantData);
      setToken(authToken);
      apiClient.setApiKey(authToken);

      localStorage.setItem('ninjapay_token', authToken);
      localStorage.setItem('ninjapay_merchant', JSON.stringify(merchantData));
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setMerchant(null);
    setToken(null);
    localStorage.removeItem('ninjapay_token');
    localStorage.removeItem('ninjapay_merchant');
    localStorage.removeItem('ninjapay_api_key');
  };

  return (
    <AuthContext.Provider
      value={{
        merchant,
        token,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!merchant && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
