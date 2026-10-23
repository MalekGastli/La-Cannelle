import { prisma } from '../prisma';

export const dashboardService = {
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Orders count
    const [totalOrders, pendingOrders, confirmedOrders, completedOrders] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'CONFIRMED' } }),
      prisma.order.count({ where: { status: 'COMPLETED' } })
    ]);

    // Revenue
    const [todayRevenue, weekRevenue, monthRevenue] = await Promise.all([
      prisma.order.aggregate({
        where: {
          createdAt: { gte: today }
        },
        _sum: { total: true }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: weekAgo }
        },
        _sum: { total: true }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: monthAgo }
        },
        _sum: { total: true }
      })
    ]);

    // Today's events
    const todaysEvents = await prisma.order.findMany({
      where: {
        eventDate: {
          gte: today,
          lt: tomorrow
        }
      },
      select: {
        id: true,
        clientName: true,
        eventTime: true,
        guests: true,
        status: true
      },
      orderBy: {
        eventTime: 'asc'
      },
      take: 10
    });

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        clientName: true,
        total: true,
        status: true,
        createdAt: true
      }
    });

    // Calculate growth (simplified - compare with previous period)
    const previousWeekRevenue = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000),
          lt: weekAgo
        }
      },
      _sum: { total: true }
    });

    const currentWeekTotal = weekRevenue._sum.total || 0;
    const previousWeekTotal = previousWeekRevenue._sum.total || 0;
    const growth = previousWeekTotal > 0
      ? ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100
      : 0;

    return {
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        confirmed: confirmedOrders,
        completed: completedOrders
      },
      revenue: {
        today: todayRevenue._sum.total || 0,
        week: weekRevenue._sum.total || 0,
        month: monthRevenue._sum.total || 0,
        growth: Math.round(growth * 10) / 10
      },
      todaysEvents: todaysEvents.map(event => ({
        id: event.id,
        client: event.clientName,
        time: event.eventTime,
        guests: event.guests,
        status: event.status.toLowerCase()
      })),
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        client: order.clientName,
        amount: order.total,
        status: order.status.toLowerCase(),
        date: order.createdAt.toISOString().split('T')[0]
      }))
    };
  }
};
