import { NextRequest } from 'next/server';

/**
 * Extract merchant ID from authenticated request headers
 * The middleware adds these headers after JWT verification
 */
export function getMerchantId(request: NextRequest): string {
  const merchantId = request.headers.get('x-merchant-id');

  if (!merchantId) {
    throw new Error('Merchant ID not found in request. Ensure middleware is configured correctly.');
  }

  return merchantId;
}

/**
 * Extract user ID from authenticated request headers
 */
export function getUserId(request: NextRequest): string {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    throw new Error('User ID not found in request. Ensure middleware is configured correctly.');
  }

  return userId;
}

/**
 * Extract wallet address from authenticated request headers
 */
export function getWalletAddress(request: NextRequest): string {
  const walletAddress = request.headers.get('x-wallet-address');

  if (!walletAddress) {
    throw new Error('Wallet address not found in request. Ensure middleware is configured correctly.');
  }

  return walletAddress;
}

/**
 * Extract all auth info from request headers
 */
export function getAuthInfo(request: NextRequest) {
  return {
    merchantId: getMerchantId(request),
    userId: getUserId(request),
    walletAddress: getWalletAddress(request),
  };
}
