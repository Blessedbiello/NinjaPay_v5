import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ninjapay/database';
import { randomBytes } from 'crypto';
import { getMerchantId } from '@/lib/auth';

// GET /api/v1/webhooks - List all webhooks for merchant
export async function GET(request: NextRequest) {
  try {
    const merchantId = await getMerchantId(request);

    const webhooks = await prisma.webhook.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        url: true,
        events: true,
        secret: true,
        enabled: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: webhooks,
        total: webhooks.length,
      },
    });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch webhooks',
      },
      { status: 500 }
    );
  }
}

// POST /api/v1/webhooks - Create new webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, events, description } = body;

    const merchantId = await getMerchantId(request);

    // Validate input
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'URL is required',
        },
        { status: 400 }
      );
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one event type is required',
        },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid URL format',
        },
        { status: 400 }
      );
    }

    // Generate webhook secret for HMAC signature verification
    const secret = `whsec_${randomBytes(32).toString('hex')}`;

    // Create webhook in database
    const newWebhook = await prisma.webhook.create({
      data: {
        merchantId,
        url,
        events,
        secret,
        enabled: true,
        description: description || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: newWebhook,
      message: 'Webhook created successfully',
    });
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create webhook',
      },
      { status: 500 }
    );
  }
}
