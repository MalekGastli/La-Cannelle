import { prisma, withRetry } from '../prisma';

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

    const prevWeekStart = new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Two grouped round trips instead of 8 separate count()/aggregate() queries.
    const [statusCounts, revenueRows] = await Promise.all([
      withRetry(() =>
        prisma.order.groupBy({ by: ['status'], _count: { _all: true } })
      ),
      withRetry(() =>
        prisma.$queryRaw<Array<{ today: number | null; week: number | null; month: number | null; prev_week: number | null }>>`
          SELECT
            SUM("total") FILTER (WHERE "createdAt" >= ${today})::float8 AS today,
            SUM("total") FILTER (WHERE "createdAt" >= ${weekAgo})::float8 AS week,
            SUM("total") FILTER (WHERE "createdAt" >= ${monthAgo})::float8 AS month,
            SUM("total") FILTER (WHERE "createdAt" >= ${prevWeekStart} AND "createdAt" < ${weekAgo})::float8 AS prev_week
          FROM "orders"
          WHERE "createdAt" >= ${monthAgo < prevWeekStart ? monthAgo : prevWeekStart}
        `
      )
    ]);
    const countOf = (status: string) => statusCounts.find((row) => row.status === status)?._count._all ?? 0;
    const totalOrders = statusCounts.reduce((sum, row) => sum + row._count._all, 0);
    const pendingOrders = countOf('PENDING');
    const confirmedOrders = countOf('CONFIRMED');
    const completedOrders = countOf('COMPLETED');
    const revenue = revenueRows[0] ?? { today: null, week: null, month: null, prev_week: null };

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

    // Growth: this 7 days vs the 7 days before
    const currentWeekTotal = revenue.week || 0;
    const previousWeekTotal = revenue.prev_week || 0;
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
        today: revenue.today || 0,
        week: revenue.week || 0,
        month: revenue.month || 0,
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
