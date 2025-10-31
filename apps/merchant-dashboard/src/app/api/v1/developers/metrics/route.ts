import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ninjapay/database';
import { getMerchantId } from '@/lib/auth';

/**
 * GET /api/v1/developers/metrics
 * Fetch developer-focused analytics and metrics
 */
export async function GET(request: NextRequest) {
  try {
    const merchantId = await getMerchantId(request);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get API call statistics
    const [
      totalApiCalls,
      successfulCalls,
      avgResponseTime,
      activeApiKeysCount,
      totalApiKeys,
      totalWebhookDeliveries,
      successfulWebhookDeliveries,
    ] = await Promise.all([
      // Total API calls this month
      prisma.apiRequestLog.count({
        where: {
          merchantId,
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),

      // Successful API calls (2xx status)
      prisma.apiRequestLog.count({
        where: {
          merchantId,
          createdAt: {
            gte: thirtyDaysAgo,
          },
          statusCode: {
            gte: 200,
            lt: 300,
          },
        },
      }),

      // Average response time
      prisma.apiRequestLog.aggregate({
        where: {
          merchantId,
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        _avg: {
          responseTime: true,
        },
      }),

      // Active API keys (used in last 7 days)
      prisma.apiKey.count({
        where: {
          merchantId,
          active: true,
          lastUsedAt: {
            gte: sevenDaysAgo,
          },
        },
      }),

      // Total API keys
      prisma.apiKey.count({
        where: {
          merchantId,
          active: true,
        },
      }),

      // Total webhook deliveries
      prisma.webhookDelivery.count({
        where: {
          webhook: {
            merchantId,
          },
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),

      // Successful webhook deliveries (2xx responses)
      prisma.webhookDelivery.count({
        where: {
          webhook: {
            merchantId,
          },
          createdAt: {
            gte: thirtyDaysAgo,
          },
          responseStatus: {
            gte: 200,
            lt: 300,
          },
        },
      }),
    ]);

    // Calculate success rates
    const apiSuccessRate = totalApiCalls > 0
      ? ((successfulCalls / totalApiCalls) * 100).toFixed(1)
      : '100.0';

    const webhookSuccessRate = totalWebhookDeliveries > 0
      ? ((successfulWebhookDeliveries / totalWebhookDeliveries) * 100).toFixed(1)
      : '100.0';

    // Check integration status
    const [hasApiKey, hasFirstCall, hasWebhook, hasWebhookDelivery, hasTestPayment] = await Promise.all([
      prisma.apiKey.count({ where: { merchantId } }).then(count => count > 0),
      prisma.apiRequestLog.count({ where: { merchantId } }).then(count => count > 0),
      prisma.webhook.count({ where: { merchantId, enabled: true } }).then(count => count > 0),
      prisma.webhookDelivery.count({ where: { webhook: { merchantId } } }).then(count => count > 0),
      prisma.paymentIntent.count({
        where: { merchantId, status: 'CONFIRMED' }
      }).then(count => count > 0),
    ]);

    const completedSteps = [hasApiKey, hasFirstCall, hasWebhook, hasWebhookDelivery, hasTestPayment]
      .filter(Boolean).length;
    const completionPercentage = (completedSteps / 5) * 100;

    return NextResponse.json({
      success: true,
      data: {
        apiCalls: {
          total: totalApiCalls,
          growth: '+0%', // TODO: Calculate actual growth
        },
        successRate: parseFloat(apiSuccessRate),
        avgResponseTime: Math.round(avgResponseTime._avg.responseTime || 0),
        activeApiKeys: activeApiKeysCount,
        totalApiKeys: totalApiKeys,
        webhookDeliveries: {
          total: totalWebhookDeliveries,
          successRate: parseFloat(webhookSuccessRate),
        },
        integrationStatus: {
          hasApiKey,
          hasFirstCall,
          hasWebhook,
          hasWebhookDelivery,
          hasTestPayment,
          completionPercentage,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching developer metrics:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch developer metrics',
        },
      },
      { status: 500 }
    );
  }
}
