import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ninjapay/database';
import { getMerchantId } from '@/lib/auth';

/**
 * GET /api/v1/developers/activity
 * Fetch recent API activity logs
 */
export async function GET(request: NextRequest) {
  try {
    const merchantId = await getMerchantId(request);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const activities = await prisma.apiRequestLog.findMany({
      where: {
        merchantId,
      },
      include: {
        apiKey: {
          select: {
            name: true,
            key: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    const formattedActivities = activities.map((activity) => ({
      id: activity.id,
      timestamp: activity.createdAt.toISOString(),
      method: activity.method,
      endpoint: activity.endpoint,
      statusCode: activity.statusCode,
      responseTime: activity.responseTime,
      apiKeyName: activity.apiKey?.name || 'Unknown',
      apiKeyLastChars: activity.apiKey?.key?.slice(-4) || 'xxxx',
      errorMessage: activity.errorMessage,
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: formattedActivities,
        total: formattedActivities.length,
      },
    });
  } catch (error) {
    console.error('Error fetching API activity:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch API activity',
        },
      },
      { status: 500 }
    );
  }
}
