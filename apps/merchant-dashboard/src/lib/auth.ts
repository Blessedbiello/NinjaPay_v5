import { NextRequest } from 'next/server';
import { prisma } from '@ninjapay/database';

/**
 * Extract merchant ID from authenticated request headers
 * The middleware adds these headers after JWT verification
 * If no merchant exists, creates one automatically
 */
export async function getMerchantId(request: NextRequest): Promise<string> {
  const merchantId = request.headers.get('x-merchant-id');

  if (merchantId) {
    return merchantId;
  }

  // Fallback: create merchant if it doesn't exist
  const userId = request.headers.get('x-user-id');
  const walletAddress = request.headers.get('x-wallet-address');

  if (!userId || !walletAddress) {
    throw new Error('Authentication headers not found. User must be logged in.');
  }

  // Check if merchant exists for this user
  let merchant = await prisma.merchant.findFirst({
    where: { userId },
  });

  if (!merchant) {
    // Auto-create merchant (same logic as API Gateway)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    merchant = await prisma.merchant.create({
      data: {
        userId,
        businessName: `Merchant ${walletAddress.substring(0, 8)}`,
        email: user?.email ?? `merchant_${walletAddress.substring(0, 8)}@ninjapay.xyz`,
        apiKey: `nj_${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 12)}`,
        kycStatus: 'PENDING',
      },
    });
  }

  return merchant.id;
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
export async function getAuthInfo(request: NextRequest) {
  return {
    merchantId: await getMerchantId(request),
    userId: getUserId(request),
    walletAddress: getWalletAddress(request),
  };
}
