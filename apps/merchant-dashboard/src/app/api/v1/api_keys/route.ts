import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ninjapay/database';
import { randomBytes } from 'crypto';
import { getMerchantId } from '@/lib/auth';

// GET /api/v1/api_keys - List all API keys for merchant
export async function GET(request: NextRequest) {
  try {
    const merchantId = await getMerchantId(request);

    const apiKeys = await prisma.apiKey.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        key: true,
        active: true,
        permissions: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: apiKeys,
        total: apiKeys.length,
      },
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch API keys',
      },
      { status: 500 }
    );
  }
}

// POST /api/v1/api_keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, permissions, expiresAt } = body;

    const merchantId = await getMerchantId(request);

    // Validate input
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Name is required',
        },
        { status: 400 }
      );
    }

    // Generate API key (nj_live_ prefix + random 32 bytes)
    const keyBuffer = randomBytes(32);
    const apiKey = `nj_live_${keyBuffer.toString('hex')}`;

    // Create API key in database
    const newApiKey = await prisma.apiKey.create({
      data: {
        merchantId,
        key: apiKey,
        name,
        active: true,
        permissions: permissions || ['read', 'write'],
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: newApiKey,
      message: 'API key created successfully',
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create API key',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/api_keys - Delete API key (handled by dynamic route)
