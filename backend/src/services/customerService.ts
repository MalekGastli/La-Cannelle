import { prisma, withRetry } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export const customerService = {
  async getCustomers(filters?: {
    status?: string;
    tier?: string;
    search?: string;
    take?: number;
    skip?: number;
    withTotal?: boolean;
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
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    // Only the columns the list view returns; the old per-customer `orders` include and the
    // two extra queries per row (N+1) are replaced by a single grouped query for the page.
    const take = Math.min(filters?.take ?? 200, 200);
    const [customers, total] = await Promise.all([
      withRetry(() =>
        prisma.user.findMany({
          where,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            createdAt: true,
            status: true,
            tier: true,
            location: true,
            preferences: true,
            allergies: true,
            notes: true
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take,
          skip: filters?.skip ?? 0
        })
      ),
      filters?.withTotal ? withRetry(() => prisma.user.count({ where })) : Promise.resolve(undefined)
    ]);

    const stats = customers.length
      ? await withRetry(() =>
          prisma.order.groupBy({
            by: ['userId'],
            where: { userId: { in: customers.map((c) => c.id) } },
            _sum: { total: true },
            _count: { _all: true },
            _max: { createdAt: true }
          })
        )
      : [];
    const statsByUser = new Map(stats.map((row) => [row.userId, row]));

    const customersWithStats = customers.map((customer) => {
      const row = statsByUser.get(customer.id);
      return {
        id: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: customer.phone,
        joinDate: customer.createdAt.toISOString().split('T')[0],
        totalOrders: row?._count._all ?? 0,
        totalSpent: row?._sum.total || 0,
        lastOrder: row?._max.createdAt?.toISOString().split('T')[0] || null,
        status: customer.status,
        tier: customer.tier,
        location: customer.location,
        preferences: customer.preferences,
        allergies: customer.allergies,
        notes: customer.notes
      };
    });

    return { customers: customersWithStats, total };
  },

  async getCustomerById(id: number) {
    const customer = await prisma.user.findUnique({
      where: { id, role: 'CLIENT' },
      include: {
        orders: {
          include: {
            items: {
              include: {
                product: { select: { id: true, name: true, category: true, image: true, price: true } }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          // Bounded: the full history is available through GET /orders?customerId=<id>&limit=100
          take: 50
        }
      }
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const orderStats = await withRetry(() =>
      prisma.order.aggregate({
        where: { userId: id },
        _sum: { total: true },
        _count: true,
        _max: { createdAt: true }
      })
    );

    // Never return the password hash.
    const { password: _password, ...safeCustomer } = customer;

    return {
      ...safeCustomer,
      totalOrders: orderStats._count,
      totalSpent: orderStats._sum.total || 0,
      lastOrder: orderStats._max.createdAt?.toISOString().split('T')[0] || null
    };
  }
};
