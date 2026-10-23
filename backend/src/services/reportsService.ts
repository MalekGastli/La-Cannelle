import { prisma } from '../prisma';

export const reportsService = {
  async getRevenueReport(dateFrom?: Date, dateTo?: Date) {
    const where: any = {};

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true
      }
    });

    const productIds = Array.from(new Set(
      orders.flatMap(order => order.items.map(item => item.productId))
    ));
    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, category: true }
        })
      : [];
    const productCategoryMap = new Map(products.map(product => [product.id, product.category]));

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Daily revenue breakdown
    const dailyRevenueMap = new Map<string, { revenue: number; orders: number }>();
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      const existing = dailyRevenueMap.get(date) || { revenue: 0, orders: 0 };
      dailyRevenueMap.set(date, {
        revenue: existing.revenue + order.total,
        orders: existing.orders + 1
      });
    });

    const dailyRevenue = Array.from(dailyRevenueMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Revenue by category
    const categoryMap = new Map<string, number>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const category = productCategoryMap.get(item.productId) ?? 'UNKNOWN';
        const existing = categoryMap.get(category) || 0;
        categoryMap.set(category, existing + (item.price * item.quantity));
      });
    });

    const byCategory = Array.from(categoryMap.entries())
      .map(([category, revenue]) => ({
        category,
        revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue,
      averageOrderValue,
      totalOrders,
      dailyRevenue,
      byCategory,
    };
  },

  async getPopularItems(dateFrom?: Date, dateTo?: Date) {
    const where: any = {};
    if (dateFrom || dateTo) {
      where.order = {
        createdAt: {}
      };
      if (dateFrom) where.order.createdAt.gte = dateFrom;
      if (dateTo) where.order.createdAt.lte = dateTo;
    }

    const orderItems = await prisma.orderItem.findMany({
      where,
      include: {
        order: true
      }
    });

    const popularProductIds = Array.from(new Set(orderItems.map(item => item.productId)));
    const popularProducts = popularProductIds.length
      ? await prisma.product.findMany({
          where: { id: { in: popularProductIds } },
          select: { id: true, name: true, category: true, popularity: true }
        })
      : [];
    const productMap = new Map(popularProducts.map(product => [product.id, product]));

    const itemMap = new Map<number, {
      id: number;
      name: string;
      category: string;
      orders: number;
      revenue: number;
      popularity: number;
    }>();

    orderItems.forEach(item => {
      const product = productMap.get(item.productId);
      const existing = itemMap.get(item.productId) || {
        id: item.productId,
        name: product?.name || item.name,
        category: product?.category || 'UNKNOWN',
        orders: 0,
        revenue: 0,
        popularity: product?.popularity ?? 0
      };
      existing.orders += item.quantity;
      existing.revenue += item.price * item.quantity;
      itemMap.set(item.productId, existing);
    });

    const popularItems = Array.from(itemMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);

    return popularItems;
  },

  async getCustomerAnalytics() {
    const totalCustomers = await prisma.user.count({
      where: { role: 'CLIENT' }
    });

    const customersWithOrders = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        orders: {
          some: {}
        }
      },
      include: {
        orders: true
      }
    });

    const returningCustomers = customersWithOrders.filter(c => c.orders.length > 1).length;
    const newCustomers = totalCustomers - customersWithOrders.length;

    const retentionRate = customersWithOrders.length > 0
      ? (returningCustomers / customersWithOrders.length) * 100
      : 0;

    const totalRevenue = await prisma.order.aggregate({
      _sum: { total: true }
    });

    const avgCustomerValue = customersWithOrders.length > 0
      ? (totalRevenue._sum.total || 0) / customersWithOrders.length
      : 0;

    return {
      newCustomers,
      returningCustomers,
      retentionRate: Math.round(retentionRate * 10) / 10,
      avgCustomerValue: Math.round(avgCustomerValue * 100) / 100
    };
  }
};
