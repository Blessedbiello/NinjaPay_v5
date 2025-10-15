import { PrismaClient } from '@prisma/client';

export interface CreateCustomerParams {
  merchantId: string;
  email: string;
  name?: string;
  walletAddress?: string;
  metadata?: Record<string, any>;
}

export interface UpdateCustomerParams {
  name?: string;
  walletAddress?: string;
  metadata?: Record<string, any>;
}

export interface ListCustomersParams {
  merchantId: string;
  email?: string;
  limit?: number;
  offset?: number;
}

export class CustomerService {
  constructor(private db: PrismaClient) {}

  async create(params: CreateCustomerParams) {
    // Check if customer already exists
    const existing = await this.db.customer.findUnique({
      where: {
        merchantId_email: {
          merchantId: params.merchantId,
          email: params.email,
        },
      },
    });

    if (existing) {
      throw new Error('Customer with this email already exists');
    }

    const customer = await this.db.customer.create({
      data: {
        merchantId: params.merchantId,
        email: params.email,
        name: params.name,
        walletAddress: params.walletAddress,
        metadata: params.metadata || {},
      },
    });

    return customer;
  }

  async retrieve(id: string) {
    const customer = await this.db.customer.findUnique({
      where: { id },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
          },
        },
        paymentIntents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return customer;
  }

  async update(id: string, params: UpdateCustomerParams) {
    const customer = await this.db.customer.update({
      where: { id },
      data: {
        name: params.name,
        walletAddress: params.walletAddress,
        metadata: params.metadata,
      },
    });

    return customer;
  }

  async delete(id: string) {
    const customer = await this.db.customer.delete({
      where: { id },
    });

    return customer;
  }

  async list(params: ListCustomersParams) {
    const where: any = {
      merchantId: params.merchantId,
    };

    if (params.email) {
      where.email = {
        contains: params.email,
        mode: 'insensitive',
      };
    }

    const [customers, total] = await Promise.all([
      this.db.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: params.limit || 50,
        skip: params.offset || 0,
      }),
      this.db.customer.count({ where }),
    ]);

    return {
      data: customers,
      total,
      hasMore: (params.offset || 0) + customers.length < total,
    };
  }
}
