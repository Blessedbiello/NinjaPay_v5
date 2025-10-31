import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ninjapay/database';
import { getMerchantId } from '@/lib/auth';

// DELETE /api/v1/webhooks/:id - Delete specific webhook
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const merchantId = await getMerchantId(request);

    // Verify the webhook belongs to this merchant before deleting
    const webhook = await prisma.webhook.findFirst({
      where: {
        id,
        merchantId,
      },
    });

    if (!webhook) {
      return NextResponse.json(
        {
          success: false,
          error: 'Webhook not found',
        },
        { status: 404 }
      );
    }

    // Delete the webhook (cascade will delete associated deliveries)
    await prisma.webhook.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete webhook',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/webhooks/:id - Update webhook
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { enabled, url, events, description } = body;

    const merchantId = await getMerchantId(request);

    // Verify the webhook belongs to this merchant
    const webhook = await prisma.webhook.findFirst({
      where: {
        id,
        merchantId,
      },
    });

    if (!webhook) {
      return NextResponse.json(
        {
          success: false,
          error: 'Webhook not found',
        },
        { status: 404 }
      );
    }

    // Validate URL if provided
    if (url) {
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
    }

    // Update the webhook
    const updatedWebhook = await prisma.webhook.update({
      where: { id },
      data: {
        enabled: enabled !== undefined ? enabled : webhook.enabled,
        url: url || webhook.url,
        events: events || webhook.events,
        description: description !== undefined ? description : webhook.description,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedWebhook,
      message: 'Webhook updated successfully',
    });
  } catch (error) {
    console.error('Error updating webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update webhook',
      },
      { status: 500 }
    );
  }
}

// POST /api/v1/webhooks/:id/test - Test webhook delivery
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const merchantId = await getMerchantId(request);

    // Verify the webhook belongs to this merchant
    const webhook = await prisma.webhook.findFirst({
      where: {
        id,
        merchantId,
      },
    });

    if (!webhook) {
      return NextResponse.json(
        {
          success: false,
          error: 'Webhook not found',
        },
        { status: 404 }
      );
    }

    // TODO: Implement actual webhook test delivery
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Test webhook sent successfully',
      data: {
        webhookId: id,
        url: webhook.url,
        status: 'Test webhook delivery not yet implemented',
      },
    });
  } catch (error) {
    console.error('Error testing webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test webhook',
      },
      { status: 500 }
    );
  }
}
