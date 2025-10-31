import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ninjapay/database';
import { getMerchantId } from '@/lib/auth';

/**
 * GET /api/v1/products
 * List all products for the authenticated merchant
 */
export async function GET(request: NextRequest) {
  try {
    const merchantId = await getMerchantId(request);

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const active = searchParams.get('active');

    const where: any = { merchantId };
    if (active !== null) where.active = active === 'true';

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { items, total },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch products',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/products
 * Create a new product
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[POST /api/v1/products] Starting product creation');

    let merchantId: string;
    try {
      merchantId = await getMerchantId(request);
      console.log('[POST /api/v1/products] Got merchantId:', merchantId);
    } catch (authError) {
      console.error('[POST /api/v1/products] Auth error:', authError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: authError instanceof Error ? authError.message : 'Authentication failed',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('[POST /api/v1/products] Request body:', JSON.stringify(body, null, 2));

    const {
      name,
      description,
      price,
      currency = 'USDC',
      images = [],
      active = true,
      metadata = {},
    } = body;

    if (!name || !price || price <= 0) {
      console.error('[POST /api/v1/products] Validation failed: name or price invalid');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Name and valid price are required',
          },
        },
        { status: 400 }
      );
    }

    console.log('[POST /api/v1/products] Creating product with data:', { merchantId, name, price, currency });

    const product = await prisma.product.create({
      data: {
        merchantId,
        name,
        description,
        price,
        currency,
        images,
        active,
        metadata,
      },
    });

    console.log('[POST /api/v1/products] Product created successfully:', product.id);

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('[POST /api/v1/products] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create product',
        },
      },
      { status: 500 }
    );
  }
}
