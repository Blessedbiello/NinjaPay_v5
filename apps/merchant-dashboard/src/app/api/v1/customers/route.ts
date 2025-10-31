import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ninjapay/database';
import { getMerchantId } from '@/lib/auth';

/**
 * GET /api/v1/customers
 * List all customers for the authenticated merchant
 */
export async function GET(request: NextRequest) {
  try {
    const merchantId = await getMerchantId(request);

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where: { merchantId },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where: { merchantId } }),
    ]);

    // Fetch payment stats for each customer
    const customersWithStats = await Promise.all(
      items.map(async (customer) => {
        const payments = await prisma.paymentIntent.findMany({
          where: {
            customerId: customer.id,
            status: { in: ['CONFIRMED', 'FINALIZED'] },
          },
          select: {
            amountCommitment: true,
          },
        });

        const totalSpent = payments.reduce((sum, p) => {
          return sum + (parseFloat(p.amountCommitment) || 0);
        }, 0);

        return {
          ...customer,
          totalSpent,
          paymentCount: payments.length,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: { items: customersWithStats, total },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch customers',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/customers
 * Create a new customer
 */
export async function POST(request: NextRequest) {
  try {
    const merchantId = await getMerchantId(request);

    const body = await request.json();
    const { email, name, walletAddress, metadata = {} } = body;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Email is required',
          },
        },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        merchantId,
        email,
        name,
        walletAddress,
        metadata,
      },
    });

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create customer',
        },
      },
      { status: 500 }
    );
  }
}
