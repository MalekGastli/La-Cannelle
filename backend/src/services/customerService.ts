import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export const customerService = {
  async getCustomers(filters?: {
    status?: string;
    tier?: string;
    search?: string;
  }) {
    const where: any = {
      role: 'CLIENT'
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.tier) {
      where.tier = filters.tier;
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search } },
        { lastName: { contains: filters.search } },
        { email: { contains: filters.search } }
      ];
    }

    const customers = await prisma.user.findMany({
      where,
      include: {
        orders: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
            paymentStatus: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate stats for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const orderStats = await prisma.order.aggregate({
          where: { userId: customer.id },
          _sum: { total: true },
          _count: true
        });

        const lastOrder = await prisma.order.findFirst({
          where: { userId: customer.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        });

        return {
          id: customer.id,
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          phone: customer.phone,
          joinDate: customer.createdAt.toISOString().split('T')[0],
          totalOrders: orderStats._count,
          totalSpent: orderStats._sum.total || 0,
          lastOrder: lastOrder?.createdAt.toISOString().split('T')[0] || null,
          status: customer.status,
          tier: customer.tier,
          location: customer.location,
          preferences: customer.preferences,
          allergies: customer.allergies,
          notes: customer.notes
        };
      })
    );

    return customersWithStats;
  },

  async getCustomerById(id: number) {
    const customer = await prisma.user.findUnique({
      where: { id, role: 'CLIENT' },
      include: {
        orders: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const orderStats = await prisma.order.aggregate({
      where: { userId: id },
      _sum: { total: true },
      _count: true
    });

    const lastOrder = await prisma.order.findFirst({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });

    return {
      ...customer,
      totalOrders: orderStats._count,
      totalSpent: orderStats._sum.total || 0,
      lastOrder: lastOrder?.createdAt.toISOString().split('T')[0] || null
    };
  }
};
