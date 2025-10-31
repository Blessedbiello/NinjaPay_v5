import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ninjapay/database';
import { getMerchantId } from '@/lib/auth';

/**
 * GET /api/v1/developers/errors
 * Fetch recent API errors and failure statistics
 */
export async function GET(request: NextRequest) {
  try {
    const merchantId = await getMerchantId(request);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get recent errors (4xx and 5xx status codes)
    const recentErrors = await prisma.apiRequestLog.findMany({
      where: {
        merchantId,
        statusCode: {
          gte: 400,
        },
        errorMessage: {
          not: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Calculate error rate
    const [totalRequests, errorRequests] = await Promise.all([
      prisma.apiRequestLog.count({
        where: {
          merchantId,
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      prisma.apiRequestLog.count({
        where: {
          merchantId,
          createdAt: {
            gte: thirtyDaysAgo,
          },
          statusCode: {
            gte: 400,
          },
        },
      }),
    ]);

    const errorRate = totalRequests > 0
      ? ((errorRequests / totalRequests) * 100).toFixed(1)
      : '0.0';

    // Group errors by endpoint and error message
    const errorsByType = await prisma.apiRequestLog.groupBy({
      by: ['endpoint', 'errorMessage'],
      where: {
        merchantId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
        statusCode: {
          gte: 400,
        },
        errorMessage: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    const formattedErrors = recentErrors.map((error) => ({
      id: error.id,
      timestamp: error.createdAt.toISOString(),
      endpoint: error.endpoint,
      method: error.method,
      statusCode: error.statusCode,
      errorMessage: error.errorMessage,
    }));

    const commonErrors = errorsByType.map((error) => ({
      endpoint: error.endpoint,
      errorMessage: error.errorMessage,
      count: error._count.id,
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: formattedErrors,
        errorRate: parseFloat(errorRate),
        commonErrors,
        total: recentErrors.length,
      },
    });
  } catch (error) {
    console.error('Error fetching API errors:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch API errors',
        },
      },
      { status: 500 }
    );
  }
}
