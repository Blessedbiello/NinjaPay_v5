import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ninjapay/database';
import { getMerchantId } from '@/lib/auth';

// DELETE /api/v1/api_keys/:id - Delete specific API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const merchantId = getMerchantId(request);

    // Verify the API key belongs to this merchant before deleting
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id,
        merchantId,
      },
    });

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'API key not found',
        },
        { status: 404 }
      );
    }

    // Delete the API key
    await prisma.apiKey.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete API key',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/api_keys/:id - Update API key (toggle active status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { active } = body;

    const merchantId = getMerchantId(request);

    // Verify the API key belongs to this merchant
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id,
        merchantId,
      },
    });

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'API key not found',
        },
        { status: 404 }
      );
    }

    // Update the API key
    const updatedApiKey = await prisma.apiKey.update({
      where: { id },
      data: {
        active: active !== undefined ? active : apiKey.active,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedApiKey,
      message: 'API key updated successfully',
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update API key',
      },
      { status: 500 }
    );
  }
}
