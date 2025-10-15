import { PrismaClient } from '@prisma/client';

export interface CreateProductParams {
  merchantId: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  images?: string[];
  active?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateProductParams {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  images?: string[];
  active?: boolean;
  metadata?: Record<string, any>;
}

export interface ListProductsParams {
  merchantId: string;
  active?: boolean;
  limit?: number;
  offset?: number;
}

export class ProductService {
  constructor(private db: PrismaClient) {}

  async create(params: CreateProductParams) {
    const product = await this.db.product.create({
      data: {
        merchantId: params.merchantId,
        name: params.name,
        description: params.description,
        price: params.price,
        currency: params.currency || 'USDC',
        images: params.images || [],
        active: params.active ?? true,
        metadata: params.metadata || {},
      },
    });

    return product;
  }

  async retrieve(id: string) {
    const product = await this.db.product.findUnique({
      where: { id },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
            email: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  async update(id: string, params: UpdateProductParams) {
    const product = await this.db.product.update({
      where: { id },
      data: {
        name: params.name,
        description: params.description,
        price: params.price,
        currency: params.currency,
        images: params.images,
        active: params.active,
        metadata: params.metadata,
      },
    });

    return product;
  }

  async delete(id: string) {
    const product = await this.db.product.delete({
      where: { id },
    });

    return product;
  }

  async list(params: ListProductsParams) {
    const where: any = {
      merchantId: params.merchantId,
    };

    if (params.active !== undefined) {
      where.active = params.active;
    }

    const [products, total] = await Promise.all([
      this.db.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: params.limit || 50,
        skip: params.offset || 0,
      }),
      this.db.product.count({ where }),
    ]);

    return {
      data: products,
      total,
      hasMore: (params.offset || 0) + products.length < total,
    };
  }
}
