import { NextRequest, NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { prisma } from '@ninjapay/database';
import { consumeNonce } from '@/lib/auth/nonce-store';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * POST /api/auth/verify
 * Verify wallet signature and issue JWT
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, signature, message } = body;

    if (!walletAddress || !signature || !message) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Wallet address, signature, and message are required'
          }
        },
        { status: 400 }
      );
    }

    // Verify nonce usage to prevent replay
    const nonceValid = consumeNonce(walletAddress, message);

    if (!nonceValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NONCE_INVALID',
            message: 'Authentication request expired or invalid. Please try again.',
          },
        },
        { status: 400 }
      );
    }

    // Verify the signature
    try {
      const publicKey = new PublicKey(walletAddress);
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = bs58.decode(signature);

      const verified = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKey.toBytes()
      );

      if (!verified) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_SIGNATURE',
              message: 'Signature verification failed'
            }
          },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('Signature verification error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VERIFICATION_FAILED',
            message: 'Failed to verify signature'
          }
        },
        { status: 401 }
      );
    }

    // Check if merchant exists
    let merchant = await prisma.merchant.findFirst({
      where: {
        user: {
          walletAddress,
        },
      },
      include: {
        user: true,
      },
    });

    // If no merchant exists, create one
    if (!merchant) {
      // Create user first
      const user = await prisma.user.create({
        data: {
          walletAddress,
          arciumKeyId: `arcium_${walletAddress.substring(0, 8)}`, // Placeholder, will be replaced with real Arcium key
        },
      });

      // Create merchant
      merchant = await prisma.merchant.create({
        data: {
          userId: user.id,
          businessName: `Merchant ${walletAddress.substring(0, 8)}`,
          email: `merchant_${walletAddress.substring(0, 8)}@ninjapay.xyz`,
          apiKey: `sk_live_${Buffer.from(walletAddress).toString('base64').substring(0, 32)}`,
          kycStatus: 'PENDING',
        },
        include: {
          user: true,
        },
      });
    }

    // Generate JWT token
    const token = sign(
      {
        userId: merchant.userId,
        merchantId: merchant.id,
        walletAddress,
        email: merchant.email,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: merchant.userId,
          walletAddress,
          merchantId: merchant.id,
          businessName: merchant.businessName,
          email: merchant.email,
          kycStatus: merchant.kycStatus,
        },
      },
    });
  } catch (error) {
    console.error('Error verifying signature:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to verify signature' } },
      { status: 500 }
    );
  }
}
